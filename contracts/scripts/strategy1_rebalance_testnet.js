const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const HANDLER = process.env.HANDLER || "0xaEAe0B32cE902C40A6053950323e6c0228a08efD";
  const gasPrice = ethers.parseUnits(process.env.GAS_PRICE_GWEI || "3", "gwei");

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  const errorMessage = (err) => err?.error?.message || err?.message || String(err);
  const isRateLimitError = (err) => /rate limited/i.test(errorMessage(err)) || err?.code === 429;
  const sendWithRetry = async (fn, label, attempts = 5, baseWaitMs = 1500) => {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        if (isRateLimitError(err) && i < attempts - 1) {
          const waitMs = baseWaitMs * (i + 1);
          console.warn(`⚠️ Rate limit lors de "${label}" (tentative ${i + 1}/${attempts}), nouvel essai dans ${waitMs}ms`);
          await delay(waitMs);
          continue;
        }
        throw err;
      }
    }
  };

  const handler = await ethers.getContractAt("CoreInteractionHandler", HANDLER);
  const signer = (await ethers.getSigners())[0];
  const who = await signer.getAddress();

  console.log(`Rebalancer: ${who}`);
  console.log(`Handler:    ${HANDLER}`);

  // simple receipt wait (Hardhat/Ethers v6)
  const tx = await sendWithRetry(() => handler.connect(signer).rebalancePortfolio(0, 0, { gasPrice }), "handler.rebalancePortfolio()");
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
