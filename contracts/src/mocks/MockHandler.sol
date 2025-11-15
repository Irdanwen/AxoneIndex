// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IHandler {
    function equitySpotUsd1e18() external view returns (uint256);
    function oraclePxHype1e8() external view returns (uint64);
    function executeDepositHype(bool forceRebalance) external payable;
    function pullHypeFromCoreToEvm(uint64 hype1e8) external returns (uint64);
    function sweepHypeToVault(uint256 amount1e18) external;
    function feeVault() external view returns (address);
}

contract MockHandler is IHandler {
    uint64 public constant ORACLE_PX_HYPE_1E8 = 50_000_000; // $50 per HYPE
    address public feeVaultAddress;

    constructor(address _feeVault) {
        feeVaultAddress = _feeVault;
    }

    function equitySpotUsd1e18() external pure returns (uint256) {
        return 0; // For simple ERC20 tests, we don't need Core equity
    }

    function oraclePxHype1e8() external pure returns (uint64) {
        return ORACLE_PX_HYPE_1E8;
    }

    function executeDepositHype(bool) external payable {
        // Mock implementation - do nothing
    }

    function pullHypeFromCoreToEvm(uint64) external pure returns (uint64) {
        return 0;
    }

    function sweepHypeToVault(uint256) external {
        // Mock implementation - do nothing
    }

    function feeVault() external view returns (address) {
        return feeVaultAddress;
    }
}






