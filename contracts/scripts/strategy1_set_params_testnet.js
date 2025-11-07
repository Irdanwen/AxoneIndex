const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const HANDLER = process.env.HANDLER || "0xd6053F085E844d7924D1AeDAf715378a0a010B63";
  const gasPrice = ethers.parseUnits(process.env.GAS_PRICE_GWEI || "3", "gwei");
  const MAX_SLIPPAGE_BPS = Number(process.env.MAX_SLIPPAGE_BPS || 5000);
  const MARKET_EPSILON_BPS = Number(process.env.MARKET_EPSILON_BPS || 1500);
  const DEADBAND_BPS = Number(process.env.DEADBAND_BPS || 50);

  const handler = await ethers.getContractAt("CoreInteractionHandler", HANDLER);
  const signer = (await ethers.getSigners())[0];

  console.log(`Handler: ${HANDLER}`);
  console.log(`Setting params: slippage=${MAX_SLIPPAGE_BPS}, epsilon=${MARKET_EPSILON_BPS}, deadband=${DEADBAND_BPS}`);

  const tx = await handler.connect(signer).setParams(MAX_SLIPPAGE_BPS, MARKET_EPSILON_BPS, DEADBAND_BPS, { gasPrice });
  console.log(`tx sent: ${tx.hash}`);
  const rcpt = await tx.wait();
  console.log(`tx mined in block ${rcpt.blockNumber}`);
}

main().catch((e) => {
  console.error("❌ setParams error:", e);
  process.exit(1);
});
