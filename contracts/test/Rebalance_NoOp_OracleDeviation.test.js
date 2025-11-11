require("@nomicfoundation/hardhat-chai-matchers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CoreInteractionHandler: rebalance no-op on oracle deviation", function () {
  it("should update lastPx and skip orders (no revert) when deviated", async function () {
    const [owner, rebalancer] = await ethers.getSigners();

    // Deploy mocks
    const L1Read = await ethers.getContractFactory("MockL1Read");
    const l1 = await L1Read.deploy();
    const CoreWriter = await ethers.getContractFactory("MockCoreWriter");
    const writer = await CoreWriter.deploy();
    await writer.waitForDeployment();
    const systemCoreWriter = "0x3333333333333333333333333333333333333333";
    const writerCode = await ethers.provider.getCode(writer.target);
    await ethers.provider.send("hardhat_setCode", [systemCoreWriter, writerCode]);
    const USDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await USDC.deploy();

    // Deploy handler
    const Handler = await ethers.getContractFactory("CoreInteractionHandler");
    const handler = await Handler.deploy(
      l1.target,
      usdc.target,
      10_000_000_000n, // maxOutboundPerEpoch (1e10 = 100 USDC notionnel)
      1n,              // epochLength (blocs)
      owner.address,
      0n               // feeBps
    );

    await handler.setMinNotionalUsd1e8(100000000n);
    // Configure roles and IDs
    await handler.setRebalancer(rebalancer.address);
    await handler.setUsdcCoreLink(owner.address, 1); // usdc tokenId = 1
    await handler.setHypeCoreLink(owner.address, 3); // hype tokenId = 3
    await handler.setSpotIds(1, 2);                  // spotBTC=1, spotHYPE=2
    await handler.setSpotTokenIds(1, 2, 3);          // spotTokenBTC=2, spotTokenHYPE=3

    // Token infos (szDecimals, weiDecimals)
    await l1.setTokenInfo(1, "USDC", 8, 8);
    await l1.setTokenInfo(2, "BTC", 4, 10);
    await l1.setTokenInfo(3, "HYPE", 6, 8);

    // Initial prices (within band)
    await l1.setSpotPx(1, 50_000n); // BTC raw 1e3 → 50_000
    await l1.setSpotPx(2, 50n);     // HYPE raw 1e6 → 50
    // BBO for market limits
    await l1.setBbo(1 + 10000, 50_000n, 50_001n);
    await l1.setBbo(2 + 10000, 50n, 51n);

    // Some USDC balance to allow buys in a non-deviated scenario
    await l1.setSpotBalance(handler.target, 1, 1_000_000_000n); // 10 USDC in 1e8
    // No asset balances initially
    await l1.setSpotBalance(handler.target, 2, 0n);
    await l1.setSpotBalance(handler.target, 3, 0n);

    // Initialize lastPx via a successful rebalance call (no deviation)
    const handlerAsReb = handler.connect(rebalancer);
    await handlerAsReb.rebalancePortfolio(0, 0);

    const lastB1 = await handler.lastPxBtc1e8();
    const lastH1 = await handler.lastPxHype1e8();
    expect(lastB1).to.be.gt(0n);
    expect(lastH1).to.be.gt(0n);

    // Move prices outside the 5% band (e.g., +20%)
    await l1.setSpotPx(1, 60_000n); // +20%
    await l1.setSpotPx(2, 60n);     // +20%
    await l1.setBbo(1 + 10000, 60_000n, 60_001n);
    await l1.setBbo(2 + 10000, 60n, 61n);

    // Expect: no revert, event emitted, and no SpotOrderPlaced
    const tx = await handlerAsReb.rebalancePortfolio(0, 0);
    await expect(tx).to.emit(handler, "RebalanceSkippedOracleDeviation");
    await expect(tx).to.not.emit(handler, "SpotOrderPlaced");

    // lastPx should have been moved toward band limit or updated
    const lastB2 = await handler.lastPxBtc1e8();
    const lastH2 = await handler.lastPxHype1e8();
    expect(lastB2).to.be.gt(0n);
    expect(lastH2).to.be.gt(0n);
  });
});


