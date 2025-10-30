// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Rebalancer50Lib} from "../STRATEGY_1/Rebalancer50Lib.sol";

contract TestRebalancer50Lib {
    function compute(
        uint256 equity1e18,
        int256 posB1e18,
        int256 posH1e18,
        uint256 deadbandBps
    ) external pure returns (int256, int256) {
        return Rebalancer50Lib.computeDeltas(equity1e18, posB1e18, posH1e18, deadbandBps);
    }
}


