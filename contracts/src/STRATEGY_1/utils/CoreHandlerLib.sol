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

    struct OracleResult {
        uint64 adjustedPx1e8;
        bool shouldRevert;
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
        if (info.weiDecimals > info.szDecimals) {
            uint8 diff = info.weiDecimals - info.szDecimals;
            return total * (10 ** uint256(diff));
        }
        if (info.weiDecimals < info.szDecimals) {
            uint8 diff = info.szDecimals - info.weiDecimals;
            return total / (10 ** uint256(diff));
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

    // Convertit un delta USD 1e18 en taille base aux szDecimals du token spot
    function toSzInSzDecimals(
        L1Read l1read,
        uint64 spotTokenId,
        int256 deltaUsd1e18,
        uint64 price1e8
    ) internal view returns (uint64) {
        if (deltaUsd1e18 == 0 || price1e8 == 0) return 0;
        L1Read.TokenInfo memory info = l1read.tokenInfo(uint32(spotTokenId));
        uint256 absUsd = uint256(deltaUsd1e18 > 0 ? deltaUsd1e18 : -deltaUsd1e18);
        // tailleBase(szDecimals) = (USD1e18 / px1e8) * 10^(szDecimals-8)
        // = absUsd * 10^(szDecimals) / 10^8 / px1e8
        uint256 numerator = absUsd * (10 ** uint256(info.szDecimals));
        // Corrige facteur: USD1e18 / px1e8 requiert division par 1e10 supplémentaire
        uint256 denom = uint256(price1e8) * 1e10;
        uint256 s = numerator / denom;
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
    ) internal view returns (OracleResult memory) {
        // Read raw spot price (variable decimals per asset) then normalize to 1e8 for comparisons
        uint64 rawPx = l1read.spotPx(spotAsset);
        uint64 scalar = _pxScalar(l1read, spotAsset);
        uint256 expanded = uint256(rawPx) * uint256(scalar);
        require(expanded <= type(uint64).max, "PX_OVERFLOW");
        uint64 px1e8 = uint64(expanded);

        uint64 lastPx1e8 = isBtc ? oracle.lastPxBtc1e8 : oracle.lastPxHype1e8;
        bool init = isBtc ? oracle.pxInitB : oracle.pxInitH;
        
        if (init && lastPx1e8 != 0) {
            uint256 up = uint256(lastPx1e8) * (10_000 + oracle.maxOracleDeviationBps) / 10_000;
            uint256 down = uint256(lastPx1e8) * (10_000 - oracle.maxOracleDeviationBps) / 10_000;
            
            // Si le prix dépasse la borne supérieure
            if (uint256(px1e8) > up) {
                return OracleResult({
                    adjustedPx1e8: uint64(up),
                    shouldRevert: true
                });
            }
            // Si le prix est en dessous de la borne inférieure
            if (uint256(px1e8) < down) {
                return OracleResult({
                    adjustedPx1e8: uint64(down),
                    shouldRevert: true
                });
            }
        }
        
        return OracleResult({
            adjustedPx1e8: px1e8,
            shouldRevert: false
        });
    }

    function encodeSpotLimitOrder(
        uint32 asset,
        bool isBuy,
        uint64 limitPxRaw,
        uint64 szInSzDecimals,
        uint128 cloid
    ) internal pure returns (bytes memory) {
        return HLConstants.encodeSpotLimitOrder(
            asset,
            isBuy,
            limitPxRaw,
            szInSzDecimals,
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

    function _pxScalar(L1Read l1read, uint32 spotAsset) private view returns (uint64) {
        L1Read.SpotInfo memory info = l1read.spotInfo(spotAsset);
        uint64 baseTokenId = info.tokens[0];
        if (baseTokenId == 0) {
            return 1;
        }
        L1Read.TokenInfo memory baseInfo = l1read.tokenInfo(uint32(baseTokenId));
        uint8 szDecimals = baseInfo.szDecimals;
        uint8 weiDecimals = baseInfo.weiDecimals;
        int256 diff = int256(uint256(weiDecimals)) - int256(uint256(szDecimals));
        int256 exponent = int256(8) - diff;
        if (exponent <= 0) {
            return 1;
        }
        uint256 expUint = uint256(exponent);
        require(expUint <= 8, "PX_SCALAR");
        return uint64(10 ** expUint);
    }
}
