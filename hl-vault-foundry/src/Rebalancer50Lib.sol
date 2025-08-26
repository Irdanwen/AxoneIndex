// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library Rebalancer50Lib {
    // All values are expected in 1e18 USD notional for consistency.
    // equity1e18: total equity of the portfolio (USDC + perp equity) in 1e18
    // posBtc1e18: current BTC perp notional (signed) in 1e18
    // posHype1e18: current HYPE perp notional (signed) in 1e18
    // deadbandBps: basis points threshold around target 50/50
    // Returns deltas (signed) in 1e18 USD to reach 50/50. Positive => increase long exposure.
    function computeDeltas(
        uint256 equity1e18,
        int256 posBtc1e18,
        int256 posHype1e18,
        uint256 deadbandBps
    ) internal pure returns (int256 dBtc1e18, int256 dHype1e18) {
        if (equity1e18 == 0) {
            return (int256(0), int256(0));
        }
        // Target per asset = equity / 2
        int256 targetPerAsset = int256(equity1e18 / 2);

        int256 diffB = targetPerAsset - posBtc1e18; // positive => need to buy BTC
        int256 diffH = targetPerAsset - posHype1e18; // positive => need to buy HYPE

        // If both within deadband, return zeros
        uint256 threshold = (equity1e18 * deadbandBps) / 10000;
        bool withinB = _abs(diffB) <= int256(uint256(threshold));
        bool withinH = _abs(diffH) <= int256(uint256(threshold));
        if (withinB && withinH) {
            return (int256(0), int256(0));
        }

        return (diffB, diffH);
    }

    function _abs(int256 x) private pure returns (int256) {
        return x >= 0 ? x : -x;
    }
}

