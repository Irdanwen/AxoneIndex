const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  console.log("\n🚀 Déploiement STRATEGY_1: CoreInteractionHandler + VaultContract\n");

  const [deployer, systemUSDC, systemHYPE] = await ethers.getSigners();
  console.log("📝 Déployeur:", deployer.address);

  // Mocks et dépendances système (réseau local Hardhat)
  console.log("\n🔧 Déploiement MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  console.log("✅ MockUSDC:", await usdc.getAddress());

  console.log("\n🔧 Déploiement MockL1Read...");
  const MockL1Read = await ethers.getContractFactory("MockL1Read");
  const l1 = await MockL1Read.deploy();
  await l1.waitForDeployment();
  console.log("✅ MockL1Read:", await l1.getAddress());

  console.log("\n🔧 Déploiement MockCoreWriter (mappé sur l'adresse système)...");
  const MockCoreWriter = await ethers.getContractFactory("MockCoreWriter");
  const writer = await MockCoreWriter.deploy();
  await writer.waitForDeployment();
  const coreWriterSystem = "0x3333333333333333333333333333333333333333";
  const writerCode = await ethers.provider.getCode(writer.target);
  await ethers.provider.send("hardhat_setCode", [coreWriterSystem, writerCode]);
  console.log("✅ MockCoreWriter déployé et injecté à", coreWriterSystem);

  // Paramètres et IDs de test (cohérents avec les tests)
  const spotBTC = 1;
  const spotHYPE = 2;
  const usdcTokenId = 100;
  const btcTokenId = 101;
  const hypeTokenId = 102;

  // Config HyperCore mock: décimales et prix
  await l1.setTokenInfo(usdcTokenId, "USDC", 8, 8);
  await l1.setTokenInfo(btcTokenId, "BTC", 4, 10);
  await l1.setTokenInfo(hypeTokenId, "HYPE", 6, 8);
  // Prix bruts (normalisés dans le handler): BTC 30_000 (1e3), HYPE 50 (1e6)
  await l1.setSpotPx(spotBTC, 30000000);
  await l1.setSpotPx(spotHYPE, 50000000);
  await l1.setBbo(spotBTC, 30000000, 30010000);
  await l1.setBbo(spotHYPE, 50000000, 50010000);

  console.log("\n🔧 Déploiement CoreInteractionHandler...");
  const CoreInteractionHandler = await ethers.getContractFactory("CoreInteractionHandler");
  const maxOutboundPerEpoch = 1_000_000_000n; // 1e9 en 1e8 (USD notionnel)
  const epochLen = 10; // blocs
  const feeVault = deployer.address;
  const feeBps = 0;
  const handler = await CoreInteractionHandler.deploy(
    l1.target,
    usdc.target,
    maxOutboundPerEpoch,
    epochLen,
    feeVault,
    feeBps
  );
  await handler.waitForDeployment();
  console.log("✅ CoreInteractionHandler:", await handler.getAddress());

  // Configuration du handler
  await (await handler.setSpotIds(spotBTC, spotHYPE)).wait();
  await (await handler.setSpotTokenIds(usdcTokenId, btcTokenId, hypeTokenId)).wait();
  await (await handler.setUsdcCoreLink(systemUSDC.address, usdcTokenId)).wait();
  await (await handler.setHypeCoreLink(systemHYPE.address, hypeTokenId)).wait();
  await (await handler.setParams(50, 10, 50)).wait(); // maxSlippage=0.5%, epsilon=0.1%, deadband=0.5%

  console.log("\n🔧 Déploiement VaultContract...");
  const Vault = await ethers.getContractFactory("VaultContract");
  const vault = await Vault.deploy();
  await vault.waitForDeployment();
  console.log("✅ VaultContract:", await vault.getAddress());

  await (await handler.setVault(vault.target)).wait();
  await (await vault.setHandler(handler.target)).wait();
  await (await vault.setFees(0, 0, 9000)).wait(); // pas de frais, auto-deploy 90%

  console.log("\n📋 Adresses déployées:");
  console.log("MockUSDC:", await usdc.getAddress());
  console.log("MockL1Read:", await l1.getAddress());
  console.log("MockCoreWriter (injection système):", coreWriterSystem);
  console.log("CoreInteractionHandler:", await handler.getAddress());
  console.log("VaultContract:", await vault.getAddress());

  console.log("\n🎉 Déploiement STRATEGY_1 terminé.");
}

main().catch((e) => {
  console.error("❌ Erreur de déploiement:", e);
  process.exit(1);
});


