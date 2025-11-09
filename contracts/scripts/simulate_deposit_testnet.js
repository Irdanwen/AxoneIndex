const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const VAULT = process.env.VAULT;
  const HANDLER = process.env.HANDLER;
  if (!VAULT || !HANDLER) {
    throw new Error("Merci de fournir VAULT et HANDLER dans l'environnement");
  }

  const amount1e18 = process.env.DEPOSIT_HYPE_1E18 ? BigInt(process.env.DEPOSIT_HYPE_1E18) : 0n;
  if (amount1e18 === 0n) {
    throw new Error("DEPOSIT_HYPE_1E18 doit être défini pour la simulation");
  }

  const vault = await ethers.getContractAt("VaultContract", VAULT);
  const signer = (await ethers.getSigners())[0];

  console.log("Simulation deposit callStatic:", {
    from: await signer.getAddress(),
    vault: VAULT,
    handler: HANDLER,
    amount1e18: amount1e18.toString(),
  });

  try {
    await vault.connect(signer).deposit.staticCall({ value: amount1e18 });
    console.log("✅ callStatic deposit réussirait sans revert.");
  } catch (err) {
    console.error("❌ callStatic deposit a revert.");
    if (err?.errorName) {
      console.error("errorName:", err.errorName);
      console.error("errorSignature:", err.errorSignature);
      console.error("errorArgs:", err.errorArgs);
    }
    if (err?.reason) {
      console.error("reason:", err.reason);
    }
    if (err?.error?.message) {
      console.error("error.message:", err.error.message);
    }
    if (err?.data) {
      console.error("data:", err.data);
    }
    throw err;
  }
}

main().catch((err) => {
  if (err?.code === "CALL_EXCEPTION") {
    process.exitCode = 1;
    return;
  }
  console.error(err);
  process.exit(1);
});

