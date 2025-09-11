// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AxoneSale is Pausable, Ownable, ReentrancyGuard {
    IERC20 public immutable axnToken;
    IERC20 public immutable usdcToken;

    address public treasury;
    uint256 public constant AXN_DECIMALS = 1e18;
    uint256 public constant USDC_DECIMALS = 1e8;
    uint256 public constant PRICE_PER_AXN_IN_USDC = USDC_DECIMALS / 10; // 0.1 USDC (exprimé en 8 décimales)
    uint256 public constant MIN_PURCHASE = 1000 * 1e18; // 1000 AXN minimum

    uint256 public totalSold;
    uint256 public saleCap = 50_000_000 * AXN_DECIMALS;
    bool public saleEnded;
    
    // Slippage protection
    uint256 public maxSlippageBps = 100; // 1% max slippage by default
    uint256 public lastPriceUpdateBlock;
    uint256 public lastPricePerAxn;

    event TokensPurchased(address indexed buyer, uint256 axnAmount, uint256 usdcAmount);
    event TreasuryUpdated(address indexed newTreasury);
    event SaleEnded();
    event UnsoldTokensWithdrawn(uint256 amount);
    event SlippageToleranceUpdated(uint256 newMaxSlippageBps);
    event PriceUpdated(uint256 newPrice, uint256 blockNumber);

    constructor(address _axnToken, address _usdcToken) Ownable(msg.sender) {
        require(_axnToken != address(0) && _usdcToken != address(0), "Invalid token address");
        axnToken = IERC20(_axnToken);
        usdcToken = IERC20(_usdcToken);
        lastPricePerAxn = PRICE_PER_AXN_IN_USDC;
        lastPriceUpdateBlock = block.number;
    }

    function buyWithUSDC(uint256 axnAmount) external whenNotPaused nonReentrant {
        require(!saleEnded, "Sale ended");
        require(treasury != address(0), "Treasury not set");
        require(axnAmount >= MIN_PURCHASE, "Below minimum purchase");
        require(totalSold + axnAmount <= saleCap, "Exceeds cap");
        require(axnToken.balanceOf(address(this)) >= axnAmount, "Not enough AXN in contract");

        // Calculate current price with slippage protection
        uint256 currentPrice = _getCurrentPrice();
        uint256 usdcAmount = (axnAmount * currentPrice) / AXN_DECIMALS;
        require(usdcAmount > 0, "Invalid USDC amount");

        // Transfer USDC first (pull pattern)
        require(usdcToken.transferFrom(msg.sender, treasury, usdcAmount), "USDC transfer failed");
        
        // Transfer AXN after successful USDC transfer
        require(axnToken.transfer(msg.sender, axnAmount), "AXN transfer failed");

        totalSold += axnAmount;

        emit TokensPurchased(msg.sender, axnAmount, usdcAmount);

        // Auto-end sale if cap reached
        if (totalSold >= saleCap) {
            saleEnded = true;
            emit SaleEnded();
        }
    }

    function endSale() external onlyOwner {
        require(!saleEnded, "Already ended");
        saleEnded = true;
        emit SaleEnded();
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    /// @notice Update the price per AXN (owner only)
    function updatePrice(uint256 newPricePerAxn) external onlyOwner {
        require(newPricePerAxn > 0, "Invalid price");
        lastPricePerAxn = newPricePerAxn;
        lastPriceUpdateBlock = block.number;
        emit PriceUpdated(newPricePerAxn, block.number);
    }

    /// @notice Set maximum slippage tolerance in basis points
    function setMaxSlippageBps(uint256 _maxSlippageBps) external onlyOwner {
        require(_maxSlippageBps <= 1000, "Slippage too high"); // Max 10%
        maxSlippageBps = _maxSlippageBps;
        emit SlippageToleranceUpdated(_maxSlippageBps);
    }

    function withdrawUnsoldTokens(address to) external onlyOwner {
        require(saleEnded, "Sale not ended");
        require(to != address(0), "Invalid address");
        uint256 remaining = axnToken.balanceOf(address(this));
        require(remaining > 0, "No tokens to withdraw");
        require(axnToken.transfer(to, remaining), "Withdraw failed");
        emit UnsoldTokensWithdrawn(remaining);
    }

    function remainingTokens() public view returns (uint256) {
        return saleCap - totalSold;
    }

    function isSaleActive() public view returns (bool) {
        return !saleEnded && axnToken.balanceOf(address(this)) > 0 && !paused();
    }

    /// @notice Get current price with slippage protection
    function _getCurrentPrice() internal view returns (uint256) {
        // If price was updated recently (within same block), use the updated price
        if (block.number == lastPriceUpdateBlock) {
            return lastPricePerAxn;
        }
        
        // Otherwise, apply slippage protection based on time elapsed
        uint256 blocksElapsed = block.number - lastPriceUpdateBlock;
        uint256 maxPriceIncrease = (lastPricePerAxn * maxSlippageBps) / 10000;
        
        // Allow gradual price increase based on blocks elapsed (max 1 block = 1 BPS increase)
        uint256 allowedIncrease = (lastPricePerAxn * maxSlippageBps * blocksElapsed) / (10000 * 100); // 100 blocks = full slippage
        if (allowedIncrease > maxPriceIncrease) {
            allowedIncrease = maxPriceIncrease;
        }
        
        return lastPricePerAxn + allowedIncrease;
    }

    /// @notice Get current price for external queries
    function getCurrentPrice() external view returns (uint256) {
        return _getCurrentPrice();
    }

    /// @notice Get price information
    function getPriceInfo() external view returns (uint256 currentPrice, uint256 lastPrice, uint256 lastUpdateBlock, uint256 maxSlippage) {
        return (_getCurrentPrice(), lastPricePerAxn, lastPriceUpdateBlock, maxSlippageBps);
    }

    // Emergency pause function
    function emergencyPause() external onlyOwner {
        _pause();
    }

    function emergencyUnpause() external onlyOwner {
        _unpause();
    }

    // Prevent direct ETH transfers
    fallback() external payable {
        revert("Direct ETH not accepted");
    }

    receive() external payable {
        revert("ETH not accepted");
    }
}


