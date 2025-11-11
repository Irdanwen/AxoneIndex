require("@nomicfoundation/hardhat-chai-matchers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CoreHandler: dépôt HYPE et conversions de taille", function () {
  it("toSzInSzDecimals calcule ~0.5 HYPE (szDecimals=6) pour 0.5 HYPE @ $50", async function () {
    const [deployer] = await ethers.getSigners();

    const MockL1Read = await ethers.getContractFactory("MockL1Read");
    const l1 = await MockL1Read.deploy();

    // TokenId arbitraire pour HYPE spot
    const spotTokenHype = 102;
    // szDecimals=6, weiDecimals=8 comme sur HyperCore
    await l1.setTokenInfo(spotTokenHype, "HYPE", 6, 8);

    // Prix HYPE en 1e8: $50 -> 5e9? Non, 50 * 1e8 = 5_000_000_000
    const pxH1e8 = 5000000000n;

    // USD notionnel 1e18 pour 0.5 HYPE à $50 = $25 => 25e18
    const usd1e18 = ethers.parseEther("25");

    const TestLib = await ethers.getContractFactory("TestCoreHandlerLib");
    const testLib = await TestLib.deploy();

    const sz = await testLib.toSzInSzDecimals(l1.target, spotTokenHype, usd1e18, pxH1e8);
    // Attendu: 0.5 * 10^6 = 500,000
    expect(sz).to.equal(500000n);
  });

  it("executeDepositHype émet des ordres d'achat non nuls et plausibles", async function () {
    const [owner, vault, systemUSDC, systemHYPE] = await ethers.getSigners();

    const MockL1Read = await ethers.getContractFactory("MockL1Read");
    const l1 = await MockL1Read.deploy();

    const MockCoreWriter = await ethers.getContractFactory("MockCoreWriter");
    const writer = await MockCoreWriter.deploy();
    await writer.waitForDeployment();
    const systemCoreWriter = "0x3333333333333333333333333333333333333333";
    const writerCode = await ethers.provider.getCode(writer.target);
    await ethers.provider.send("hardhat_setCode", [systemCoreWriter, writerCode]);

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    // Déployer le handler
    const Handler = await ethers.getContractFactory("CoreInteractionHandler");
    const maxOutbound = 1000000000000n; // large
    const epochLen = 10;
    const handler = await Handler.deploy(l1.target, usdc.target, maxOutbound, epochLen, owner.address, 0);

    // Abaisser le notional minimal pour les tests (éviter les reverts sur petits ordres)
    await handler.connect(owner).setMinNotionalUsd1e8(1n);

    // Config required
    await handler.connect(owner).setVault(vault.address);
    // IDs arbitraires
    const spotBTC = 1, spotHYPE = 2;
    const usdcTokenId = 100, btcTokenId = 101, hypeTokenId = 102;
    await handler.connect(owner).setUsdcCoreLink(systemUSDC.address, usdcTokenId);
    await handler.connect(owner).setHypeCoreLink(systemHYPE.address, hypeTokenId);
    await handler.connect(owner).setSpotIds(spotBTC, spotHYPE);
    await handler.connect(owner).setSpotTokenIds(usdcTokenId, btcTokenId, hypeTokenId);
    // Définir pxDecimals pour aligner la normalisation attendue
    await handler.connect(owner).setSpotPxDecimals(spotBTC, 3);
    await handler.connect(owner).setSpotPxDecimals(spotHYPE, 6);

    // Token infos: paramètres alignés sur HyperCore (USDC 8/8, BTC 4/10, HYPE 6/8)
    await l1.setTokenInfo(usdcTokenId, "USDC", 8, 8);
    await l1.setTokenInfo(btcTokenId, "BTC", 4, 10);
    await l1.setTokenInfo(hypeTokenId, "HYPE", 6, 8);

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
    // Taille HYPE rachetée ~ 0.5 * (1 - réserve 1%) ~= 0.495 HYPE => en szDecimals=6 => 495,000 env.
    const maxRebuyH = 495000n;
    expect(sizeH).to.be.lte(maxRebuyH);
  });

  it("normalise le prix spot via tokenInfo quand aucun override n'est défini", async function () {
    const [owner, vault, systemUSDC, systemHYPE] = await ethers.getSigners();

    const MockL1Read = await ethers.getContractFactory("MockL1Read");
    const l1 = await MockL1Read.deploy();

    const MockCoreWriter = await ethers.getContractFactory("MockCoreWriter");
    const writer = await MockCoreWriter.deploy();
    await writer.waitForDeployment();
    const systemCoreWriter = "0x3333333333333333333333333333333333333333";
    const writerCode = await ethers.provider.getCode(writer.target);
    await ethers.provider.send("hardhat_setCode", [systemCoreWriter, writerCode]);

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    const Handler = await ethers.getContractFactory("CoreInteractionHandler");
    const handler = await Handler.deploy(
      l1.target,
      usdc.target,
      1_000_000_000n,
      10,
      owner.address,
      0
    );

    await handler.connect(owner).setVault(vault.address);
    const spotBTC = 1;
    const spotHYPE = 2;
    const usdcTokenId = 100;
    const hypeTokenId = 102;

    await handler.connect(owner).setUsdcCoreLink(systemUSDC.address, usdcTokenId);
    await handler.connect(owner).setHypeCoreLink(systemHYPE.address, hypeTokenId);
    await handler.connect(owner).setSpotIds(spotBTC, spotHYPE);
    await handler.connect(owner).setSpotTokenIds(usdcTokenId, 101, hypeTokenId);

    await l1.setTokenInfo(hypeTokenId, "HYPE", 2, 8);
    await l1.setSpotInfo(spotHYPE, "HYPE/USDC", hypeTokenId, usdcTokenId);

    const rawPx = 80645000n; // 80.645 USD avec 6 décimales (1e6)
    const normalized = await handler.toPx1e8Public(spotHYPE, rawPx);
    expect(normalized).to.equal(8064500000n); // 80.645 * 1e8
  });
});


