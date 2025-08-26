// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {HLConstants} from "./utils/HLConstants.sol";
import {Rebalancer50Lib} from "./Rebalancer50Lib.sol";
import {L1Read} from "./interfaces/L1Read.sol";

interface ICoreWriter {
    function sendRawAction(bytes calldata data) external;
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
    function decimals() external view returns (uint8);
}

contract CoreInteractionHandler {
    using Rebalancer50Lib for uint256;

    // Immutable system contracts
    L1Read public immutable l1read;
    ICoreWriter public immutable coreWriter;
    IERC20 public immutable usdc;

    // Config
    address public vault;
    address public usdcCoreSystemAddress;
    uint64 public usdcCoreTokenId;
    uint32 public perpBTC;
    uint32 public perpHYPE;

    // Risk params
    uint64 public maxOutboundPerEpoch;
    uint64 public epochLength;
    uint64 public lastEpochStart;
    uint64 public sentThisEpoch;
    uint64 public maxSlippageBps; // for IOC limit price
    uint64 public marketEpsilonBps; // widen limit to mimic marketable IOC
    uint64 public deadbandBps;

    error NotVault();
    error RateLimited();
    error OracleZero();

    event LimitsSet(uint64 maxOutboundPerEpoch, uint64 epochLength);
    event ParamsSet(uint64 maxSlippageBps, uint64 marketEpsilonBps, uint64 deadbandBps);
    event VaultSet(address vault);
    event UsdcCoreLinkSet(address systemAddress, uint64 tokenId);
    event PerpIdsSet(uint32 btc, uint32 hype);
    event OutboundToCore(bytes data);
    event InboundFromCore(uint64 amount1e6);
    event Rebalanced(int256 dBtc1e18, int256 dHype1e18);

    modifier onlyVault() {
        if (msg.sender != vault) revert NotVault();
        _;
    }

    constructor(L1Read _l1read, ICoreWriter _coreWriter, IERC20 _usdc) {
        l1read = _l1read;
        coreWriter = _coreWriter;
        usdc = _usdc;
        lastEpochStart = uint64(block.timestamp);
    }

    // Admin setters (to be called by deployer/owner offchain in this sample; add auth as needed)
    function setVault(address _vault) external {
        vault = _vault;
        emit VaultSet(_vault);
    }

    function setUsdcCoreLink(address systemAddr, uint64 tokenId) external {
        usdcCoreSystemAddress = systemAddr;
        usdcCoreTokenId = tokenId;
        emit UsdcCoreLinkSet(systemAddr, tokenId);
    }

    function setPerpIds(uint32 btc, uint32 hype) external {
        perpBTC = btc;
        perpHYPE = hype;
        emit PerpIdsSet(btc, hype);
    }

    function setLimits(uint64 _maxOutboundPerEpoch, uint64 _epochLength) external {
        maxOutboundPerEpoch = _maxOutboundPerEpoch;
        epochLength = _epochLength;
        emit LimitsSet(_maxOutboundPerEpoch, _epochLength);
    }

    function setParams(uint64 _maxSlippageBps, uint64 _marketEpsilonBps, uint64 _deadbandBps) external {
        maxSlippageBps = _maxSlippageBps;
        marketEpsilonBps = _marketEpsilonBps;
        deadbandBps = _deadbandBps;
        emit ParamsSet(_maxSlippageBps, _marketEpsilonBps, _deadbandBps);
    }

    // Views
    function equityUsd1e18() public view returns (uint256) {
        // Core equity only (1e6 → 1e18). EVM USDC est compté dans le Vault.
        L1Read.AccountMarginSummary memory s = l1read.accountMarginSummary(perpBTC, vault);
        int256 coreRawUsd1e6 = s.rawUsd; // signed
        return coreRawUsd1e6 > 0 ? uint256(uint64(coreRawUsd1e6)) * 1e12 : 0;
    }

    function perpOraclePx1e8(uint32 asset) public view returns (uint64) {
        uint64 px = l1read.oraclePx(asset);
        if (px == 0) revert OracleZero();
        return px;
    }

    function perpPositionNotionalUsd1e18(uint32 asset) public view returns (int256) {
        L1Read.Position memory p = l1read.position(vault, uint16(asset));
        // ntl in 1e8, convert to 1e18
        int256 ntl1e8 = int256(uint256(p.entryNtl));
        return ntl1e8 * 1e10;
    }

    // Core flows
    function executeDeposit(uint64 usdc1e6, bool moveToPerp, bool forceRebalance) external onlyVault {
        _rateLimit(usdc1e6);
        // Pull USDC from vault to handler
        require(usdc.transferFrom(msg.sender, address(this), usdc1e6), "transferFrom fail");
        // EVM->Core spot: send to system address to credit Core spot balance
        require(usdc.transfer(usdcCoreSystemAddress, usdc1e6), "transfer to system fail");
        if (moveToPerp) {
            _send(coreWriter, HLConstants.encodeUsdClassTransfer(usdc1e6, true));
        }
        if (forceRebalance) {
            rebalancePortfolio(0, 0);
        }
    }

    function pullFromCoreToEvm(uint64 usdc1e6) external onlyVault returns (uint64) {
        // Perp -> Spot USD class transfer, then spot send to EVM credit
        _send(coreWriter, HLConstants.encodeUsdClassTransfer(usdc1e6, false));
        _send(coreWriter, HLConstants.encodeSpotSend(usdcCoreSystemAddress, usdcCoreTokenId, usdc1e6));
        emit InboundFromCore(usdc1e6);
        return usdc1e6;
    }

    function sweepToVault(uint64 amount1e6) external onlyVault {
        require(usdc.transfer(vault, amount1e6), "sweep fail");
    }

    function rebalancePortfolio(uint128 cloidBtc, uint128 cloidHype) public {
        // Read equity and positions
        uint256 eq1e18 = equityUsd1e18();
        int256 posB1e18 = perpPositionNotionalUsd1e18(perpBTC);
        int256 posH1e18 = perpPositionNotionalUsd1e18(perpHYPE);

        (int256 dB, int256 dH) = Rebalancer50Lib.computeDeltas(eq1e18, posB1e18, posH1e18, deadbandBps);
        // Compute limit prices around oracle
        uint64 pxB = perpOraclePx1e8(perpBTC);
        uint64 pxH = perpOraclePx1e8(perpHYPE);

        // Convert deltas 1e18 USD into size 1e8: sz = |deltaUsd1e18| / price1e8 => multiply by 1e10
        uint64 szB1e8 = _toSz1e8(dB, pxB);
        uint64 szH1e8 = _toSz1e8(dH, pxH);

        // Send up to two IOC orders
        if (szB1e8 > 0) {
            bool isBuyB = dB > 0;
            uint64 pxBLimit = _limitFromOracle(pxB, isBuyB);
            _send(coreWriter, HLConstants.encodeLimitOrder(perpBTC, isBuyB, pxBLimit, szB1e8, dB < 0, HLConstants.TIF_IOC, cloidBtc));
        }
        if (szH1e8 > 0) {
            bool isBuyH = dH > 0;
            uint64 pxHLimit = _limitFromOracle(pxH, isBuyH);
            _send(coreWriter, HLConstants.encodeLimitOrder(perpHYPE, isBuyH, pxHLimit, szH1e8, dH < 0, HLConstants.TIF_IOC, cloidHype));
        }
        emit Rebalanced(dB, dH);
    }

    // Internal utils
    function _limitFromOracle(uint64 oraclePx1e8, bool isBuy) internal view returns (uint64) {
        // price = oracle * (1 +/- (slippage+epsilon)/1e4)
        uint256 bps = uint256(maxSlippageBps) + uint256(marketEpsilonBps);
        uint256 adj = (uint256(oraclePx1e8) * bps) / 10000;
        if (isBuy) {
            return uint64(uint256(oraclePx1e8) + adj);
        } else {
            // sell => price lower bound
            return uint64(uint256(oraclePx1e8) - adj);
        }
    }

    function _toSz1e8(int256 deltaUsd1e18, uint64 price1e8) internal pure returns (uint64) {
        if (deltaUsd1e18 == 0 || price1e8 == 0) return 0;
        uint256 absUsd = uint256(deltaUsd1e18 > 0 ? deltaUsd1e18 : -deltaUsd1e18);
        // size1e8 = (notional1e18 / price1e8) / 1e2
        uint256 s = (absUsd / uint256(price1e8)) / 100; // divide by 1e2
        if (s > type(uint64).max) return type(uint64).max;
        return uint64(s);
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
}


