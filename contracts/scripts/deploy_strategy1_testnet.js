const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  console.log("\n🚀 Déploiement STRATEGY_1 sur HyperEVM Testnet\n");

  if (!process.env.TESTNET_RPC_URL || !process.env.PRIVATE_KEY) {
    throw new Error("Variables d'environnement TESTNET_RPC_URL ou PRIVATE_KEY manquantes (voir contracts/env)");
  }

  const [deployer] = await ethers.getSigners();
  console.log("📝 Déployeur:", deployer.address);
  const gasPrice = ethers.parseUnits(process.env.GAS_PRICE_GWEI || "2", "gwei");

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  const waitForReceipt = async (hash, retries = 90, intervalMs = 1500) => {
    for (let i = 0; i < retries; i++) {
      try {
        const rcpt = await ethers.provider.getTransactionReceipt(hash);
        if (rcpt) return rcpt;
      } catch (e) {
        // Ignorer erreurs transitoires (rate limited, invalid block height)
      }
      await delay(intervalMs);
    }
    throw new Error(`Timeout en attente du receipt: ${hash}`);
  };
  const send = async (txPromise) => {
    const tx = await txPromise;
    // Attente résiliente au throttling
    const rcpt = await waitForReceipt(tx.hash);
    await delay(800);
    return rcpt;
  };

  // Déployer L1Read (wrapper des precompiles HyperCore) et CoreWriter (émetteur d'actions)
  console.log("\n🔧 Déploiement L1Read (wrapper des precompiles HyperCore)...");
  const L1Read = await ethers.getContractFactory("L1Read");
  const l1 = await L1Read.deploy({ gasPrice });
  await l1.waitForDeployment();
  await delay(1000);
  console.log("✅ L1Read:", await l1.getAddress());

  // Pas de mocks: utiliser l'adresse système CoreWriter fournie
  const CORE_WRITER_ADDRESS = "0x3333333333333333333333333333333333333333";

  // Pas de mocks: exiger une adresse USDC EVM réelle côté HyperEVM testnet
  const USDC_EVM_ADDRESS = process.env.USDC_EVM_ADDRESS;
  if (!USDC_EVM_ADDRESS) {
    throw new Error("USDC_EVM_ADDRESS manquant dans contracts/env (pas de mock autorisé)");
  }

  // Paramètres fournis
  const MAX_OUTBOUND_PER_EPOCH_1e8 = BigInt(100000) * 100000000n; // 100000 * 1e8
  const EPOCH_LENGTH_BLOCKS = 43200; // uint64
  const FEE_VAULT_ADDRESS = "0x69f37e426BDe3a41cC12Bdabb8BB43a916816D4f";
  const FEE_BPS = 50;
  const HYPE_CORE_SYSTEM_ADDRESS = "0x2222222222222222222222222222222222222222";
  const HYPE_CORE_TOKEN_ID = 1105;
  const SPOT_BTC_ID = 1054;
  const SPOT_HYPE_ID = 1035;
  const USDC_TOKEN_ID = 0;
  const BTC_TOKEN_ID = 1129;
  const HYPE_TOKEN_ID = 1105;
  const MAX_SLIPPAGE_BPS = 5000;
  const MARKET_EPSILON_BPS = 500;
  const DEADBAND_BPS_REQUESTED = 50;
  const MAX_ORACLE_DEV_BPS = 4500;
  const REBALANCER_ADDRESS = "0x1eE9C37E28D2DB4d8c35A94bB05C3f189191D506";

  // Validations basiques d'adresse EVM (42 chars)
  const isAddr = (a) => typeof a === "string" && /^0x[0-9a-fA-F]{40}$/.test(a);
  if (!isAddr(FEE_VAULT_ADDRESS)) throw new Error("FEE_VAULT_ADDRESS invalide");
  if (!isAddr(REBALANCER_ADDRESS)) throw new Error("REBALANCER_ADDRESS invalide");
  if (!isAddr(USDC_EVM_ADDRESS)) throw new Error("USDC_EVM_ADDRESS invalide");
  if (!isAddr(HYPE_CORE_SYSTEM_ADDRESS)) throw new Error("HYPE_CORE_SYSTEM_ADDRESS invalide (fournissez 20 bytes)");

  console.log("ℹ️ Rappel: effectuez un micro-transfert HyperCore vers l'adresse du handler après déploiement pour éviter `CoreAccountMissing()` lors du premier ordre.");

  console.log("\n🔧 Déploiement CoreInteractionHandler...");
  const CoreInteractionHandler = await ethers.getContractFactory("CoreInteractionHandler");
  const maxOutboundPerEpoch = MAX_OUTBOUND_PER_EPOCH_1e8;
  const epochLen = EPOCH_LENGTH_BLOCKS;
  const feeVault = FEE_VAULT_ADDRESS;
  const feeBps = FEE_BPS;
  const handler = await CoreInteractionHandler.deploy(
    l1.target,
    USDC_EVM_ADDRESS,
    maxOutboundPerEpoch,
    epochLen,
    feeVault,
    feeBps,
    { gasPrice }
  );
  await handler.waitForDeployment();
  console.log("✅ CoreInteractionHandler:", await handler.getAddress());
  await delay(1500);

  // Configuration du handler pour HyperCore Testnet
  await send(handler.setSpotIds(SPOT_BTC_ID, SPOT_HYPE_ID, { gasPrice }));
  await send(handler.setSpotTokenIds(USDC_TOKEN_ID, BTC_TOKEN_ID, HYPE_TOKEN_ID, { gasPrice }));
  // Lien USDC Core explicite selon vos paramètres
  await send(handler.setUsdcCoreLink("0x2000000000000000000000000000000000000000", USDC_TOKEN_ID, { gasPrice }));
  await send(handler.setHypeCoreLink(HYPE_CORE_SYSTEM_ADDRESS, HYPE_CORE_TOKEN_ID, { gasPrice }));
  const deadbandBps = DEADBAND_BPS_REQUESTED > 50 ? 50 : DEADBAND_BPS_REQUESTED;
  if (DEADBAND_BPS_REQUESTED > 50) {
    console.log(`⚠️ DEADBAND_BPS demandé (${DEADBAND_BPS_REQUESTED}) > 50, utilisation de 50 (contrainte du contrat).`);
  }
  await send(handler.setParams(MAX_SLIPPAGE_BPS, MARKET_EPSILON_BPS, deadbandBps, { gasPrice }));
  await send(handler.setMaxOracleDeviationBps(MAX_ORACLE_DEV_BPS, { gasPrice }));
  await send(handler.setRebalancer(REBALANCER_ADDRESS, { gasPrice }));

  console.log("\n🔧 Déploiement VaultContract...");
  const Vault = await ethers.getContractFactory("VaultContract");
  const vault = await Vault.deploy({ gasPrice });
  await vault.waitForDeployment();
  await delay(1000);
  console.log("✅ VaultContract:", await vault.getAddress());

  await send(handler.setVault(vault.target, { gasPrice }));
  await send(vault.setHandler(handler.target, { gasPrice }));
  await send(vault.setFees(50, 50, 10000, { gasPrice }));

  console.log("\n📋 Adresses (HyperEVM Testnet):");
  console.log("L1Read:", await l1.getAddress());
  console.log("CoreWriter (système):", CORE_WRITER_ADDRESS);
  console.log("USDC (EVM):", USDC_EVM_ADDRESS);
  console.log("CoreInteractionHandler:", await handler.getAddress());
  console.log("VaultContract:", await vault.getAddress());
  console.log("\n🎉 Déploiement STRATEGY_1 terminé sur testnet.");
}

main().catch((e) => {
  console.error("❌ Erreur de déploiement testnet:", e);
  process.exit(1);
});


