const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const HANDLER = process.env.HANDLER || "0xd6053F085E844d7924D1AeDAf715378a0a010B63";
  const TX = (process.env.TX || "").trim();
  if (!TX) throw new Error("TX hash requis via TX=<hash>");

  const handler = await ethers.getContractAt("CoreInteractionHandler", HANDLER);
  const rcpt = await ethers.provider.getTransactionReceipt(TX);
  const topic = handler.filters.OutboundToCore().fragment.topicHash;

  const logs = rcpt.logs.filter(l => l.address.toLowerCase() === HANDLER.toLowerCase() && l.topics[0] === topic);
  const coder = ethers.AbiCoder.defaultAbiCoder();

  const dec = [];
  for (const log of logs) {
    const data = handler.interface.decodeEventLog("OutboundToCore", log.data, log.topics).data;
    // data: 0x01 <action> <abi.encode(...)>
    const bytes = ethers.getBytes(data);
    if (bytes.length < 2) { dec.push({ error: "short" }); continue; }
    const version = bytes[0];
    const action = bytes[1];
    const payload = ethers.hexlify(bytes.slice(2));
    let decoded;
    if (action === 2) {
      // Spot Limit Order (IOC): (uint32 assetId, bool isBuy, uint64 limitPxRaw, uint64 szInSzDecimals, uint8 tif, uint128 cloid)
      decoded = coder.decode(["uint32","bool","uint64","uint64","uint8","uint128"], payload);
    } else if (action === 6) {
      // Spot Send: (address destination, uint64 tokenId, uint64 amount1e8)
      decoded = coder.decode(["address","uint64","uint64"], payload);
    } else {
      decoded = "unknown action";
    }
    dec.push({
      blockNumber: rcpt.blockNumber,
      txHash: rcpt.hash,
      version,
      action,
      decoded
    });
  }

  // safe stringify BigInt
  const out = JSON.stringify(dec, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2);
  console.log(out);
}

main().catch((e) => {
  console.error("❌ decode error:", e);
  process.exit(1);
});
