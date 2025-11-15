// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library StrategyMathLib {
    // Prix: clamp à ≤5 chiffres significatifs et ≤ (8 - szDecimals) décimales. BUY: ceil, SELL: floor.
    function quantizePx1e8(uint64 px1e8, uint8 szDecimals, bool isBuy) internal pure returns (uint64) {
        if (px1e8 == 0) return 0;
        uint8 maxPxDecimals = 8 > szDecimals ? uint8(8 - szDecimals) : 0;
        if (maxPxDecimals < 8) {
            uint8 cut = uint8(8 - maxPxDecimals);
            uint64 factor = uint64(10 ** cut);
            if (isBuy) {
                px1e8 = uint64((uint256(px1e8) + factor - 1) / factor) * factor;
            } else {
                px1e8 = (px1e8 / factor) * factor;
            }
        }
        uint64 pxInt = px1e8 / 100_000_000;
        if (pxInt >= 100000) {
            px1e8 = pxInt * 100_000_000;
        }
        return px1e8;
    }

    // Mise à l’échelle d’un prix brut vers 1e8 en fonction de pxDecimals
    function scalePxTo1e8(uint64 rawPx, uint8 pxDecimals) internal pure returns (uint64) {
        if (rawPx == 0) return 0;
        if (pxDecimals == 8) return rawPx;
        if (pxDecimals < 8) {
            uint256 mul = 10 ** uint256(8 - pxDecimals);
            uint256 n = uint256(rawPx) * mul;
            require(n <= type(uint64).max, "PX_OVERFLOW");
            return uint64(n);
        }
        // pxDecimals > 8
        return uint64(uint256(rawPx) / (10 ** uint256(pxDecimals - 8)));
    }

    // Mise à l’échelle inverse: de 1e8 vers les décimales natives
    function scalePxFrom1e8(uint64 px1e8, uint8 pxDecimals) internal pure returns (uint64) {
        if (pxDecimals == 8) return px1e8;
        if (pxDecimals < 8) {
            return uint64(uint256(px1e8) / (10 ** uint256(8 - pxDecimals)));
        }
        uint256 n = uint256(px1e8) * (10 ** uint256(pxDecimals - 8));
        require(n <= type(uint64).max, "PX_OVERFLOW");
        return uint64(n);
    }

    // Conversions mantissa 1e8 <-> weiDecimals (arrondi vers le bas lorsque nécessaire)
    function mantissa1e8ToWei(uint64 amount1e8, uint8 weiDecimals) internal pure returns (uint256) {
        if (amount1e8 == 0) return 0;
        if (weiDecimals >= 8) {
            return uint256(amount1e8) * (10 ** uint256(weiDecimals - 8));
        }
        uint256 divisor = 10 ** uint256(8 - weiDecimals);
        return uint256(amount1e8) / divisor; // floor
    }

    function weiToMantissa1e8(uint256 amountWei, uint8 weiDecimals) internal pure returns (uint256) {
        if (amountWei == 0) return 0;
        if (weiDecimals >= 8) {
            return amountWei / (10 ** uint256(weiDecimals - 8));
        }
        return amountWei * (10 ** uint256(8 - weiDecimals));
    }

    /// @notice Convertit une taille exprimée en szDecimals en format 1e8 attendu par HyperCore.
    /// @dev Effectue un plancher lors de la réduction de décimales pour éviter de dépasser.
    function sizeSzTo1e8(uint64 sizeSz, uint8 szDecimals) internal pure returns (uint64) {
        if (sizeSz == 0) return 0;
        if (szDecimals == 8) {
            return sizeSz;
        } else if (szDecimals < 8) {
            uint256 factor = 10 ** uint256(8 - szDecimals);
            uint256 n = uint256(sizeSz) * factor;
            require(n <= type(uint64).max, "SZ_OVERFLOW");
            return uint64(n);
        } else {
            uint256 divisor = 10 ** uint256(szDecimals - 8);
            return uint64(uint256(sizeSz) / divisor);
        }
    }

    // Calcule une limite « marketable IOC » depuis BBO et quantize
    function marketLimitFromBbo(uint64 bid1e8, uint64 ask1e8, uint8 baseSzDec, uint64 marketEpsilonBps, bool isBuy) internal pure returns (uint64) {
        uint64 lim;
        if (isBuy) {
            uint256 adj = (uint256(ask1e8) * uint256(marketEpsilonBps)) / 10_000;
            lim = uint64(uint256(ask1e8) + adj);
        } else {
            uint256 adj = (uint256(bid1e8) * uint256(marketEpsilonBps)) / 10_000;
            uint256 lo = (uint256(bid1e8) > adj) ? (uint256(bid1e8) - adj) : 1;
            lim = uint64(lo);
        }
        return quantizePx1e8(lim, baseSzDec, isBuy);
    }

    // Calcule une limite depuis l’oracle avec slippage+epsilon et quantize
    function limitFromOracleQuantized(uint64 oraclePx1e8, uint8 baseSzDec, uint64 maxSlippageBps, uint64 marketEpsilonBps, bool isBuy) internal pure returns (uint64) {
        uint256 bps = uint256(maxSlippageBps) + uint256(marketEpsilonBps);
        uint256 adj = (uint256(oraclePx1e8) * bps) / 10_000;
        uint64 lim = isBuy
            ? uint64(uint256(oraclePx1e8) + adj)
            : uint64((uint256(oraclePx1e8) > adj) ? (uint256(oraclePx1e8) - adj) : 1);
        return quantizePx1e8(lim, baseSzDec, isBuy);
    }
}
