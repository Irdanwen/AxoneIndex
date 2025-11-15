const hre = require("hardhat");

async function main() {
  const { ethers } = hre;

  // Dernier déploiement STRATEGY_1 (voir docs/deployments/STRATEGY_1_TESTNET.md)
  const VAULT =
    process.env.VAULT ||
    "0x82A9ec1B0c949c80dC9fDddD530DF83AB5190D46";
  const HANDLER =
    process.env.HANDLER ||
    "0x5Ac60985E55d2B33cc2a26286a7325202bA487db";

  const amount1e18 =
    process.env.DEPOSIT_HYPE_1E18 != null
      ? BigInt(process.env.DEPOSIT_HYPE_1E18)
      : 8n * 10n ** 17n; // 0.8 HYPE par défaut

  const [signer] = await ethers.getSigners();
  console.log("Signer:", await signer.getAddress());
  console.log("Vault:", VAULT);
  console.log("Handler:", HANDLER);
  console.log("Amount (wei):", amount1e18.toString());

  const vault = await ethers.getContractAt(
    "VaultContract",
    VAULT,
    signer
  );

  // 1) Debug en staticCall sur vault.deposit (même chemin que le script principal)
  try {
    console.log(">>> vault.deposit.staticCall({ value: amount }) …");
    await vault.deposit.staticCall({ value: amount1e18 });
    console.log("staticCall OK (aucun revert détecté)");
  } catch (err) {
    const e = err?.error ?? err;
    console.error("vault.deposit.staticCall reverted:");
    console.error(" message:", e?.message || String(e));
    if (e?.code) console.error(" code:", e.code);
    if (e?.errorName) console.error(" errorName:", e.errorName);
    if (e?.errorSignature) console.error(" errorSignature:", e.errorSignature);
    if (e?.errorArgs) console.error(" errorArgs:", e.errorArgs);
    return;
  }

  // 2) Si staticCall passe, tenter une vraie tx (optionnel)
  try {
    console.log(">>> Envoi d’une vraie tx vault.deposit({ value: amount }) …");
    const tx = await vault.deposit({ value: amount1e18 });
    console.log("tx sent:", tx.hash);
    const rcpt = await tx.wait();
    console.log("tx mined, status:", rcpt.status);
  } catch (err) {
    const e = err?.error ?? err;
    console.error("vault.deposit tx reverted:");
    console.error(" message:", e?.message || String(e));
    if (e?.code) console.error(" code:", e.code);
    if (e?.errorName) console.error(" errorName:", e.errorName);
    if (e?.errorSignature) console.error(" errorSignature:", e.errorSignature);
    if (e?.errorArgs) console.error(" errorArgs:", e.errorArgs);
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});



