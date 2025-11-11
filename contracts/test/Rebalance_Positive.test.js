require("@nomicfoundation/hardhat-chai-matchers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CoreInteractionHandler: rebalance positive flow", function () {
  it("should emit Rebalanced and place buy orders for BTC and HYPE", async function () {
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

    await handler.setMinNotionalUsd1e8(1n);
    // Roles and IDs
    await handler.setRebalancer(rebalancer.address);
    await handler.setUsdcCoreLink(owner.address, 1); // usdc tokenId = 1
    await handler.setHypeCoreLink(owner.address, 3); // hype tokenId = 3
    await handler.setSpotIds(1, 2);                  // spotBTC=1, spotHYPE=2
    await handler.setSpotTokenIds(1, 2, 3);          // usdcTokenId=1, spotTokenBTC=2, spotTokenHYPE=3

    // Token infos (szDecimals, weiDecimals alignés aux tests existants)
    await l1.setTokenInfo(1, "USDC", 8, 8);
    await l1.setTokenInfo(2, "BTC", 4, 10);
    await l1.setTokenInfo(3, "HYPE", 6, 8);

    // Initial prices (within allowed deviation band)
    await l1.setSpotPx(1, 50_000n); // BTC raw 1e3 → 50_000
    await l1.setSpotPx(2, 50n);     // HYPE raw 1e6 → 50
    // BBO for market limits (raw, handler normalizes internally)
    await l1.setBbo(1 + 10000, 50_000n, 50_001n);
    await l1.setBbo(2 + 10000, 50n, 51n);

    // Provide USDC liquidity (10 USDC, 1e8 decimals)
    await l1.setSpotBalance(handler.target, 1, 1_000_000_000n);
    // No BTC/HYPE initial
    await l1.setSpotBalance(handler.target, 2, 0n);
    await l1.setSpotBalance(handler.target, 3, 0n);

    // Call as rebalancer
    const handlerAsReb = handler.connect(rebalancer);
    const tx = await handlerAsReb.rebalancePortfolio(0, 0);
    await expect(tx).to.emit(handler, "Rebalanced");

    // Expect buy orders for both assets
    const rcpt = await tx.wait();
    const events = await handler.queryFilter(handler.filters.SpotOrderPlaced(), rcpt.blockNumber, rcpt.blockNumber);
    const evtB = events.find(e => e.args.asset === 1n); // spotBTC id
    const evtH = events.find(e => e.args.asset === 2n); // spotHYPE id
    expect(evtB).to.not.equal(undefined);
    expect(evtH).to.not.equal(undefined);
    expect(evtB.args.isBuy).to.equal(true);
    expect(evtH.args.isBuy).to.equal(true);
    expect(evtB.args.sizeSzDecimals).to.be.gt(0n);
    expect(evtH.args.sizeSzDecimals).to.be.gt(0n);
  });

  it("should revert when caller is not rebalancer", async function () {
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

    // Not setting rebalancer → caller is not authorized
    await expect(handler.rebalancePortfolio(0, 0)).to.be.revertedWithCustomError(handler, "NotRebalancer");
  });
});



