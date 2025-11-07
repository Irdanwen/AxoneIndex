const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const HANDLER = process.env.HANDLER || "0xd6053F085E844d7924D1AeDAf715378a0a010B63";
  const gasPrice = ethers.parseUnits(process.env.GAS_PRICE_GWEI || "3", "gwei");
  const LOOKBACK_BLOCKS = Number(process.env.LOOKBACK_BLOCKS || 300);

  const handler = await ethers.getContractAt("CoreInteractionHandler", HANDLER);
  const l1readAddr = await handler.l1read();
  const l1Abi = [
    "function bbo(uint32 asset) view returns (uint64 bid, uint64 ask)",
  ];
  const l1 = new ethers.Contract(l1readAddr, l1Abi, ethers.provider);

  // Récupérer les IDs spot
  const spotBTC = await handler.spotBTC();
  const spotHYPE = await handler.spotHYPE();
  const epsilonBps = await handler.marketEpsilonBps();

  // BBO natifs (pxDecimals Hyperliquid)
  const bboB = await l1.bbo(Number(spotBTC) + 10000);
  const bboH = await l1.bbo(Number(spotHYPE) + 10000);

  const limitBuyBRaw = (bboB[1] + (bboB[1] * BigInt(epsilonBps)) / 10000n);
  const limitSellHRaw = (bboH[0] > (bboH[0] * BigInt(epsilonBps)) / 10000n)
    ? (bboH[0] - (bboH[0] * BigInt(epsilonBps)) / 10000n) : 1n;

  console.log(JSON.stringify({
    network: hre.network.name,
    spot: { BTC: Number(spotBTC), HYPE: Number(spotHYPE) },
    bbo_raw: { BTC: { bid: bboB[0].toString(), ask: bboB[1].toString() }, HYPE: { bid: bboH[0].toString(), ask: bboH[1].toString() } },
    epsilonBps: Number(epsilonBps),
    expectedLimits_raw: { buyBTC: limitBuyBRaw.toString(), sellHYPE: limitSellHRaw.toString() }
  }, null, 2));

  // Exécuter un rebalance pour émettre un SELL HYPE puis BUY BTC (si deltas > 0)
  const signer = (await ethers.getSigners())[0];
  const tx = await handler.connect(signer).rebalancePortfolio(0, 0, { gasPrice });
  console.log(`rebalance tx: ${tx.hash}`);
  const rcpt = await tx.wait();
  console.log(`mined block: ${rcpt.blockNumber}`);

  // Décoder OutboundToCore de la tx
  const topic = handler.filters.OutboundToCore().fragment.topicHash;
  const logs = rcpt.logs.filter(l => l.address.toLowerCase() === HANDLER.toLowerCase() && l.topics[0] === topic);
  const coder = ethers.AbiCoder.defaultAbiCoder();

  const decoded = [];
  for (const log of logs) {
    const data = handler.interface.decodeEventLog("OutboundToCore", log.data, log.topics).data;
    const bytes = ethers.getBytes(data);
    if (bytes.length < 2) continue;
    const version = bytes[0];
    const action = bytes[1];
    const payload = ethers.hexlify(bytes.slice(2));
    if (action === 2) {
      const [asset, isBuy, limitPxRaw, sz, tif, cloid] = coder.decode(["uint32","bool","uint64","uint64","uint8","uint128"], payload);
      decoded.push({ action, asset: Number(asset), isBuy, limitPxRaw: limitPxRaw.toString(), sz: sz.toString(), tif: Number(tif), cloid: cloid.toString() });
    } else {
      decoded.push({ action, raw: payload });
    }
  }

  console.log(JSON.stringify({
    emittedOrders: decoded
  }, null, 2));
}

main().catch((e) => {
  console.error("❌ test sell/buy error:", e);
  process.exit(1);
});
