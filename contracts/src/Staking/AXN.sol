// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
/// @title AXN Token avec inflation continue et exclusions de supply circulante
/// @notice ERC20 supportant une inflation proportionnelle au temps écoulé et la possibilité
/// de retirer certaines adresses du calcul de la supply circulante (trésorerie, vesting, etc.).
/// @dev Formule d'inflation continue:
/// amount = circulating * ANNUAL_INFLATION_BASIS_POINTS * timeElapsed / (SECONDS_IN_YEAR * 10000)
contract AxoneToken is ERC20Burnable, ERC20Permit, Pausable, Ownable, ReentrancyGuard {
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 1e18;
    uint256 public constant ANNUAL_INFLATION_BASIS_POINTS = 300; // 3% annual
    uint256 public constant DAYS_IN_YEAR = 365;
    uint256 public constant SECONDS_IN_YEAR = 365 days;
    uint256 public constant MIN_INTERVAL = 1 hours; // Réduit pour plus de flexibilité

    uint256 public inflationInterval = 1 days;
    uint256 public lastMintTimestamp;

    address public inflationRecipient;

    // Addresses à exclure du calcul de la supply circulante (ex: trésorerie, vesting, burn)
    mapping(address => bool) private isExcludedFromCirculating;
    address[] private excludedAddresses;

    event DailyInflationMinted(uint256 amountMinted, uint256 timestamp, uint256 timeElapsed);
    event InflationRecipientChanged(address indexed oldRecipient, address indexed newRecipient);
    event InflationIntervalChanged(uint256 oldInterval, uint256 newInterval);
    event ExcludedFromCirculating(address indexed account, bool isExcluded);

    constructor(address _initialRecipient, address _inflationRecipient, address _initialOwner)
        ERC20("Axone", "AXN")
        ERC20Permit("Axone")
        Ownable(_initialOwner)
    {
        require(_initialRecipient != address(0), "Invalid initial recipient");
        require(_inflationRecipient != address(0), "Invalid inflation recipient");

        _mint(_initialRecipient, INITIAL_SUPPLY);
        inflationRecipient = _inflationRecipient;
        lastMintTimestamp = block.timestamp - inflationInterval; // allow first mint immediately

        // Exclure l'adresse zéro par sécurité conceptuelle même si son solde est 0 par définition
        _setExcludedFromCirculating(address(0), true);
    }

    /// @notice Frappe l'inflation accumulée depuis la dernière frappe vers `inflationRecipient`.
    /// @dev Utilise une approximation linéaire continue:
    /// amount = circulating * annualRateBps * dt / (SECONDS_IN_YEAR * 10000).
    /// Revert si aucun montant n'est dû pour éviter des frappes nulles.
    function mintInflation() external whenNotPaused nonReentrant {
        require(block.timestamp >= lastMintTimestamp + inflationInterval, "Too early");

        uint256 timeElapsed = block.timestamp - lastMintTimestamp;
        uint256 circulating = circulatingSupply();
        
        // Calcul optimisé : inflation basée sur le temps écoulé
        // Formule : (circulating * annual_rate * time_elapsed) / (seconds_in_year * 10000)
        uint256 amountToMint = (circulating * ANNUAL_INFLATION_BASIS_POINTS * timeElapsed) / (SECONDS_IN_YEAR * 10000);

        require(amountToMint > 0, "Nothing to mint");

        _mint(inflationRecipient, amountToMint);
        lastMintTimestamp = block.timestamp;

        emit DailyInflationMinted(amountToMint, block.timestamp, timeElapsed);
    }

    /// @notice Frappe directe conforme à IMintable pour compatibilité avec EmissionController
    /// @dev Restreinte au propriétaire du contrat (protection anti-frappe arbitraire)
    /// @param to Adresse bénéficiaire de la frappe
    /// @param amount Montant à frapper
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function setInflationRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Zero address");
        emit InflationRecipientChanged(inflationRecipient, newRecipient);
        inflationRecipient = newRecipient;
    }

    function setInflationInterval(uint256 newInterval) external onlyOwner {
        require(newInterval >= MIN_INTERVAL, "Too short");
        emit InflationIntervalChanged(inflationInterval, newInterval);
        inflationInterval = newInterval;
    }

    /// @notice Retourne le prochain timestamp autorisant un nouvel appel à `mintInflation`.
    function nextMintTimestamp() external view returns (uint256) {
        return lastMintTimestamp + inflationInterval;
    }

    /// @notice Supply circulante = totalSupply - somme des soldes des adresses exclues.
    /// @dev Itère sur `excludedAddresses`; coût potentiellement élevé si la liste est longue.
    /// À privilégier pour les lectures off-chain (call).
    function circulatingSupply() public view returns (uint256) {
        uint256 supply = totalSupply();
        uint256 len = excludedAddresses.length;
        for (uint256 i = 0; i < len; i++) {
            address account = excludedAddresses[i];
            if (isExcludedFromCirculating[account]) {
                uint256 bal = balanceOf(account);
                if (bal > 0) {
                    supply -= bal;
                }
            }
        }
        return supply;
    }

    /// @notice Marque une adresse comme exclue/incluse du calcul de la supply circulante.
    /// @param account Adresse à mettre à jour.
    /// @param excluded True pour exclure, False pour inclure.
    function setExcludedFromCirculating(address account, bool excluded) external onlyOwner {
        _setExcludedFromCirculating(account, excluded);
    }

    function isAddressExcludedFromCirculating(address account) external view returns (bool) {
        return isExcludedFromCirculating[account];
    }

    /// @notice Retourne la liste actuelle des adresses exclues.
    function getExcludedAddresses() external view returns (address[] memory) {
        return excludedAddresses;
    }

    function _setExcludedFromCirculating(address account, bool excluded) internal {
        require(account != address(0) || excluded, "Zero disallowed unless excluding");
        bool current = isExcludedFromCirculating[account];
        if (current == excluded) {
            emit ExcludedFromCirculating(account, excluded);
            return;
        }
        isExcludedFromCirculating[account] = excluded;
        if (excluded) {
            // Ajouter à la liste si nouvellement exclu et pas déjà présent
            bool exists = false;
            uint256 len = excludedAddresses.length;
            for (uint256 i = 0; i < len; i++) {
                if (excludedAddresses[i] == account) { exists = true; break; }
            }
            if (!exists) {
                excludedAddresses.push(account);
            }
        }
        emit ExcludedFromCirculating(account, excluded);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal override
    {
        super._beforeTokenTransfer(from, to, amount);
        require(!paused(), "Token paused");
    }

    function rescueTokens(address token, uint256 amount, address to) external onlyOwner {
        require(token != address(this), "Cannot rescue AXN");
        IERC20(token).transfer(to, amount);
    }

    function renounceOwnership() public override onlyOwner {
        super.renounceOwnership();
    }
}

