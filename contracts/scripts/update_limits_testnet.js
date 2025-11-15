const hre = require("hardhat");

async function main() {
  const { ethers } = hre;

  const HANDLER = process.env.HANDLER;
  const MAX_OUTBOUND_PER_EPOCH_1E8 = process.env.MAX_OUTBOUND_PER_EPOCH_1E8;
  const EPOCH_LENGTH_BLOCKS = process.env.EPOCH_LENGTH_BLOCKS;

  if (!HANDLER || !MAX_OUTBOUND_PER_EPOCH_1E8 || !EPOCH_LENGTH_BLOCKS) {
    throw new Error("HANDLER, MAX_OUTBOUND_PER_EPOCH_1E8 et EPOCH_LENGTH_BLOCKS doivent être définis");
  }

  const handler = await ethers.getContractAt("CoreInteractionHandler", HANDLER);
  const signer = (await ethers.getSigners())[0];

  const maxOutbound = BigInt(MAX_OUTBOUND_PER_EPOCH_1E8);
  const epochLength = BigInt(EPOCH_LENGTH_BLOCKS);
  const gasPrice = ethers.parseUnits(process.env.GAS_PRICE_GWEI || "3", "gwei");

  console.log("Mise à jour des limites:", {
    handler: HANDLER,
    maxOutboundPerEpoch1e8: maxOutbound.toString(),
    epochLengthBlocks: epochLength.toString(),
  });

  const tx = await handler
    .connect(signer)
    .setLimits(maxOutbound, Number(epochLength), { gasPrice });
  console.log(`tx sent: ${tx.hash}`);
  const rcpt = await tx.wait();
  console.log(`tx confirmé dans le bloc ${rcpt.blockNumber}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});





