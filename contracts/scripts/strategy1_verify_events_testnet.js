const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const HANDLER = process.env.HANDLER || "0xd6053F085E844d7924D1AeDAf715378a0a010B63";
  const lookback = Number(process.env.LOOKBACK_BLOCKS || 20000);

  const handler = await ethers.getContractAt("CoreInteractionHandler", HANDLER);
  const latest = await ethers.provider.getBlockNumber();
  const fromBlock = latest > lookback ? latest - lookback : 0;

  const events = {};
  async function q(label, filter) {
    try {
      const logs = await handler.queryFilter(filter, fromBlock, latest);
      events[label] = logs.map((e) => ({
        blockNumber: e.blockNumber,
        txHash: e.transactionHash,
        args: e.args,
      }));
    } catch (e) {
      events[label] = { error: e.message };
    }
  }

  await q("SpotOrderPlaced", handler.filters.SpotOrderPlaced());
  await q("Rebalanced", handler.filters.Rebalanced());
  await q("OutboundToCore", handler.filters.OutboundToCore());
  await q("SweepWithFee", handler.filters.SweepWithFee());
  await q("DepositSkippedOracleDeviationUsdc", handler.filters.DepositSkippedOracleDeviationUsdc());
  await q("DepositSkippedOracleDeviationHype", handler.filters.DepositSkippedOracleDeviationHype());
  await q("RebalanceSkippedOracleDeviation", handler.filters.RebalanceSkippedOracleDeviation());

  const stringify = (obj) => JSON.stringify(obj, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2);
  console.log(stringify({
    network: hre.network.name,
    handler: HANDLER,
    fromBlock,
    toBlock: latest,
    counts: Object.fromEntries(Object.entries(events).map(([k, v]) => [k, Array.isArray(v) ? v.length : 0])),
    samples: Object.fromEntries(Object.entries(events).map(([k, v]) => [k, Array.isArray(v) ? v.slice(-3) : v])),
  }));
}

main().catch((e) => {
  console.error("❌ events error:", e);
  process.exit(1);
});
