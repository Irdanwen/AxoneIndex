require("@nomicfoundation/hardhat-chai-matchers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CoreInteractionHandler: deposit no-op on oracle deviation", function () {
  it("USDC deposit should credit and skip orders (no revert) when deviated", async function () {
    const [owner] = await ethers.getSigners();

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

    const Handler = await ethers.getContractFactory("CoreInteractionHandler");
    const handler = await Handler.deploy(
      l1.target,
      usdc.target,
      10_000_000_000n,
      1n,
      owner.address,
      0n
    );

    await handler.setMinNotionalUsd1e8(1n);
    await handler.setVault(owner.address);
    await handler.setUsdcCoreLink(owner.address, 1);
    await handler.setHypeCoreLink(owner.address, 3);
    await handler.setSpotIds(1, 2);
    await handler.setSpotTokenIds(1, 2, 3);

    await l1.setTokenInfo(1, "USDC", 8, 8);
    await l1.setTokenInfo(2, "BTC", 4, 10);
    await l1.setTokenInfo(3, "HYPE", 6, 8);

    // Initialize lastPx with in-band prices
    await l1.setSpotPx(1, 50_000n);
    await l1.setSpotPx(2, 50n);
    await l1.setBbo(1 + 10000, 50_000n, 50_001n);
    await l1.setBbo(2 + 10000, 50n, 51n);

    // Give handler some USDC balance by depositing once (no deviation) to set lastPx via rebalance later if needed
    await usdc.mint(owner.address, 1_000_000_000n); // 10 USDC
    await usdc.approve(handler.target, 1_000_000_000n);
    await handler.executeDeposit(100_000_000n, false); // 1 USDC deposit normal

    // Now set deviation +20%
    await l1.setSpotPx(1, 60_000n);
    await l1.setSpotPx(2, 60n);
    await l1.setBbo(1 + 10000, 60_000n, 60_001n);
    await l1.setBbo(2 + 10000, 60n, 61n);

    // New USDC deposit should emit skip event and place no orders
    await usdc.mint(owner.address, 1_000_000_000n);
    await usdc.approve(handler.target, 1_000_000_000n);
    const tx = await handler.executeDeposit(100_000_000n, false);
    await expect(tx).to.emit(handler, "DepositSkippedOracleDeviationUsdc");
    await expect(tx).to.not.emit(handler, "SpotOrderPlaced");
  });

  it("HYPE deposit should credit and skip sell/orders (no revert) when deviated", async function () {
    const [owner] = await ethers.getSigners();

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

    const Handler = await ethers.getContractFactory("CoreInteractionHandler");
    const handler = await Handler.deploy(
      l1.target,
      usdc.target,
      10_000_000_000n,
      1n,
      owner.address,
      0n
    );

    await handler.setMinNotionalUsd1e8(1n);
    await handler.setVault(owner.address);
    await handler.setUsdcCoreLink(owner.address, 1);
    await handler.setHypeCoreLink(owner.address, 3);
    await handler.setSpotIds(1, 2);
    await handler.setSpotTokenIds(1, 2, 3);

    await l1.setTokenInfo(1, "USDC", 8, 8);
    await l1.setTokenInfo(2, "BTC", 4, 10);
    await l1.setTokenInfo(3, "HYPE", 6, 8);

    // Initialize lastPx with in-band prices
    await l1.setSpotPx(1, 50_000n);
    await l1.setSpotPx(2, 50n);
    await l1.setBbo(1 + 10000, 50_000n, 50_001n);
    await l1.setBbo(2 + 10000, 50n, 51n);

    // Give handler some initial deposit (no deviation) to set lastPx via rebalance
    await usdc.mint(owner.address, 1_000_000_000n); // 10 USDC
    await usdc.approve(handler.target, 1_000_000_000n);
    await handler.executeDeposit(100_000_000n, false); // 1 USDC deposit normal to initialize lastPx

    // Now set deviation +20%
    await l1.setSpotPx(1, 60_000n);
    await l1.setSpotPx(2, 60n);
    await l1.setBbo(1 + 10000, 60_000n, 60_001n);
    await l1.setBbo(2 + 10000, 60n, 61n);

    // HYPE native deposit: should emit skip event and place no orders
    const tx = await handler.executeDepositHype(false, { value: ethers.parseEther("1.0") });
    await expect(tx).to.emit(handler, "DepositSkippedOracleDeviationHype");
    await expect(tx).to.not.emit(handler, "SpotOrderPlaced");
  });
});


