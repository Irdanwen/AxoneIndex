// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {CoreInteractionHandler} from "../src/CoreInteractionHandler.sol";
import {VaultContract} from "../src/VaultContract.sol";
import {L1Read} from "../src/interfaces/L1Read.sol";

interface ICoreWriter { function sendRawAction(bytes calldata) external; }
interface IERC20 { function decimals() external view returns (uint8); }

contract Deploy is Script {
    function run() external {
        address usdcEvm = vm.envAddress("USDC_EVM");
        address coreWriterAddr = vm.envAddress("CORE_WRITER");
        address l1readAddr = vm.envAddress("L1READ");

        vm.startBroadcast();

        CoreInteractionHandler handler = new CoreInteractionHandler(
            L1Read(l1readAddr),
            ICoreWriter(coreWriterAddr),
            IERC20(usdcEvm)
        );
        VaultContract vault = new VaultContract(IERC20(usdcEvm));

        vault.setHandler(handler);
        handler.setVault(address(vault));

        // TODO utilisateur: configurer liens Core
        // handler.setUsdcCoreLink(<USDC_CORE_SYSTEM_ADDR>, <USDC_CORE_TOKEN_ID>);
        // handler.setPerpIds(<BTC_ID>, <HYPE_ID>);
        // handler.setLimits(200_000_000, 3600);
        // handler.setParams(50, 10, 100);
        // vault.setFees(0, 0, 9000);

        vm.stopBroadcast();
    }
}


