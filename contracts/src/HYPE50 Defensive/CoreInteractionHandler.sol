// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {HLConstants} from "./utils/HLConstants.sol";
import {CoreHandlerLib} from "./utils/CoreHandlerLib.sol";
import {Rebalancer50Lib} from "./Rebalancer50Lib.sol";
import {L1Read} from "./interfaces/L1Read.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

interface ICoreWriter {
    function sendRawAction(bytes calldata data) external;
}

// IERC20 importé via OpenZeppelin ci-dessus

contract CoreInteractionHandler is Pausable {
    using SafeERC20 for IERC20;
    

    // Immutable system contracts
    L1Read public immutable l1read;
    ICoreWriter public immutable coreWriter;
    IERC20 public immutable usdc;

    // Config
    address public vault;
    address public usdcCoreSystemAddress;
    uint64 public usdcCoreTokenId;
    address public hypeCoreSystemAddress;
    uint64 public hypeCoreTokenId;
    // Spot market ids (BTC/USDC and HYPE/USDC)
    uint32 public spotBTC;
    uint32 public spotHYPE;
    // Spot token ids for balances
    uint64 public spotTokenBTC;
    uint64 public spotTokenHYPE;

    // Risk params
    uint64 public maxOutboundPerEpoch;
    uint64 public epochLength;
    uint64 public lastEpochStart;
    uint64 public sentThisEpoch;
    // Blocks per epoch (assuming 12s per block)
    uint64 public constant BLOCKS_PER_EPOCH = 1; // 1 block = 12 seconds
    uint64 public maxSlippageBps; // for IOC limit price
    uint64 public marketEpsilonBps; // widen limit to mimic marketable IOC
    uint64 public deadbandBps;
    uint64 public maxOracleDeviationBps;

    uint64 public lastPxBtc1e8;
    uint64 public lastPxHype1e8;
    bool public pxInitB;
    bool public pxInitH;

    // Fees config
    address public feeVault;
    uint64 public feeBps; // out of 10_000

    error NotVault();
    error NotOwner();
    error NotRebalancer();
    error RateLimited();
    error OracleZero();

    event LimitsSet(uint64 maxOutboundPerEpoch, uint64 epochLength);
    event ParamsSet(uint64 maxSlippageBps, uint64 marketEpsilonBps, uint64 deadbandBps);
    event VaultSet(address vault);
    event UsdcCoreLinkSet(address systemAddress, uint64 tokenId);
    event SpotIdsSet(uint32 btcSpot, uint32 hypeSpot);
    event SpotTokenIdsSet(uint64 usdcToken, uint64 btcToken, uint64 hypeToken);
    event HypeCoreLinkSet(address systemAddress, uint64 tokenId);
    event OutboundToCore(bytes data);
    event InboundFromCore(uint64 amount1e8);
    event Rebalanced(int256 dBtc1e18, int256 dHype1e18);
    event FeeConfigSet(address feeVault, uint64 feeBps);
    event SweepWithFee(uint64 gross1e8, uint64 fee1e8, uint64 net1e8);
    event RebalancerSet(address rebalancer);

    address public owner;
    address public rebalancer;

    modifier onlyOwner(){
        if(msg.sender!=owner) revert NotOwner();
        _;
    }

    modifier onlyVault() {
        if (msg.sender != vault) revert NotVault();
        _;
    }

    modifier onlyRebalancer() {
        if (msg.sender != rebalancer) revert NotRebalancer();
        _;
    }

    constructor(L1Read _l1read, ICoreWriter _coreWriter, IERC20 _usdc, uint64 _maxOutboundPerEpoch, uint64 _epochLength, address _feeVault, uint64 _feeBps) {
        l1read = _l1read;
        coreWriter = _coreWriter;
        usdc = _usdc;
        lastEpochStart = uint64(block.number);
        owner = msg.sender;
        // Defaults
        require(_epochLength > 0, "EPOCH_0");
        require(_maxOutboundPerEpoch > 0, "MAX_OUTBOUND_0");
        epochLength = _epochLength;
        maxOutboundPerEpoch = _maxOutboundPerEpoch;
        if (maxSlippageBps == 0) maxSlippageBps = 50;
        if (marketEpsilonBps == 0) marketEpsilonBps = 10;
        deadbandBps = 50; // par défaut 0.5%
        maxOracleDeviationBps = 500; // 5%
        require(_feeBps <= 10_000, "FEE_BPS");
        feeVault = _feeVault;
        feeBps = _feeBps;
        emit FeeConfigSet(_feeVault, _feeBps);
    }

    receive() external payable {}

    // Admin setters (to be called by deployer/owner offchain in this sample; add auth as needed)
    function setVault(address _vault) external onlyOwner {
        vault = _vault;
        emit VaultSet(_vault);
    }

    function setUsdcCoreLink(address systemAddr, uint64 tokenId) external onlyOwner {
        usdcCoreSystemAddress = systemAddr;
        usdcCoreTokenId = tokenId;
        emit UsdcCoreLinkSet(systemAddr, tokenId);
    }

    function setHypeCoreLink(address systemAddr, uint64 tokenId) external onlyOwner {
        hypeCoreSystemAddress = systemAddr;
        hypeCoreTokenId = tokenId;
        emit HypeCoreLinkSet(systemAddr, tokenId);
    }

    function setSpotIds(uint32 btcSpot, uint32 hypeSpot) external onlyOwner {
        spotBTC = btcSpot;
        spotHYPE = hypeSpot;
        emit SpotIdsSet(btcSpot, hypeSpot);
    }

    function setSpotTokenIds(uint64 usdcToken, uint64 btcToken, uint64 hypeToken) external onlyOwner {
        if (usdcCoreTokenId == 0) {
            usdcCoreTokenId = usdcToken;
        } else {
            require(usdcToken == usdcCoreTokenId, "USDC_ID_CONFLICT");
        }
        spotTokenBTC = btcToken;
        spotTokenHYPE = hypeToken;
        emit SpotTokenIdsSet(usdcToken, btcToken, hypeToken);
    }

    function setLimits(uint64 _maxOutboundPerEpoch, uint64 _epochLength) external onlyOwner {
        require(_epochLength > 0, "EPOCH_0");
        require(_maxOutboundPerEpoch > 0, "MAX_OUTBOUND_0");
        maxOutboundPerEpoch = _maxOutboundPerEpoch;
        epochLength = _epochLength;
        emit LimitsSet(_maxOutboundPerEpoch, _epochLength);
    }

    function setParams(uint64 _maxSlippageBps, uint64 _marketEpsilonBps, uint64 _deadbandBps) external onlyOwner {
        require(_deadbandBps <= 50, "DEADBAND_TOO_HIGH");
        maxSlippageBps = _maxSlippageBps;
        marketEpsilonBps = _marketEpsilonBps;
        deadbandBps = _deadbandBps;
        emit ParamsSet(_maxSlippageBps, _marketEpsilonBps, _deadbandBps);
    }

    function setMaxOracleDeviationBps(uint64 _maxDeviationBps) external onlyOwner {
        require(_maxDeviationBps > 0 && _maxDeviationBps <= 5000, "BAD_DEV_BPS");
        maxOracleDeviationBps = _maxDeviationBps;
    }

    function setFeeConfig(address _feeVault, uint64 _feeBps) external onlyOwner {
        require(_feeBps <= 10_000, "FEE_BPS");
        feeVault = _feeVault;
        feeBps = _feeBps;
        emit FeeConfigSet(_feeVault, _feeBps);
    }

    function setRebalancer(address _rebalancer) external onlyOwner {
        rebalancer = _rebalancer;
        emit RebalancerSet(_rebalancer);
    }

    /// @notice Pause all critical operations in case of emergency
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause all operations
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Emergency pause function for critical situations
    function emergencyPause() external onlyOwner {
        _pause();
    }

    // Views (spot)
    function spotBalance(address coreUser, uint64 tokenId) public view returns (uint64) {
        L1Read.SpotBalance memory b = l1read.spotBalance(coreUser, tokenId);
        return b.total;
    }

    /// @notice Get spot balance converted to wei decimals
    /// @dev Converts SpotBalance.total from szDecimals to weiDecimals format
    /// @param coreUser The user address
    /// @param tokenId The token ID
    /// @return balanceInWei The balance converted to wei decimals (uint256 for precision)
    function spotBalanceInWei(address coreUser, uint64 tokenId) internal view returns (uint256) {
        return CoreHandlerLib.spotBalanceInWei(l1read, coreUser, tokenId);
    }

    function spotOraclePx1e8(uint32 spotAsset) public view returns (uint64) {
        uint64 px = l1read.spotPx(spotAsset);
        if (px == 0) revert OracleZero();
        return px;
    }

    // Public oracle getters for vault accounting
    function oraclePxHype1e8() external view returns (uint64) {
        return spotOraclePx1e8(spotHYPE);
    }

    function oraclePxBtc1e8() external view returns (uint64) {
        return spotOraclePx1e8(spotBTC);
    }

    function equitySpotUsd1e18() public view returns (uint256) {
        // Core spot equity only. EVM USDC est compté dans le Vault.
        // CORRECTION AUDIT: Utilisation de spotBalanceInWei pour conversion correcte szDecimals -> weiDecimals
        uint256 usdcBalWei = spotBalanceInWei(address(this), usdcCoreTokenId);
        uint256 btcBalWei = spotBalanceInWei(address(this), spotTokenBTC);
        uint256 hypeBalWei = spotBalanceInWei(address(this), spotTokenHYPE);

        uint256 pxB1e8 = spotOraclePx1e8(spotBTC);
        uint256 pxH1e8 = spotOraclePx1e8(spotHYPE);

        // Récupération des infos de décimales pour chaque token
        L1Read.TokenInfo memory usdcInfo = l1read.tokenInfo(uint32(usdcCoreTokenId));
        L1Read.TokenInfo memory btcInfo = l1read.tokenInfo(uint32(spotTokenBTC));
        L1Read.TokenInfo memory hypeInfo = l1read.tokenInfo(uint32(spotTokenHYPE));

        // Conversion USDC: balanceWei * 10^(18 - weiDecimals)
        uint256 usdc1e18 = usdcBalWei * (10 ** (18 - usdcInfo.weiDecimals));
        
        // Conversion assets: valueUsd1e18 = (balanceWei / 10^weiDecimals) * (price1e8 / 10^8) * 10^18
        // Simplifié: balanceWei * price1e8 * 10^(18 - weiDecimals - 8)
        uint256 btcUsd1e18;
        uint256 hypeUsd1e18;
        
        if (btcInfo.weiDecimals + 8 <= 18) {
            btcUsd1e18 = btcBalWei * pxB1e8 * (10 ** (18 - btcInfo.weiDecimals - 8));
        } else {
            btcUsd1e18 = (btcBalWei * pxB1e8) / (10 ** (btcInfo.weiDecimals + 8 - 18));
        }
        
        if (hypeInfo.weiDecimals + 8 <= 18) {
            hypeUsd1e18 = hypeBalWei * pxH1e8 * (10 ** (18 - hypeInfo.weiDecimals - 8));
        } else {
            hypeUsd1e18 = (hypeBalWei * pxH1e8) / (10 ** (hypeInfo.weiDecimals + 8 - 18));
        }
        
        return usdc1e18 + btcUsd1e18 + hypeUsd1e18;
    }

    // Core flows
    function executeDeposit(uint64 usdc1e8, bool forceRebalance) external onlyVault whenNotPaused {
        if (usdcCoreSystemAddress == address(0)) revert("USDC_CORE_NOT_SET");
        _rateLimit(usdc1e8);
        // Pull USDC from vault to handler (EVM token has 8 decimals => 1:1)
        uint256 evmAmt = uint256(usdc1e8);
        usdc.safeTransferFrom(msg.sender, address(this), evmAmt);
        // EVM->Core spot: send to system address to credit Core spot balance
        usdc.safeTransfer(usdcCoreSystemAddress, evmAmt);
        // After crediting USDC spot, place two IOC buys ~50/50 into BTC and HYPE
        uint256 halfUsd1e18 = (uint256(usdc1e8) * 1e10) / 2;
        uint64 pxB = _validatedOraclePx1e8(true);
        uint64 pxH = _validatedOraclePx1e8(false);
        uint64 szB1e8 = _toSz1e8(int256(halfUsd1e18), pxB);
        uint64 szH1e8 = _toSz1e8(int256(halfUsd1e18), pxH);
        if (szB1e8 > 0) {
            uint64 pxBLimit = _limitFromOracle(pxB, true);
            _sendLimitOrderDirect(spotBTC, true, pxBLimit, szB1e8, 0);
        }
        if (szH1e8 > 0) {
            uint64 pxHLimit = _limitFromOracle(pxH, true);
            _sendLimitOrderDirect(spotHYPE, true, pxHLimit, szH1e8, 0);
        }
        if (forceRebalance) {
            _rebalance(0, 0);
        }
    }

    // HYPE deposit (native): move HYPE to Core, sell all to USDC, then allocate 50/50 BTC/HYPE
    function executeDepositHype(bool forceRebalance) external payable onlyVault whenNotPaused {
        require(hypeCoreSystemAddress != address(0) && usdcCoreSystemAddress != address(0), "CORE_NOT_SET");
        uint256 hype1e18 = msg.value;
        require(hype1e18 > 0, "AMOUNT=0");
        // EVM->Core spot: send native HYPE to system address to credit Core spot balance
        (bool ok, ) = payable(hypeCoreSystemAddress).call{value: hype1e18}("");
        require(ok, "NATIVE_SEND_FAIL");
        // Compute USD notional and sell HYPE -> USDC on Core via IOC
        uint64 pxH = _validatedOraclePx1e8(false);
        // USD 1e8 = (HYPE 1e18 / 1e18) * px1e8
        uint64 usd1e8 = SafeCast.toUint64((hype1e18 * uint256(pxH)) / 1e18);
        // Apply outbound rate limit based on USD notional like USDC deposit
        _rateLimit(usd1e8);
        _sellAssetForUsd(spotHYPE, spotTokenHYPE, usd1e8);
        // Allocate 50/50 from USDC to BTC/HYPE
        uint256 halfUsd1e18 = (uint256(usd1e8) * 1e10) / 2;
        uint64 pxB = _validatedOraclePx1e8(true);
        uint64 szB1e8 = _toSz1e8(int256(halfUsd1e18), pxB);
        uint64 szH1e8 = _toSz1e8(int256(halfUsd1e18), pxH);
        if (szB1e8 > 0) {
            uint64 pxBLimit = _limitFromOracle(pxB, true);
            _sendLimitOrderDirect(spotBTC, true, pxBLimit, szB1e8, 0);
        }
        if (szH1e8 > 0) {
            uint64 pxHLimit = _limitFromOracle(pxH, true);
            _sendLimitOrderDirect(spotHYPE, true, pxHLimit, szH1e8, 0);
        }
        if (forceRebalance) {
            _rebalance(0, 0);
        }
    }

    function pullFromCoreToEvm(uint64 usdc1e8) external onlyVault whenNotPaused returns (uint64) {
        if (usdcCoreSystemAddress == address(0)) revert("USDC_CORE_NOT_SET");
        // Ensure enough USDC spot by selling BTC/HYPE via IOC if needed
        uint256 usdcBal = spotBalance(address(this), usdcCoreTokenId);
        if (usdcBal < usdc1e8) {
            uint256 shortfall1e8 = usdc1e8 - usdcBal;
            // Try to sell BTC first, then HYPE
            _sellAssetForUsd(spotBTC, spotTokenBTC, shortfall1e8);
            // Refresh balance and compute remaining
            usdcBal = spotBalance(address(this), usdcCoreTokenId);
            if (usdcBal < usdc1e8) {
                _sellAssetForUsd(spotHYPE, spotTokenHYPE, usdc1e8 - usdcBal);
            }
        }
        // Spot send to credit EVM
        _send(coreWriter, CoreHandlerLib.encodeSpotSend(usdcCoreSystemAddress, usdcCoreTokenId, usdc1e8));
        emit InboundFromCore(usdc1e8);
        return usdc1e8;
    }

    // Ensure enough HYPE on Core (buy if needed), then send to EVM
    function pullHypeFromCoreToEvm(uint64 hype1e8) external onlyVault whenNotPaused returns (uint64) {
        require(hypeCoreSystemAddress != address(0), "HYPE_CORE_NOT_SET");
        uint256 hypeBal = spotBalance(address(this), hypeCoreTokenId);
        if (hypeBal < hype1e8) {
            uint256 shortfall1e8 = hype1e8 - hypeBal;
            // Buy HYPE using USDC via IOC for the shortfall size directly
            uint64 pxH = _validatedOraclePx1e8(false);
            uint64 pxHLimit = _limitFromOracle(pxH, true);
            _sendLimitOrderDirect(spotHYPE, true, pxHLimit, SafeCast.toUint64(shortfall1e8), 0);
        }
        // Spot send to credit EVM HYPE
        _send(coreWriter, CoreHandlerLib.encodeSpotSend(hypeCoreSystemAddress, hypeCoreTokenId, hype1e8));
        emit InboundFromCore(hype1e8);
        return hype1e8;
    }

    function sweepToVault(uint64 amount1e8) external onlyVault whenNotPaused {
        if (amount1e8 == 0) {
            return;
        }
        uint64 feeAmt1e8 = 0;
        if (feeBps > 0) {
            require(feeVault != address(0), "FEE_VAULT");
            feeAmt1e8 = uint64((uint256(amount1e8) * uint256(feeBps)) / 10_000);
            if (feeAmt1e8 > 0) {
                require(usdc.transfer(feeVault, uint256(feeAmt1e8)), "fee sweep fail");
            }
        }
        uint64 net1e8 = amount1e8 - feeAmt1e8;
        require(usdc.transfer(vault, uint256(net1e8)), "sweep fail");
        emit SweepWithFee(amount1e8, feeAmt1e8, net1e8);
    }

    // Sweep native HYPE held on EVM from handler to vault, applying feeBps in HYPE
    function sweepHypeToVault(uint256 amount1e18) external onlyVault whenNotPaused {
        if (amount1e18 == 0) return;
        require(address(this).balance >= amount1e18, "BAL");
        uint256 feeAmt = 0;
        if (feeBps > 0) {
            require(feeVault != address(0), "FEE_VAULT");
            feeAmt = (amount1e18 * uint256(feeBps)) / 10_000;
            if (feeAmt > 0) {
                (bool f, ) = payable(feeVault).call{value: feeAmt}("");
                require(f, "fee send fail");
            }
        }
        uint256 net = amount1e18 - feeAmt;
        (bool s, ) = payable(vault).call{value: net}("");
        require(s, "sweep fail");
        // Reuse event with truncated units is not ideal; keep separate event if needed
        // For simplicity, emit same event with values downscaled to 1e8 notionally
        uint64 gross1e8 = SafeCast.toUint64(amount1e18 / 1e10);
        uint64 fee1e8 = SafeCast.toUint64(feeAmt / 1e10);
        uint64 net1e8 = SafeCast.toUint64(net / 1e10);
        emit SweepWithFee(gross1e8, fee1e8, net1e8);
    }

    function rebalancePortfolio(uint128 cloidBtc, uint128 cloidHype) public onlyRebalancer whenNotPaused {
        _rebalance(cloidBtc, cloidHype);
    }

    function _rebalance(uint128 cloidBtc, uint128 cloidHype) internal {
        (int256 dB, int256 dH, uint64 pxB, uint64 pxH) = _computeRebalanceDeltas();
        _placeRebalanceOrders(dB, dH, pxB, pxH, cloidBtc, cloidHype);
        emit Rebalanced(dB, dH);
    }

    function _computeRebalanceDeltas() internal view returns (int256 dB, int256 dH, uint64 pxB, uint64 pxH) {
        CoreHandlerLib.RebalanceContext memory ctx = CoreHandlerLib.RebalanceContext({
            l1read: l1read,
            usdcCoreTokenId: usdcCoreTokenId,
            spotTokenBTC: spotTokenBTC,
            spotTokenHYPE: spotTokenHYPE,
            deadbandBps: deadbandBps,
            maxSlippageBps: maxSlippageBps,
            marketEpsilonBps: marketEpsilonBps,
            spotBTC: spotBTC,
            spotHYPE: spotHYPE
        });
        
        (dB, dH, pxB, pxH) = CoreHandlerLib.computeRebalanceDeltas(ctx, address(this));
    }

    function _placeRebalanceOrders(
        int256 dB,
        int256 dH,
        uint64 pxB,
        uint64 pxH,
        uint128 cloidBtc,
        uint128 cloidHype
    ) internal {
        uint64 szB1e8 = _toSz1e8(dB, pxB);
        if (szB1e8 > 0) {
            _sendLimitOrderDirect(
                spotBTC,
                dB > 0,
                _limitFromOracle(pxB, dB > 0),
                szB1e8,
                cloidBtc
            );
        }

        uint64 szH1e8 = _toSz1e8(dH, pxH);
        if (szH1e8 > 0) {
            _sendLimitOrderDirect(
                spotHYPE,
                dH > 0,
                _limitFromOracle(pxH, dH > 0),
                szH1e8,
                cloidHype
            );
        }
    }

    // Internal utils
    function _limitFromOracle(uint64 oraclePx1e8, bool isBuy) internal view returns (uint64) {
        return CoreHandlerLib.limitFromOracle(oraclePx1e8, isBuy, maxSlippageBps, marketEpsilonBps);
    }

    function _toSz1e8(int256 deltaUsd1e18, uint64 price1e8) internal pure returns (uint64) {
        return CoreHandlerLib.toSz1e8(deltaUsd1e18, price1e8);
    }

    function _sellAssetForUsd(uint32 spotAsset, uint64 /*tokenId*/, uint256 targetUsd1e8) internal {
        if (targetUsd1e8 == 0) return;
        uint64 px = spotOraclePx1e8(spotAsset);
        // Convert target USD to base size 1e8
        uint256 targetUsd1e18 = targetUsd1e8 * 1e10;
        uint64 sz1e8 = _toSz1e8(int256(targetUsd1e18), px);
        if (sz1e8 == 0) return;
        // Sell with lower bound price
        uint64 pxLimit = _limitFromOracle(px, false);
        _sendLimitOrderDirect(spotAsset, false, pxLimit, sz1e8, 0);
    }

    function _send(ICoreWriter writer, bytes memory data) internal {
        writer.sendRawAction(data);
        emit OutboundToCore(data);
    }

    function _rateLimit(uint64 amount1e8) internal {
        if (amount1e8 == 0) return;
        uint64 currentBlock = uint64(block.number);
        if (currentBlock - lastEpochStart >= epochLength) {
            lastEpochStart = currentBlock;
            sentThisEpoch = 0;
        }
        if (sentThisEpoch + amount1e8 > maxOutboundPerEpoch) revert RateLimited();
        sentThisEpoch += amount1e8;
    }

    function _validatedOraclePx1e8(bool isBtc) internal returns (uint64) {
        uint32 asset = isBtc ? spotBTC : spotHYPE;
        CoreHandlerLib.OracleValidation memory oracle = CoreHandlerLib.OracleValidation({
            lastPxBtc1e8: lastPxBtc1e8,
            lastPxHype1e8: lastPxHype1e8,
            pxInitB: pxInitB,
            pxInitH: pxInitH,
            maxOracleDeviationBps: maxOracleDeviationBps
        });
        
        uint64 px = CoreHandlerLib.validatedOraclePx1e8(l1read, asset, oracle, isBtc);
        
        // Update prices
        if (isBtc) {
            lastPxBtc1e8 = px;
            pxInitB = true;
        } else {
            lastPxHype1e8 = px;
            pxInitH = true;
        }
        return px;
    }



    function _sendLimitOrderDirect(
        uint32 asset,
        bool isBuy,
        uint64 limitPx1e8,
        uint64 sz1e8,
        uint128 cloid
    ) internal {
        _send(coreWriter, CoreHandlerLib.encodeLimitOrder(asset, isBuy, limitPx1e8, sz1e8, cloid));
    }
}


