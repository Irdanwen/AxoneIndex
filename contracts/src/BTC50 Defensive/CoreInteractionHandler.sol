// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {HLConstants} from "./utils/HLConstants.sol";
import {Rebalancer50Lib} from "./Rebalancer50Lib.sol";
import {L1Read} from "./interfaces/L1Read.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

interface ICoreWriter {
    function sendRawAction(bytes calldata data) external;
}

// IERC20 importé via OpenZeppelin ci-dessus

contract CoreInteractionHandler {
    using SafeERC20 for IERC20;
    

    // Immutable system contracts
    L1Read public immutable l1read;
    ICoreWriter public immutable coreWriter;
    IERC20 public immutable usdc;

    // Config
    address public vault;
    address public usdcCoreSystemAddress;
    uint64 public usdcCoreTokenId;
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
    uint64 public maxSlippageBps; // for IOC limit price
    uint64 public marketEpsilonBps; // widen limit to mimic marketable IOC
    uint64 public deadbandBps;
    uint64 public maxOracleDeviationBps;

    uint64 public lastPxBtc1e8;
    uint64 public lastPxHype1e8;
    bool public pxInitB;
    bool public pxInitH;

    error NotVault();
    error NotOwner();
    error RateLimited();
    error OracleZero();

    event LimitsSet(uint64 maxOutboundPerEpoch, uint64 epochLength);
    event ParamsSet(uint64 maxSlippageBps, uint64 marketEpsilonBps, uint64 deadbandBps);
    event VaultSet(address vault);
    event UsdcCoreLinkSet(address systemAddress, uint64 tokenId);
    event SpotIdsSet(uint32 btcSpot, uint32 hypeSpot);
    event SpotTokenIdsSet(uint64 usdcToken, uint64 btcToken, uint64 hypeToken);
    event OutboundToCore(bytes data);
    event InboundFromCore(uint64 amount1e6);
    event Rebalanced(int256 dBtc1e18, int256 dHype1e18);

    address public owner;

    modifier onlyOwner(){
        if(msg.sender!=owner) revert NotOwner();
        _;
    }

    modifier onlyVault() {
        if (msg.sender != vault) revert NotVault();
        _;
    }

    constructor(L1Read _l1read, ICoreWriter _coreWriter, IERC20 _usdc, uint64 _maxOutboundPerEpoch, uint64 _epochLength) {
        l1read = _l1read;
        coreWriter = _coreWriter;
        usdc = _usdc;
        lastEpochStart = uint64(block.timestamp);
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
    }

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

    // Views (spot)
    function spotBalance(address coreUser, uint64 tokenId) public view returns (uint64) {
        L1Read.SpotBalance memory b = l1read.spotBalance(coreUser, tokenId);
        return b.total;
    }

    function spotOraclePx1e8(uint32 spotAsset) public view returns (uint64) {
        uint64 px = l1read.spotPx(spotAsset);
        if (px == 0) revert OracleZero();
        return px;
    }

    function equitySpotUsd1e18() public view returns (uint256) {
        // Core spot equity only. EVM USDC est compté dans le Vault.
        uint256 usdcBal1e6 = spotBalance(address(this), usdcCoreTokenId);
        uint256 btcBal1e0 = spotBalance(address(this), spotTokenBTC);
        uint256 hypeBal1e0 = spotBalance(address(this), spotTokenHYPE);

        uint256 pxB1e8 = spotOraclePx1e8(spotBTC);
        uint256 pxH1e8 = spotOraclePx1e8(spotHYPE);

        // USDC 1e6 -> 1e18, assets: balance 1e0 * px1e8 * 1e10
        uint256 usdc1e18 = usdcBal1e6 * 1e12;
        uint256 btcUsd1e18 = btcBal1e0 * pxB1e8 * 1e10;
        uint256 hypeUsd1e18 = hypeBal1e0 * pxH1e8 * 1e10;
        return usdc1e18 + btcUsd1e18 + hypeUsd1e18;
    }

    // Core flows
    function executeDeposit(uint64 usdc1e6, bool forceRebalance) external onlyVault {
        if (usdcCoreSystemAddress == address(0) || usdcCoreTokenId == 0) revert("USDC_CORE_NOT_SET");
        _rateLimit(usdc1e6);
        // Pull USDC from vault to handler
        usdc.safeTransferFrom(msg.sender, address(this), usdc1e6);
        // EVM->Core spot: send to system address to credit Core spot balance
        usdc.safeTransfer(usdcCoreSystemAddress, usdc1e6);
        // After crediting USDC spot, place two IOC buys ~50/50 into BTC and HYPE
        uint256 halfUsd1e18 = (uint256(usdc1e6) * 1e12) / 2;
        uint64 pxB = _validatedOraclePx1e8(true);
        uint64 pxH = _validatedOraclePx1e8(false);
        uint64 szB1e8 = _toSz1e8(int256(halfUsd1e18), pxB);
        uint64 szH1e8 = _toSz1e8(int256(halfUsd1e18), pxH);
        if (szB1e8 > 0) {
            uint64 pxBLimit = _limitFromOracle(pxB, true);
            _send(coreWriter, HLConstants.encodeLimitOrder(spotBTC, true, pxBLimit, szB1e8, false, HLConstants.TIF_IOC, 0));
        }
        if (szH1e8 > 0) {
            uint64 pxHLimit = _limitFromOracle(pxH, true);
            _send(coreWriter, HLConstants.encodeLimitOrder(spotHYPE, true, pxHLimit, szH1e8, false, HLConstants.TIF_IOC, 0));
        }
        if (forceRebalance) {
            rebalancePortfolio(0, 0);
        }
    }

    function pullFromCoreToEvm(uint64 usdc1e6) external onlyVault returns (uint64) {
        if (usdcCoreSystemAddress == address(0) || usdcCoreTokenId == 0) revert("USDC_CORE_NOT_SET");
        // Ensure enough USDC spot by selling BTC/HYPE via IOC if needed
        uint256 usdcBal = spotBalance(address(this), usdcCoreTokenId);
        if (usdcBal < usdc1e6) {
            uint256 shortfall1e6 = usdc1e6 - usdcBal;
            // Try to sell BTC first, then HYPE
            _sellAssetForUsd(spotBTC, spotTokenBTC, shortfall1e6);
            // Refresh balance and compute remaining
            usdcBal = spotBalance(address(this), usdcCoreTokenId);
            if (usdcBal < usdc1e6) {
                _sellAssetForUsd(spotHYPE, spotTokenHYPE, usdc1e6 - usdcBal);
            }
        }
        // Spot send to credit EVM
        _send(coreWriter, HLConstants.encodeSpotSend(usdcCoreSystemAddress, usdcCoreTokenId, usdc1e6));
        emit InboundFromCore(usdc1e6);
        return usdc1e6;
    }

    function sweepToVault(uint64 amount1e6) external onlyVault {
        require(usdc.transfer(vault, amount1e6), "sweep fail");
    }

    function rebalancePortfolio(uint128 cloidBtc, uint128 cloidHype) public {
        // Read spot balances and prices
        uint256 usdcBal1e6 = spotBalance(address(this), usdcCoreTokenId);
        uint256 btcBal1e0 = spotBalance(address(this), spotTokenBTC);
        uint256 hypeBal1e0 = spotBalance(address(this), spotTokenHYPE);
        uint64 pxB = _validatedOraclePx1e8(true);
        uint64 pxH = _validatedOraclePx1e8(false);

        // Current USD notionals per leg (1e18)
        int256 posB1e18 = int256(btcBal1e0 * uint256(pxB) * 1e10);
        int256 posH1e18 = int256(hypeBal1e0 * uint256(pxH) * 1e10);
        uint256 equity1e18 = (usdcBal1e6 * 1e12) + uint256(int256(posB1e18)) + uint256(int256(posH1e18));

        (int256 dB, int256 dH) = Rebalancer50Lib.computeDeltas(equity1e18, posB1e18, posH1e18, deadbandBps);

        // Convert deltas 1e18 USD into size 1e8
        uint64 szB1e8 = _toSz1e8(dB, pxB);
        uint64 szH1e8 = _toSz1e8(dH, pxH);

        // Send IOC orders on spot markets
        if (szB1e8 > 0) {
            bool isBuyB = dB > 0;
            uint64 pxBLimit = _limitFromOracle(pxB, isBuyB);
            _send(coreWriter, HLConstants.encodeLimitOrder(spotBTC, isBuyB, pxBLimit, szB1e8, false, HLConstants.TIF_IOC, cloidBtc));
        }
        if (szH1e8 > 0) {
            bool isBuyH = dH > 0;
            uint64 pxHLimit = _limitFromOracle(pxH, isBuyH);
            _send(coreWriter, HLConstants.encodeLimitOrder(spotHYPE, isBuyH, pxHLimit, szH1e8, false, HLConstants.TIF_IOC, cloidHype));
        }
        emit Rebalanced(dB, dH);
    }

    // Internal utils
    function _limitFromOracle(uint64 oraclePx1e8, bool isBuy) internal view returns (uint64) {
        uint256 bps = uint256(maxSlippageBps) + uint256(marketEpsilonBps);
        uint256 adj = (uint256(oraclePx1e8) * bps) / 10_000;
        if (isBuy) return uint64(uint256(oraclePx1e8) + adj);
        uint256 lo = (uint256(oraclePx1e8) > adj) ? (uint256(oraclePx1e8) - adj) : 1;
        return uint64(lo);
    }

    function _toSz1e8(int256 deltaUsd1e18, uint64 price1e8) internal pure returns (uint64) {
        if (deltaUsd1e18 == 0 || price1e8 == 0) return 0;
        uint256 absUsd = uint256(deltaUsd1e18 > 0 ? deltaUsd1e18 : -deltaUsd1e18);
        // size1e8 = (absUsd1e18 / price1e8) / 1e10
        uint256 s = absUsd / uint256(price1e8) / 1e10;
        if (s > type(uint64).max) return type(uint64).max;
        return SafeCast.toUint64(s);
    }

    function _sellAssetForUsd(uint32 spotAsset, uint64 tokenId, uint256 targetUsd1e6) internal {
        if (targetUsd1e6 == 0) return;
        uint64 px = spotOraclePx1e8(spotAsset);
        // Convert target USD to base size 1e8
        uint256 targetUsd1e18 = targetUsd1e6 * 1e12;
        uint64 sz1e8 = _toSz1e8(int256(targetUsd1e18), px);
        if (sz1e8 == 0) return;
        // Sell with lower bound price
        uint64 pxLimit = _limitFromOracle(px, false);
        _send(coreWriter, HLConstants.encodeLimitOrder(spotAsset, false, pxLimit, sz1e8, false, HLConstants.TIF_IOC, 0));
    }

    function _send(ICoreWriter writer, bytes memory data) internal {
        writer.sendRawAction(data);
        emit OutboundToCore(data);
    }

    function _rateLimit(uint64 amount1e6) internal {
        uint64 nowTs = uint64(block.timestamp);
        if (nowTs - lastEpochStart >= epochLength) {
            lastEpochStart = nowTs;
            sentThisEpoch = 0;
        }
        if (sentThisEpoch + amount1e6 > maxOutboundPerEpoch) revert RateLimited();
        sentThisEpoch += amount1e6;
    }

    function _validatedOraclePx1e8(bool isBtc) internal returns (uint64) {
        uint32 asset = isBtc ? spotBTC : spotHYPE;
        uint64 px = spotOraclePx1e8(asset);
        uint64 lastPx = isBtc ? lastPxBtc1e8 : lastPxHype1e8;
        bool init = isBtc ? pxInitB : pxInitH;
        if (init && lastPx != 0) {
            uint256 up = uint256(lastPx) * (10_000 + maxOracleDeviationBps) / 10_000;
            uint256 down = uint256(lastPx) * (10_000 - maxOracleDeviationBps) / 10_000;
            require(uint256(px) <= up && uint256(px) >= down, "ORACLE_DEV");
        }
        if (isBtc) {
            lastPxBtc1e8 = px;
            pxInitB = true;
        } else {
            lastPxHype1e8 = px;
            pxInitH = true;
        }
        return px;
    }
}


