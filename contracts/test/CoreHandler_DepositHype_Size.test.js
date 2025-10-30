require("@nomicfoundation/hardhat-chai-matchers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CoreHandler: dépôt HYPE et conversions de taille", function () {
  it("toSzInSzDecimals calcule ~0.5 HYPE (szDecimals=8) pour 0.5 HYPE @ $50", async function () {
    const [deployer] = await ethers.getSigners();

    const MockL1Read = await ethers.getContractFactory("MockL1Read");
    const l1 = await MockL1Read.deploy();

    // TokenId arbitraire pour HYPE spot
    const spotTokenHype = 102;
    // szDecimals=8, weiDecimals arbitraire (18)
    await l1.setTokenInfo(spotTokenHype, "HYPE", 8, 18);

    // Prix HYPE en 1e8: $50 -> 5e9? Non, 50 * 1e8 = 5_000_000_000
    const pxH1e8 = 5000000000n;

    // USD notionnel 1e18 pour 0.5 HYPE à $50 = $25 => 25e18
    const usd1e18 = ethers.parseEther("25");

    const TestLib = await ethers.getContractFactory("TestCoreHandlerLib");
    const testLib = await TestLib.deploy();

    const sz = await testLib.toSzInSzDecimals(l1.target, spotTokenHype, usd1e18, pxH1e8);
    // Attendu: 0.5 * 10^8 = 50,000,000
    expect(sz).to.equal(50000000n);
  });

  it("executeDepositHype émet des ordres d'achat non nuls et plausibles", async function () {
    const [owner, vault, systemUSDC, systemHYPE] = await ethers.getSigners();

    const MockL1Read = await ethers.getContractFactory("MockL1Read");
    const l1 = await MockL1Read.deploy();

    const MockCoreWriter = await ethers.getContractFactory("MockCoreWriter");
    const writer = await MockCoreWriter.deploy();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    // Déployer le handler
    const Handler = await ethers.getContractFactory("CoreInteractionHandler");
    const maxOutbound = 1000000000000n; // large
    const epochLen = 10;
    const handler = await Handler.deploy(l1.target, writer.target, usdc.target, maxOutbound, epochLen, owner.address, 0);

    // Config required
    await handler.connect(owner).setVault(vault.address);
    // IDs arbitraires
    const spotBTC = 1, spotHYPE = 2;
    const usdcTokenId = 100, btcTokenId = 101, hypeTokenId = 102;
    await handler.connect(owner).setUsdcCoreLink(systemUSDC.address, usdcTokenId);
    await handler.connect(owner).setHypeCoreLink(systemHYPE.address, hypeTokenId);
    await handler.connect(owner).setSpotIds(spotBTC, spotHYPE);
    await handler.connect(owner).setSpotTokenIds(usdcTokenId, btcTokenId, hypeTokenId);

    // Token infos: szDecimals=8 pour BTC/HYPE, weiDecimals=18 pour valuation; USDC weiDecimals=8
    await l1.setTokenInfo(usdcTokenId, "USDC", 8, 8);
    await l1.setTokenInfo(btcTokenId, "BTC", 8, 18);
    await l1.setTokenInfo(hypeTokenId, "HYPE", 8, 18);

    // Prix bruts: le handler normalise: BTC 1e3->×1e5, HYPE 1e6->×1e2
    // Cible en 1e8: BTC ~ 30_000 * 1e8 => 3e12 => raw 30_000 * 1e3 = 30_000_000, HYPE $50 => 5e9 => raw 50 * 1e6 = 50_000_000
    await l1.setSpotPx(spotBTC, 30000000);
    await l1.setSpotPx(spotHYPE, 50000000);

    // BBO bruts (peu importe la cohérence exacte pour ce test)
    await l1.setBbo(spotBTC, 30000000, 30010000);
    await l1.setBbo(spotHYPE, 50000000, 50010000);

    // Exécuter un dépôt HYPE de 0.5 HYPE
    const hypeDeposit = ethers.parseEther("0.5");

    // Exécuter deux dépôts et récupérer les événements par filtre
    await handler.connect(vault).executeDepositHype(true, { value: hypeDeposit });
    const tx2 = await handler.connect(vault).executeDepositHype(false, { value: hypeDeposit });
    const rcpt2 = await tx2.wait();
    const events = await handler.queryFilter(handler.filters.SpotOrderPlaced());
    // Chercher événements par asset (sur le dernier tx)
    const evtB = events.find(e => e.args.asset === BigInt(spotBTC));
    const evtH = events.find(e => e.args.asset === BigInt(spotHYPE));
    expect(evtB).to.not.equal(undefined);
    expect(evtH).to.not.equal(undefined);
    const sizeB = evtB.args.sizeSzDecimals;
    const sizeH = evtH.args.sizeSzDecimals;

    expect(sizeB).to.be.gt(0n);
    expect(sizeH).to.be.gt(0n);
    // Taille HYPE rachetée ~ 0.5 * (1 - réserve 1%) ~= 0.495 HYPE => en szDecimals=8 => 49_500_000 env.
    const maxRebuyH = 50000000n;
    expect(sizeH).to.be.lte(maxRebuyH);
  });
});


