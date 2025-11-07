const hre = require("hardhat");

async function main() {
  const { ethers } = hre;

  const ADDRS = {
    HANDLER: process.env.HANDLER || "0xd6053F085E844d7924D1AeDAf715378a0a010B63",
    VAULT: process.env.VAULT || "0x5Fd781645c8867c067db4caC9a4020D774F40028",
    L1READ: process.env.L1READ || "0x2A71dDbF2daf0f96A3b348c8a7d7b39211B15351",
  };

  const handler = await ethers.getContractAt("CoreInteractionHandler", ADDRS.HANDLER);
  const vault = await ethers.getContractAt("VaultContract", ADDRS.VAULT);

  // Oracles
  let pxB = 0n, pxH = 0n;
  try { pxB = await handler.oraclePxBtc1e8(); } catch (_) {}
  try { pxH = await handler.oraclePxHype1e8(); } catch (_) {}

  // Equity / NAV / PPS
  const equity1e18 = await handler.equitySpotUsd1e18();
  const nav1e18 = await vault.nav1e18();
  const pps1e18 = await vault.pps1e18();

  // IDs & params
  const usdcCoreTokenId = await handler.usdcCoreTokenId();
  const spotTokenBTC = await handler.spotTokenBTC();
  const spotTokenHYPE = await handler.spotTokenHYPE();
  const spotBTC = await handler.spotBTC();
  const spotHYPE = await handler.spotHYPE();

  // Balances spot (1e8 / szDecimals raw)
  const usdcSpot = await handler.spotBalance(ADDRS.HANDLER, usdcCoreTokenId);
  const btcSpot = await handler.spotBalance(ADDRS.HANDLER, spotTokenBTC);
  const hypeSpot = await handler.spotBalance(ADDRS.HANDLER, spotTokenHYPE);

  // Config handler
  const feeVault = await handler.feeVault();
  const feeBps = await handler.feeBps();
  const usdcReserveBps = await handler.usdcReserveBps();
  const rebalancer = await handler.rebalancer();
  const maxOutboundPerEpoch = await handler.maxOutboundPerEpoch();
  const epochLength = await handler.epochLength();
  const lastEpochStart = await handler.lastEpochStart();
  const sentThisEpoch = await handler.sentThisEpoch();
  const marketEpsilonBps = await handler.marketEpsilonBps();
  const maxSlippageBps = await handler.maxSlippageBps();
  const deadbandBps = await handler.deadbandBps();
  const maxOracleDeviationBps = await handler.maxOracleDeviationBps();

  // Config vault
  const depositFeeBps = await vault.depositFeeBps();
  const withdrawFeeBps = await vault.withdrawFeeBps();
  const autoDeployBps = await vault.autoDeployBps();

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
      usdc: usdcSpot.total.toString(),
      btc: btcSpot.total.toString(),
      hype: hypeSpot.total.toString(),
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
