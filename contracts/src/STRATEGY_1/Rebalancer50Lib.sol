// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library Rebalancer50Lib {
    // All values are expected in 1e18 USD notional for consistency.
    // equity1e18: total equity of the portfolio (USDC + spot valuations) in 1e18
    // posBtc1e18: current BTC spot valuation (signed) in 1e18
    // posHype1e18: current HYPE spot valuation (signed) in 1e18
    // deadbandBps: basis points threshold around target 50/50
    // Returns deltas (signed) in 1e18 USD to reach 50/50. Positive => increase long exposure.
    function computeDeltas(
        uint256 equity1e18,
        int256 posBtc1e18,
        int256 posHype1e18,
        uint256 deadbandBps
    ) internal pure returns (int256 dBtc1e18, int256 dHype1e18) {
        if (equity1e18 == 0) return (int256(0), int256(0));
        int256 targetPerAsset = int256(equity1e18 / 2);
        int256 dB = targetPerAsset - posBtc1e18;
        int256 dH = targetPerAsset - posHype1e18;

        uint256 th = (equity1e18 * deadbandBps) / 10_000;
        if (_abs(dB) <= int256(th)) dB = 0;
        if (_abs(dH) <= int256(th)) dH = 0;
        return (dB, dH);
    }

    function _abs(int256 x) private pure returns (int256) {
        return x >= 0 ? x : -x;
    }
}

