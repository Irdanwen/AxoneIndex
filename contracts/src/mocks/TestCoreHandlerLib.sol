// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {CoreHandlerLib} from "../STRATEGY_1/utils/CoreHandlerLib.sol";
import {L1Read} from "../STRATEGY_1/interfaces/L1Read.sol";

contract TestCoreHandlerLib {
    function toSzInSzDecimals(
        address l1,
        uint64 spotTokenId,
        int256 deltaUsd1e18,
        uint64 price1e8
    ) external view returns (uint64) {
        return CoreHandlerLib.toSzInSzDecimals(L1Read(l1), spotTokenId, deltaUsd1e18, price1e8);
    }
}


