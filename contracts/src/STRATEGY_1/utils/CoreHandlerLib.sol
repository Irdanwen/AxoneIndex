// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {L1Read} from "../interfaces/L1Read.sol";
import {HLConstants} from "./HLConstants.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

library CoreHandlerLib {
    using SafeCast for uint256;

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

    function toSz1e8(int256 deltaUsd1e18, uint64 price1e8) internal pure returns (uint64) {
        if (deltaUsd1e18 == 0 || price1e8 == 0) return 0;
        uint256 absUsd = uint256(deltaUsd1e18 > 0 ? deltaUsd1e18 : -deltaUsd1e18);
        // USD1e18 / price1e8 = base*1e10; pour retourner en 1e8, diviser par 100
        uint256 s = (absUsd / uint256(price1e8)) / 100;
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
        // = absUsd * 10^(szDecimals) / (px1e8 * 1e10)
        uint256 numerator = absUsd * (10 ** uint256(info.szDecimals));
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

    /// @notice Encode un ordre limite spot en respectant le format HyperCore (prix et taille en 1e8).
    /// @param asset Spot asset id (après offset HyperCore)
    /// @param isBuy Sens de l'ordre (true = achat)
    /// @param limitPx1e8 Prix humain * 1e8 (quantifié)
    /// @param sz1e8 Taille base humaine * 1e8
    function encodeSpotLimitOrder(
        uint32 asset,
        bool isBuy,
        uint64 limitPx1e8,
        uint64 sz1e8,
        bool reduceOnly,
        uint8 encodedTif,
        uint128 cloid
    ) internal pure returns (bytes memory) {
        return HLConstants.encodeSpotLimitOrder(
            HLConstants.ACTION_LIMIT_ORDER,
            asset,
            isBuy,
            limitPx1e8,
            sz1e8,
            reduceOnly,
            encodedTif,
            cloid
        );
    }

    function encodeSpotSend(
        address systemAddress,
        uint64 tokenId,
        uint64 amount
    ) internal pure returns (bytes memory) {
        return HLConstants.encodeSpotSend(HLConstants.ACTION_SPOT_SEND, systemAddress, tokenId, amount);
    }
}
