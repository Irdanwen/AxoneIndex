// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {VaultContract} from "../src/VaultContract.sol";
import {CoreInteractionHandler} from "../src/CoreInteractionHandler.sol";

interface IERC20 {
    function approve(address spender, uint256 value) external returns (bool);
}

contract DemoFlow is Script {
    function run() external {
        address vaultAddr = vm.envAddress("VAULT");
        address handlerAddr = vm.envAddress("HANDLER");
        address usdcAddr = vm.envAddress("USDC_EVM");

        vm.startBroadcast();

        IERC20(usdcAddr).approve(vaultAddr, 100e6);
        VaultContract(vaultAddr).deposit(100e6);

        CoreInteractionHandler(handlerAddr).rebalancePortfolio(0, 0);

        uint256 shares = VaultContract(vaultAddr).balanceOf(msg.sender);
        VaultContract(vaultAddr).withdraw(shares);

        // if queued, admin flow example
        // VaultContract(vaultAddr).recallFromCoreAndSweep(50e6);
        // CoreInteractionHandler(handlerAddr).sweepToVault(50e6);
        // VaultContract(vaultAddr).settleWithdraw(0, 50e6, msg.sender);

        vm.stopBroadcast();
    }
}


