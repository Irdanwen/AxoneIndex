const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const HANDLER = process.env.HANDLER || "0xa89e805806d0174b587a7001944aaBEECb53f284";
  const gasPrice = ethers.parseUnits(process.env.GAS_PRICE_GWEI || "3", "gwei");

  const handler = await ethers.getContractAt("CoreInteractionHandler", HANDLER);
  const signer = (await ethers.getSigners())[0];
  const who = await signer.getAddress();

  console.log(`Rebalancer: ${who}`);
  console.log(`Handler:    ${HANDLER}`);

  // simple receipt wait (Hardhat/Ethers v6)
  const tx = await handler.connect(signer).rebalancePortfolio(0, 0, { gasPrice });
  console.log(`tx sent: ${tx.hash}`);
  const rcpt = await tx.wait();
  console.log(`tx mined in block ${rcpt.blockNumber}`);

  // Lire derniers événements Rebalanced
  try {
    const latest = await ethers.provider.getBlockNumber();
    const RANGE = 900; // HyperEVM RPC limite ~1000 blocs
    const fromBlock = latest > RANGE ? latest - RANGE : 0;
    const logs = await handler.queryFilter(handler.filters.Rebalanced(), fromBlock, latest);
    const last = logs.slice(-1)[0];
    if (last) {
      console.log("Last Rebalanced:", {
        blockNumber: last.blockNumber,
        txHash: last.transactionHash,
        dBtc1e18: last.args?.dBtc1e18?.toString?.() || last.args?.[0]?.toString?.(),
        dHype1e18: last.args?.dHype1e18?.toString?.() || last.args?.[1]?.toString?.(),
      });
    } else {
      console.log("No Rebalanced event found in recent blocks.");
    }
  } catch (err) {
    console.warn("⚠️ Impossible de récupérer les événements Rebalanced:", err?.message || err);
  }
}

main().catch((e) => {
  console.error("❌ rebalance error:", e);
  process.exit(1);
});
