// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {L1Read} from "../interfaces/L1Read.sol";
import {Rebalancer50Lib} from "../Rebalancer50Lib.sol";
import {HLConstants} from "./HLConstants.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

library CoreHandlerLib {
    using SafeCast for uint256;

    struct RebalanceContext {
        L1Read l1read;
        uint64 usdcCoreTokenId;
        uint64 spotTokenBTC;
        uint64 spotTokenHYPE;
        uint64 deadbandBps;
        uint64 maxSlippageBps;
        uint64 marketEpsilonBps;
        uint32 spotBTC;
        uint32 spotHYPE;
    }

    struct OracleValidation {
        uint64 lastPxBtc1e8;
        uint64 lastPxHype1e8;
        bool pxInitB;
        bool pxInitH;
        uint64 maxOracleDeviationBps;
    }

    // Group inputs to reduce stack usage when calculating positions
    struct PositionInputs {
        L1Read l1read;
        uint256 usdcBalWei;
        uint256 btcBalWei;
        uint256 hypeBalWei;
        uint64 pxB;
        uint64 pxH;
        uint64 usdcCoreTokenId;
        uint64 spotTokenBTC;
        uint64 spotTokenHYPE;
    }

    /// @notice Get spot balance converted to wei decimals
    function spotBalanceInWei(
        L1Read l1read,
        address coreUser, 
        uint64 tokenId
    ) internal view returns (uint256) {
        L1Read.SpotBalance memory b = l1read.spotBalance(coreUser, tokenId);
        L1Read.TokenInfo memory info = l1read.tokenInfo(uint32(tokenId));
        
        uint256 total = uint256(b.total);
        
        // Convert from szDecimals to weiDecimals
        if (info.weiDecimals > info.szDecimals) {
            uint8 diff = info.weiDecimals - info.szDecimals;
            return total * (10 ** diff);
        } else if (info.weiDecimals < info.szDecimals) {
            uint8 diff = info.szDecimals - info.weiDecimals;
            return total / (10 ** diff);
        }
        return total;
    }

    function computeRebalanceDeltas(
        RebalanceContext memory ctx,
        address handler
    ) internal view returns (int256 dB, int256 dH, uint64 pxB, uint64 pxH) {
        // Calculer positions et prix dans une fonction séparée pour réduire la pression sur la pile
        (int256 _posB1e18, int256 _posH1e18, uint256 _usdc1e18, uint64 _pxB, uint64 _pxH) =
            _getPositionsAndPrices(ctx, handler);

        uint256 _equity1e18 = _usdc1e18 + uint256(_posB1e18) + uint256(_posH1e18);
        (dB, dH) = Rebalancer50Lib.computeDeltas(_equity1e18, _posB1e18, _posH1e18, ctx.deadbandBps);
        pxB = _pxB;
        pxH = _pxH;
    }

    function _getPositionsAndPrices(
        RebalanceContext memory ctx,
        address handler
    ) internal view returns (int256 posB1e18, int256 posH1e18, uint256 usdc1e18, uint64 pxB, uint64 pxH) {
        // Balances spot convertis en wei
        uint256 usdcBalWei = spotBalanceInWei(ctx.l1read, handler, ctx.usdcCoreTokenId);
        uint256 btcBalWei = spotBalanceInWei(ctx.l1read, handler, ctx.spotTokenBTC);
        uint256 hypeBalWei = spotBalanceInWei(ctx.l1read, handler, ctx.spotTokenHYPE);

        // Prix oracles 1e8
        pxB = ctx.l1read.spotPx(ctx.spotBTC);
        pxH = ctx.l1read.spotPx(ctx.spotHYPE);

        // Infos de décimales
        L1Read.TokenInfo memory usdcInfo = ctx.l1read.tokenInfo(uint32(ctx.usdcCoreTokenId));
        L1Read.TokenInfo memory btcInfo = ctx.l1read.tokenInfo(uint32(ctx.spotTokenBTC));
        L1Read.TokenInfo memory hypeInfo = ctx.l1read.tokenInfo(uint32(ctx.spotTokenHYPE));

        // USDC en 1e18 (suppose 18 >= weiDecimals, conforme usage antérieur)
        usdc1e18 = usdcBalWei * (10 ** (18 - usdcInfo.weiDecimals));

        // BTC en USD 1e18
        if (btcInfo.weiDecimals + 8 <= 18) {
            posB1e18 = int256(btcBalWei * uint256(pxB) * (10 ** (18 - btcInfo.weiDecimals - 8)));
        } else {
            posB1e18 = int256((btcBalWei * uint256(pxB)) / (10 ** (btcInfo.weiDecimals + 8 - 18)));
        }

        // HYPE en USD 1e18
        if (hypeInfo.weiDecimals + 8 <= 18) {
            posH1e18 = int256(hypeBalWei * uint256(pxH) * (10 ** (18 - hypeInfo.weiDecimals - 8)));
        } else {
            posH1e18 = int256((hypeBalWei * uint256(pxH)) / (10 ** (hypeInfo.weiDecimals + 8 - 18)));
        }
    }

    function _calculatePositions(
        PositionInputs memory p
    ) internal view returns (int256 posB1e18, int256 posH1e18, uint256 usdc1e18) {
        // Get token info for decimal conversion
        L1Read.TokenInfo memory usdcInfo = p.l1read.tokenInfo(uint32(p.usdcCoreTokenId));
        L1Read.TokenInfo memory btcInfo = p.l1read.tokenInfo(uint32(p.spotTokenBTC));
        L1Read.TokenInfo memory hypeInfo = p.l1read.tokenInfo(uint32(p.spotTokenHYPE));
        
        // Convert USDC to 1e18 USD values
        usdc1e18 = p.usdcBalWei * (10 ** (18 - usdcInfo.weiDecimals));
        
        // Convert BTC position
        if (btcInfo.weiDecimals + 8 <= 18) {
            posB1e18 = int256(p.btcBalWei * uint256(p.pxB) * (10 ** (18 - btcInfo.weiDecimals - 8)));
        } else {
            posB1e18 = int256((p.btcBalWei * uint256(p.pxB)) / (10 ** (btcInfo.weiDecimals + 8 - 18)));
        }
        
        // Convert HYPE position
        if (hypeInfo.weiDecimals + 8 <= 18) {
            posH1e18 = int256(p.hypeBalWei * uint256(p.pxH) * (10 ** (18 - hypeInfo.weiDecimals - 8)));
        } else {
            posH1e18 = int256((p.hypeBalWei * uint256(p.pxH)) / (10 ** (hypeInfo.weiDecimals + 8 - 18)));
        }
    }

    function toSz1e8(int256 deltaUsd1e18, uint64 price1e8) internal pure returns (uint64) {
        if (deltaUsd1e18 == 0 || price1e8 == 0) return 0;
        uint256 absUsd = uint256(deltaUsd1e18 > 0 ? deltaUsd1e18 : -deltaUsd1e18);
        uint256 s = absUsd / uint256(price1e8) / 100;
        if (s > type(uint64).max) return type(uint64).max;
        return SafeCast.toUint64(s);
    }

    function limitFromOracle(uint64 oraclePx1e8, bool isBuy, uint64 maxSlippageBps, uint64 marketEpsilonBps) internal pure returns (uint64) {
        uint256 bps = uint256(maxSlippageBps) + uint256(marketEpsilonBps);
        uint256 adj = (uint256(oraclePx1e8) * bps) / 10_000;
        if (isBuy) return uint64(uint256(oraclePx1e8) + adj);
        uint256 lo = (uint256(oraclePx1e8) > adj) ? (uint256(oraclePx1e8) - adj) : 1;
        return uint64(lo);
    }

    function validatedOraclePx1e8(
        L1Read l1read,
        uint32 spotAsset,
        OracleValidation memory oracle,
        bool isBtc
    ) internal view returns (uint64) {
        uint64 px = l1read.spotPx(spotAsset);
        uint64 lastPx = isBtc ? oracle.lastPxBtc1e8 : oracle.lastPxHype1e8;
        bool init = isBtc ? oracle.pxInitB : oracle.pxInitH;
        
        if (init && lastPx != 0) {
            uint256 up = uint256(lastPx) * (10_000 + oracle.maxOracleDeviationBps) / 10_000;
            uint256 down = uint256(lastPx) * (10_000 - oracle.maxOracleDeviationBps) / 10_000;
            require(uint256(px) <= up && uint256(px) >= down, "ORACLE_DEV");
        }
        
        return px;
    }

    function encodeLimitOrder(
        uint32 asset,
        bool isBuy,
        uint64 limitPx1e8,
        uint64 sz1e8,
        uint128 cloid
    ) internal pure returns (bytes memory) {
        return HLConstants.encodeLimitOrder(
            asset,
            isBuy,
            limitPx1e8,
            sz1e8,
            false,
            HLConstants.TIF_IOC,
            cloid
        );
    }

    function encodeSpotSend(
        address systemAddress,
        uint64 tokenId,
        uint64 amount
    ) internal pure returns (bytes memory) {
        return HLConstants.encodeSpotSend(systemAddress, tokenId, amount);
    }
}
