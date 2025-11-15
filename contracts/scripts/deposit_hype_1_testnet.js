const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const VAULT = process.env.VAULT || "0x82A9ec1B0c949c80dC9fDddD530DF83AB5190D46";
  const gasPrice = ethers.parseUnits(process.env.GAS_PRICE_GWEI || "2", "gwei");

  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);
  console.log("Vault:", VAULT);

  const vault = await ethers.getContractAt("VaultContract", VAULT);
  const amount = ethers.parseEther("1"); // 1 HYPE en 1e18

  console.log("Envoi du dépôt de 1 HYPE...");
  const tx = await vault.deposit({ value: amount, gasPrice });
  console.log("Tx hash:", tx.hash);
  const rcpt = await tx.wait();
  console.log("Receipt status:", rcpt.status);
}

main().catch((e) => {
  console.error("Erreur dépôt:", e);
  process.exit(1);
});



