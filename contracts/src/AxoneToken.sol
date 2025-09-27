// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

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
    
    // Optimisation gaz : tracking des soldes exclus
    mapping(address => uint256) public excludedBalances;
    uint256 public totalExcludedBalance;

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

    /// @notice Fonction mint publique pour l'EmissionController
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Zero address");
        _mint(to, amount);
        
        // Mettre à jour le solde exclus si l'adresse est exclue
        if (isExcludedFromCirculating[to]) {
            excludedBalances[to] += amount;
            totalExcludedBalance += amount;
        }
    }

    function mintInflation() external whenNotPaused nonReentrant {
        require(block.timestamp >= lastMintTimestamp + inflationInterval, "Too early");

        uint256 timeElapsed = block.timestamp - lastMintTimestamp;
        uint256 circulating = circulatingSupply();
        
        // Calcul optimisé : inflation basée sur le temps écoulé
        // Formule : (circulating * annual_rate * time_elapsed) / (seconds_in_year * 10000)
        uint256 amountToMint = (circulating * ANNUAL_INFLATION_BASIS_POINTS * timeElapsed) / (SECONDS_IN_YEAR * 10000);

        require(amountToMint > 0, "Nothing to mint");

        _mint(inflationRecipient, amountToMint);
        
        // Mettre à jour le solde exclus si l'adresse est exclue
        if (isExcludedFromCirculating[inflationRecipient]) {
            excludedBalances[inflationRecipient] += amountToMint;
            totalExcludedBalance += amountToMint;
        }
        
        lastMintTimestamp = block.timestamp;

        emit DailyInflationMinted(amountToMint, block.timestamp, timeElapsed);
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

    function nextMintTimestamp() external view returns (uint256) {
        return lastMintTimestamp + inflationInterval;
    }

    // Calcul de la supply circulante = totalSupply - totalExcludedBalance (optimisé)
    function circulatingSupply() public view returns (uint256) {
        return totalSupply() - totalExcludedBalance;
    }

    function setExcludedFromCirculating(address account, bool excluded) external onlyOwner {
        _setExcludedFromCirculating(account, excluded);
    }

    function isAddressExcludedFromCirculating(address account) external view returns (bool) {
        return isExcludedFromCirculating[account];
    }

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
        
        // Mettre à jour le tracking des soldes exclus
        uint256 currentBalance = balanceOf(account);
        if (current) {
            // Retirer de l'exclusion : soustraire du total
            totalExcludedBalance -= excludedBalances[account];
            excludedBalances[account] = 0;
        } else {
            // Ajouter à l'exclusion : ajouter au total
            excludedBalances[account] = currentBalance;
            totalExcludedBalance += currentBalance;
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

    function _update(address from, address to, uint256 value)
        internal override
    {
        require(!paused(), "Token paused");
        
        // Mettre à jour les soldes exclus lors des transferts
        _updateExcludedBalances(from, to, value);
        
        // Appeler la fonction parent pour effectuer le transfert
        super._update(from, to, value);
        
        // Gérer le cas du burn (to == address(0))
        if (to == address(0) && isExcludedFromCirculating[from]) {
            // Le burn réduit le solde exclus
            excludedBalances[from] -= value;
            totalExcludedBalance -= value;
        }
    }
    
    // Fonction interne pour mettre à jour les soldes exclus lors des transferts
    function _updateExcludedBalances(address from, address to, uint256 amount) internal {
        // Mettre à jour le solde de l'expéditeur si exclu (ignorer address(0) pour les mint)
        if (from != address(0) && isExcludedFromCirculating[from]) {
            uint256 oldBalance = excludedBalances[from];
            uint256 newBalance = balanceOf(from) - amount; // balanceOf(from) est le solde AVANT le transfert
            excludedBalances[from] = newBalance;
            totalExcludedBalance = totalExcludedBalance - oldBalance + newBalance;
        }
        
        // Mettre à jour le solde du destinataire si exclu (ignorer address(0) pour les burn)
        if (to != address(0) && isExcludedFromCirculating[to]) {
            uint256 oldBalance = excludedBalances[to];
            uint256 newBalance = balanceOf(to) + amount; // balanceOf(to) est le solde AVANT le transfert
            excludedBalances[to] = newBalance;
            totalExcludedBalance = totalExcludedBalance - oldBalance + newBalance;
        }
    }

    function rescueTokens(address token, uint256 amount, address to) external onlyOwner {
        require(token != address(this), "Cannot rescue AXN");
        IERC20(token).transfer(to, amount);
    }

    function renounceOwnership() public override onlyOwner {
        super.renounceOwnership();
    }
}

