const hre = require("hardhat");

async function main() {
  const { ethers } = hre;

  // Vault STRATEGY_1 - dernier déploiement (override possible via VAULT)
  const VAULT =
    process.env.VAULT ||
    "0x82A9ec1B0c949c80dC9fDddD530DF83AB5190D46";

  const targetAutoDeploy =
    process.env.AUTO_DEPLOY_BPS != null
      ? Number(process.env.AUTO_DEPLOY_BPS)
      : 9500; // défaut: 95%

  if (targetAutoDeploy < 0 || targetAutoDeploy > 10000) {
    throw new Error(
      `AUTO_DEPLOY_BPS invalide: ${targetAutoDeploy} (doit être entre 0 et 10000)`
    );
  }

  const [signer] = await ethers.getSigners();
  const who = await signer.getAddress();

  console.log("Signer (doit être owner du vault):", who);
  console.log("Vault:", VAULT);
  console.log("Nouveau autoDeployBps:", targetAutoDeploy);

  const vault = await ethers.getContractAt("VaultContract", VAULT, signer);

  const owner = await vault.owner();
  if (owner.toLowerCase() !== who.toLowerCase()) {
    throw new Error(
      `Signer ${who} n'est pas owner du vault (owner on-chain: ${owner})`
    );
  }

  const currentDeposit = await vault.depositFeeBps();
  const currentWithdraw = await vault.withdrawFeeBps();
  const currentAuto = await vault.autoDeployBps();

  console.log("Frais actuels:", {
    depositFeeBps: Number(currentDeposit),
    withdrawFeeBps: Number(currentWithdraw),
    autoDeployBps: Number(currentAuto),
  });

  if (Number(currentAuto) === targetAutoDeploy) {
    console.log("autoDeployBps est déjà à la valeur souhaitée, rien à faire.");
    return;
  }

  console.log(
    `Appel setFees(${Number(
      currentDeposit
    )}, ${Number(currentWithdraw)}, ${targetAutoDeploy}) …`
  );
  const tx = await vault.setFees(
    currentDeposit,
    currentWithdraw,
    targetAutoDeploy
  );
  console.log("tx sent:", tx.hash);
  const rcpt = await tx.wait();
  console.log("tx mined, status:", rcpt.status);

  const newAuto = await vault.autoDeployBps();
  console.log("autoDeployBps après:", Number(newAuto));
}

main().catch((err) => {
  console.error("Erreur set_vault_autodeploy_testnet:", err);
  process.exit(1);
});


