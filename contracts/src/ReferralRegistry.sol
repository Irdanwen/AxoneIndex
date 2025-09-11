// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ReferralRegistry
 * @notice On-chain referral-gated whitelist registry with one-use codes and quota per creator.
 * @dev Referral codes expire after 30 days. Pausable. CEI pattern.
 */
contract ReferralRegistry is Ownable, Pausable, ReentrancyGuard {
    constructor(address initialOwner) Ownable(initialOwner) {
        // Initialisations spécifiques au contrat (si nécessaire)
    }
    // WARNING: block.timestamp peut être manipulé par les validateurs. Utilisation de block.number pour les délais critiques.
    /// @notice Whitelist status of addresses
    mapping(address => bool) public isWhitelisted;
    /// @notice Referrer of each whitelisted address
    mapping(address => address) public referrerOf;
    /// @notice Code struct: creator, usage status, and expiration block number
    struct Code { address creator; bool used; uint256 expiresAtBlock; }
    /// @notice Mapping from codeHash to Code
    mapping(bytes32 => Code) public codes;
    /// @notice Number of codes created by each address
    mapping(address => uint256) public codesCreated;
    /// @notice List of code hashes created by a creator (for enumeration)
    mapping(address => bytes32[]) private creatorCodes;
    /// @notice Optional raw code string for a given hash (only for on-chain generated codes)
    mapping(bytes32 => string) private rawCodeOfHash;
    /// @notice Max codes per creator (configurable) - default 5
    uint256 public codesQuota = 5;
    /// @notice Pause-only for code generation
    bool public codeGenerationPaused = false;
    /// @notice Blocks per day (assuming 12s per block)
    uint256 public constant BLOCKS_PER_DAY = 24 * 60 * 60 / 12; // 7200 blocks

    /// @notice Emitted when a code is created
    event CodeCreated(bytes32 indexed codeHash, address indexed creator, uint256 creatorCount, uint256 quota);
    /// @notice Emitted when a code is used
    event CodeUsed(bytes32 indexed codeHash, address indexed user, address indexed referrer);
    /// @notice Emitted when a user is whitelisted
    event Whitelisted(address indexed user, bytes32 indexed codeHash, address indexed referrer);
    /// @notice Emitted when a code is revoked by the owner
    event CodeRevoked(bytes32 indexed codeHash, address indexed revoker);

    /// @notice Already whitelisted
    error AlreadyWhitelisted();
    /// @notice Invalid code
    error InvalidCode();
    /// @notice Code already used
    error CodeAlreadyUsed();
    /// @notice Self-referral not allowed
    error SelfReferral();
    /// @notice Quota reached
    error QuotaReached();
    /// @notice Code has expired
    error CodeExpired();
    /// @notice Only the original creator can overwrite their code
    error UnauthorizedOverwrite();
    /// @notice Address cannot be zero
    error ZeroAddress();
    /// @notice Code does not exist
    error CodeNotFound();
    /// @notice Code generation is temporarily paused
    error CodeGenerationPaused();
    /// @notice Max number of codes exceeded for the creator
    error MaxCodesExceeded();

    /// @notice Restricts to whitelisted addresses
    modifier onlyWhitelisted() {
        require(isWhitelisted[msg.sender], "Not whitelisted");
        _;
    }

    

    /// @notice Update the global codes quota
    function setQuota(uint256 newQuota) external onlyOwner {
        codesQuota = newQuota;
    }

    /// @notice Toggle dedicated pause for code generation
    function setCodeGenerationPaused(bool paused) external onlyOwner {
        codeGenerationPaused = paused;
    }

    /// @dev Generates a pseudo-random referral code string of fixed length
    function _generateCodeString(uint256 length) internal view returns (string memory) {
        bytes memory alphabet = bytes("ABCDEFGHJKLMNPQRSTUVWXYZ23456789");
        if (length == 0) {
            length = 10;
        }
        bytes memory result = new bytes(length);
        bytes32 seed = keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, codesCreated[msg.sender], gasleft()));
        for (uint256 i = 0; i < length; i++) {
            bytes32 h = keccak256(abi.encodePacked(seed, i));
            uint256 idx = uint8(h[i % 32]) % alphabet.length;
            result[i] = alphabet[idx];
        }
        return string(result);
    }

    /**
     * @notice Create a new referral code (hash only)
     * @param codeHash The bytes32 hash of the code (must be unique, nonzero)
     */
    function createCode(bytes32 codeHash)
        external
        nonReentrant
        whenNotPaused
        onlyWhitelisted
    {
        if (codeHash == bytes32(0)) revert InvalidCode();
        // Handle potential collision securely: only original creator can overwrite
        if (codes[codeHash].creator != address(0)) {
            if (codes[codeHash].creator != msg.sender) revert UnauthorizedOverwrite();
            codesCreated[msg.sender]--;
            delete codes[codeHash];
        }
        uint256 created = codesCreated[msg.sender];
        if (created >= codesQuota) revert MaxCodesExceeded();
        
        // Toutes les vérifications passées, procéder à la création
        codes[codeHash] = Code({creator: msg.sender, used: false, expiresAtBlock: block.number + 30 * BLOCKS_PER_DAY}); // 30 days in blocks
        codesCreated[msg.sender] = created + 1;
        creatorCodes[msg.sender].push(codeHash);
        
        // Émettre l'événement seulement après la création réussie
        emit CodeCreated(codeHash, msg.sender, created + 1, codesQuota);
    }

    /**
     * @notice Create a new referral code on-chain (no args)
     * @dev Generates a code string, stores its hash and raw string, and returns the raw code
     */
    function createCode()
        external
        nonReentrant
        whenNotPaused
        onlyWhitelisted
        returns (string memory)
    {
        if (codeGenerationPaused) revert CodeGenerationPaused();
        uint256 created = codesCreated[msg.sender];
        if (created >= codesQuota) revert MaxCodesExceeded();

        // Try a few times to avoid rare collisions
        bytes32 codeHash;
        string memory raw;
        for (uint256 attempt = 0; attempt < 5; attempt++) {
            raw = _generateCodeString(10);
            codeHash = keccak256(bytes(raw));
            if (codes[codeHash].creator == address(0)) {
                break;
            }
            if (attempt == 4) revert InvalidCode();
        }

        // Toutes les vérifications passées, procéder à la création
        codes[codeHash] = Code({creator: msg.sender, used: false, expiresAtBlock: block.number + 30 * BLOCKS_PER_DAY}); // 30 days in blocks
        rawCodeOfHash[codeHash] = raw;
        creatorCodes[msg.sender].push(codeHash);
        codesCreated[msg.sender] = created + 1;

        // Émettre l'événement seulement après la création réussie
        emit CodeCreated(codeHash, msg.sender, created + 1, codesQuota);
        return raw;
    }

    /**
     * @notice Use a referral code to get whitelisted
     * @param codeHash The bytes32 hash of the code
     */
    function useCode(bytes32 codeHash)
        external
        nonReentrant
        whenNotPaused
    {
        if (isWhitelisted[msg.sender]) revert AlreadyWhitelisted();
        Code storage code = codes[codeHash];
        address creator = code.creator;
        if (creator == address(0)) revert InvalidCode();
        if (code.used) revert CodeAlreadyUsed();
        if (creator == msg.sender) revert SelfReferral();
        if (block.number > code.expiresAtBlock) revert CodeExpired();
        // Effects
        code.used = true;
        isWhitelisted[msg.sender] = true;
        referrerOf[msg.sender] = creator;
        // Interactions
        emit CodeUsed(codeHash, msg.sender, creator);
        emit Whitelisted(msg.sender, codeHash, creator);
    }

    /// @notice Returns the list of creator's unused and non-expired raw codes
    function getUnusedCodes(address creator) external view returns (string[] memory) {
        bytes32[] storage list = creatorCodes[creator];
        uint256 count;
        for (uint256 i = 0; i < list.length; i++) {
            Code storage c = codes[list[i]];
            if (c.creator == creator && !c.used && block.number <= c.expiresAtBlock) {
                // only include if we know the raw code string
                if (bytes(rawCodeOfHash[list[i]]).length > 0) {
                    count++;
                }
            }
        }
        string[] memory out = new string[](count);
        if (count == 0) return out;
        uint256 j;
        for (uint256 i = 0; i < list.length; i++) {
            Code storage c = codes[list[i]];
            if (c.creator == creator && !c.used && block.number <= c.expiresAtBlock) {
                string memory raw = rawCodeOfHash[list[i]];
                if (bytes(raw).length > 0) {
                    out[j++] = raw;
                }
            }
        }
        return out;
    }

    /// @notice Revoke a code and recover quota (owner only)
    function revokeCode(bytes32 codeHash) external onlyOwner {
        Code storage code = codes[codeHash];
        if (code.creator == address(0)) revert CodeNotFound();
        codesCreated[code.creator]--; // Récupère le quota utilisé
        delete codes[codeHash]; // Supprime le code
        emit CodeRevoked(codeHash, msg.sender);
    }

    /**
     * @notice Directly whitelist a user (owner only, for bootstrap)
     * @param user The address to whitelist
     */
    function whitelistDirect(address user) external onlyOwner {
        if (user == address(0)) revert ZeroAddress();
        isWhitelisted[user] = true;
        emit Whitelisted(user, bytes32(0), address(0));
    }

    /**
     * @notice Pause contract actions (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract actions (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
