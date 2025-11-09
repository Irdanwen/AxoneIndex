const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const HANDLER = process.env.HANDLER;
  if (!HANDLER) {
    throw new Error("HANDLER doit être défini");
  }

  const handler = await ethers.getContractAt("CoreInteractionHandler", HANDLER);
  const l1readAddr = await handler.l1read();
  const l1 = await ethers.getContractAt("L1Read", l1readAddr);

  const spotBTC = await handler.spotBTC();
  const spotHYPE = await handler.spotHYPE();
  const tokenBtc = await handler.spotTokenBTC();
  const tokenHype = await handler.spotTokenHYPE();

  const rawPxBtc = await l1.spotPx(spotBTC);
  const rawPxHype = await l1.spotPx(spotHYPE);
  let bboBtcNormalized = null;
  let bboHypeNormalized = null;
  try {
    const assetB = Number(spotBTC) + 10000;
    const assetH = Number(spotHYPE) + 10000;
    const bboB = await l1.bbo(assetB);
    const bboH = await l1.bbo(assetH);
    bboBtcNormalized = {
      bid: bboB.bid.toString(),
      ask: bboB.ask.toString()
    };
    bboHypeNormalized = {
      bid: bboH.bid.toString(),
      ask: bboH.ask.toString()
    };
  } catch (err) {
    bboBtcNormalized = String(err?.message || err);
    bboHypeNormalized = bboBtcNormalized;
  }

  const infoBtc = await l1.tokenInfo(tokenBtc);
  const infoHype = await l1.tokenInfo(tokenHype);

  const oracleB = await handler.oraclePxBtc1e8();
  const oracleH = await handler.oraclePxHype1e8();

  const toJSON = (value) => JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2);

  console.log(toJSON({
    handler: HANDLER,
    l1read: l1readAddr,
    spotBTC: Number(spotBTC),
    spotHYPE: Number(spotHYPE),
    rawPx: {
      btc: rawPxBtc.toString(),
      hype: rawPxHype.toString()
    },
    tokenInfo: {
      btc: {
        szDecimals: infoBtc.szDecimals,
        weiDecimals: infoBtc.weiDecimals,
        evmExtraWeiDecimals: infoBtc.evmExtraWeiDecimals
      },
      hype: {
        szDecimals: infoHype.szDecimals,
        weiDecimals: infoHype.weiDecimals,
        evmExtraWeiDecimals: infoHype.evmExtraWeiDecimals
      }
    },
    oraclePx1e8: {
      btc: oracleB.toString(),
      hype: oracleH.toString()
    },
    bboRaw: {
      btc: bboBtcNormalized,
      hype: bboHypeNormalized
    }
  }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
