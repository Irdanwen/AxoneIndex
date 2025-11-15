const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const HANDLER = process.env.HANDLER || "0x5Ac60985E55d2B33cc2a26286a7325202bA487db";
  
  const handler = await ethers.getContractAt("CoreInteractionHandler", HANDLER);
  const paused = await handler.paused();
  console.log("Handler paused:", paused);
  
  const vault = await handler.vault();
  console.log("Vault address:", vault);
  
  const hypeCoreSystemAddress = await handler.hypeCoreSystemAddress();
  console.log("Hype Core System Address:", hypeCoreSystemAddress);
  
  const usdcCoreSystemAddress = await handler.usdcCoreSystemAddress();
  console.log("USDC Core System Address:", usdcCoreSystemAddress);
}

main().catch(console.error);

