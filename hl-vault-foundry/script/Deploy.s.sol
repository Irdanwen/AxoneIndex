// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {CoreInteractionHandler, ICoreWriter, IERC20 as IERC20Handler} from "../src/CoreInteractionHandler.sol";
import {VaultContract, IHandler, IERC20 as IERC20Vault} from "../src/VaultContract.sol";
import {L1Read} from "../src/interfaces/L1Read.sol";

contract Deploy is Script {
    function run() external {
        address usdcEvm = vm.envAddress("USDC_EVM");
        address coreWriterAddr = vm.envAddress("CORE_WRITER");
        address l1readAddr = vm.envAddress("L1READ");

        vm.startBroadcast();

        CoreInteractionHandler handler = new CoreInteractionHandler(
            L1Read(l1readAddr),
            ICoreWriter(coreWriterAddr),
            IERC20Handler(usdcEvm)
        );
        VaultContract vault = new VaultContract(IERC20Vault(usdcEvm));

        vault.setHandler(IHandler(address(handler)));
        handler.setVault(address(vault));

        // TODO utilisateur: configurer liens Core Spot
        // handler.setUsdcCoreLink(<USDC_CORE_SYSTEM_ADDR>, <USDC_CORE_TOKEN_ID>);
        // handler.setSpotIds(<BTC_SPOT_ID>, <HYPE_SPOT_ID>);
        // handler.setSpotTokenIds(<USDC_TOKEN_ID>, <BTC_TOKEN_ID>, <HYPE_TOKEN_ID>);
        // handler.setLimits(200_000_000, 3600);
        // handler.setParams(50, 10, 100);
        // vault.setFees(0, 0, 9000);

        vm.stopBroadcast();
    }
}


