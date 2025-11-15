const hre = require("hardhat");

async function main() {
  const { ethers } = hre;

  const ADDRS = {
    HANDLER: process.env.HANDLER || "0x5Ac60985E55d2B33cc2a26286a7325202bA487db",
    VAULT: process.env.VAULT || "0x82A9ec1B0c949c80dC9fDddD530DF83AB5190D46",
    L1READ: process.env.L1READ || "0x71752E1caFa851f3Cdb34C1B8Dd5D4745d55403A",
  };

  const handler = await ethers.getContractAt("CoreInteractionHandler", ADDRS.HANDLER);
  const vault = await ethers.getContractAt("VaultContract", ADDRS.VAULT);

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  const callWithRetry = async (fn, tries = 10, ms = 800) => {
    let last;
    for (let i = 0; i < tries; i++) {
      try { return await fn(); } catch (e) { last = e; await delay(ms); }
    }
    throw last;
  };

  // Oracles
  let pxB = 0n, pxH = 0n;
  try { pxB = await callWithRetry(() => handler.oraclePxBtc1e8()); } catch (_) {}
  try { pxH = await callWithRetry(() => handler.oraclePxHype1e8()); } catch (_) {}

  // Equity / NAV / PPS
  const equity1e18 = await callWithRetry(() => handler.equitySpotUsd1e18());
  const nav1e18 = await callWithRetry(() => vault.nav1e18());
  const pps1e18 = await callWithRetry(() => vault.pps1e18());

  // IDs & params
  const usdcCoreTokenId = await callWithRetry(() => handler.usdcCoreTokenId());
  const spotTokenBTC = await callWithRetry(() => handler.spotTokenBTC());
  const spotTokenHYPE = await callWithRetry(() => handler.spotTokenHYPE());
  const spotBTC = await callWithRetry(() => handler.spotBTC());
  const spotHYPE = await callWithRetry(() => handler.spotHYPE());

  // Balances spot (1e8 / szDecimals raw)
  const usdcSpot = await callWithRetry(() => handler.spotBalance(ADDRS.HANDLER, usdcCoreTokenId));
  const btcSpot = await callWithRetry(() => handler.spotBalance(ADDRS.HANDLER, spotTokenBTC));
  const hypeSpot = await callWithRetry(() => handler.spotBalance(ADDRS.HANDLER, spotTokenHYPE));

  // Config handler
  const feeVault = await callWithRetry(() => handler.feeVault());
  const feeBps = await callWithRetry(() => handler.feeBps());
  const usdcReserveBps = await callWithRetry(() => handler.usdcReserveBps());
  const rebalancer = await callWithRetry(() => handler.rebalancer());
  const maxOutboundPerEpoch = await callWithRetry(() => handler.maxOutboundPerEpoch());
  const epochLength = await callWithRetry(() => handler.epochLength());
  const lastEpochStart = await callWithRetry(() => handler.lastEpochStart());
  const sentThisEpoch = await callWithRetry(() => handler.sentThisEpoch());
  const marketEpsilonBps = await callWithRetry(() => handler.marketEpsilonBps());
  const maxSlippageBps = await callWithRetry(() => handler.maxSlippageBps());
  const deadbandBps = await callWithRetry(() => handler.deadbandBps());
  const maxOracleDeviationBps = await callWithRetry(() => handler.maxOracleDeviationBps());

  // Config vault
  const depositFeeBps = await callWithRetry(() => vault.depositFeeBps());
  const withdrawFeeBps = await callWithRetry(() => vault.withdrawFeeBps());
  const autoDeployBps = await callWithRetry(() => vault.autoDeployBps());

  const out = {
    network: hre.network.name,
    addresses: ADDRS,
    oracles_1e8: { btc: pxB.toString(), hype: pxH.toString() },
    equity_nav_pps_1e18: {
      equity: equity1e18.toString(), nav: nav1e18.toString(), pps: pps1e18.toString(),
    },
    ids: {
      usdcCoreTokenId: Number(usdcCoreTokenId),
      spotTokenBTC: Number(spotTokenBTC),
      spotTokenHYPE: Number(spotTokenHYPE),
      spotBTC: Number(spotBTC),
      spotHYPE: Number(spotHYPE),
    },
    spotBalances_raw: {
      usdc: usdcSpot.toString(),
      btc: btcSpot.toString(),
      hype: hypeSpot.toString(),
    },
    handlerConfig: {
      feeVault,
      feeBps: Number(feeBps),
      usdcReserveBps: Number(usdcReserveBps),
      rebalancer,
      rateLimit: {
        maxOutboundPerEpoch: maxOutboundPerEpoch.toString(),
        epochLength: Number(epochLength),
        lastEpochStart: Number(lastEpochStart),
        sentThisEpoch: Number(sentThisEpoch),
      },
      pricing: {
        maxSlippageBps: Number(maxSlippageBps),
        marketEpsilonBps: Number(marketEpsilonBps),
        deadbandBps: Number(deadbandBps),
        maxOracleDeviationBps: Number(maxOracleDeviationBps),
      },
    },
    vaultConfig: {
      depositFeeBps: Number(depositFeeBps),
      withdrawFeeBps: Number(withdrawFeeBps),
      autoDeployBps: Number(autoDeployBps),
    },
  };

  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error("❌ status error:", e);
  process.exit(1);
});
