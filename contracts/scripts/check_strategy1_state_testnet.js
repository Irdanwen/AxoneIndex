const hre = require("hardhat");

async function main() {
  const { ethers } = hre;

  const VAULT = process.env.VAULT;
  const HANDLER = process.env.HANDLER;
  if (!VAULT || !HANDLER) {
    throw new Error("Merci de fournir VAULT et HANDLER dans l'environnement");
  }

  const vault = await ethers.getContractAt("VaultContract", VAULT);
  const handler = await ethers.getContractAt("CoreInteractionHandler", HANDLER);

  const paused = await vault.paused();
  const totalSupply = await vault.totalSupply();
  const nav = await vault.nav1e18().catch(() => 0n);
  const vaultHandler = await vault.handler().catch(() => "0x0000000000000000000000000000000000000000");
  const oraclePx = await handler.oraclePxHype1e8().catch((err) => {
    console.error("Erreur oraclePxHype1e8:", err?.error?.message || err?.message || err);
    return 0n;
  });
  const feeVault = await handler.feeVault();
  const usdcCoreSystemAddress = await handler.usdcCoreSystemAddress();
  const hypeCoreSystemAddress = await handler.hypeCoreSystemAddress();
  const usdcCoreTokenId = await handler.usdcCoreTokenId();
  const hypeCoreTokenId = await handler.hypeCoreTokenId();
  const autoDeploy = await vault.autoDeployBps();
  const depositFee = await vault.depositFeeBps();
  const maxOutboundPerEpoch = await handler.maxOutboundPerEpoch();
  const epochLength = await handler.epochLength();
  const sentThisEpoch = await handler.sentThisEpoch();
  const lastEpochStart = await handler.lastEpochStart();

  console.log("Vault status:", {
    paused,
    totalSupply: totalSupply.toString(),
    nav1e18: nav.toString(),
    depositFeeBps: Number(depositFee),
    autoDeployBps: Number(autoDeploy),
    handler: vaultHandler,
  });
  console.log("Handler status:", {
    feeVault,
    oraclePxHype1e8: oraclePx.toString(),
    usdcCoreSystemAddress,
    hypeCoreSystemAddress,
    usdcCoreTokenId: Number(usdcCoreTokenId),
    hypeCoreTokenId: Number(hypeCoreTokenId),
    maxOutboundPerEpoch: maxOutboundPerEpoch.toString(),
    epochLength: Number(epochLength),
    sentThisEpoch: sentThisEpoch.toString(),
    lastEpochStart: Number(lastEpochStart),
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

