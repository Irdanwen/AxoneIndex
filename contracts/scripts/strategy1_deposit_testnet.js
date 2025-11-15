const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  // Adresses par défaut: dernier déploiement STRATEGY_1 (voir docs/deployments/STRATEGY_1_TESTNET.md)
  const VAULT = process.env.VAULT || "0x82A9ec1B0c949c80dC9fDddD530DF83AB5190D46";
  const HANDLER = process.env.HANDLER || "0x5Ac60985E55d2B33cc2a26286a7325202bA487db";
  const amount1e18 = process.env.DEPOSIT_HYPE_1E18 ? BigInt(process.env.DEPOSIT_HYPE_1E18) : (10n ** 17n);
  const gasPrice = ethers.parseUnits(process.env.GAS_PRICE_GWEI || "3", "gwei");

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  const errorMessage = (err) => err?.error?.message || err?.message || String(err);
  const isRateLimitError = (err) => /rate limited/i.test(errorMessage(err)) || err?.code === 429;
  const waitForReceipt = async (hash, retries = 90, intervalMs = 1500) => {
    for (let i = 0; i < retries; i++) {
      try {
        const rcpt = await ethers.provider.getTransactionReceipt(hash);
        if (rcpt) return rcpt;
      } catch (e) {
        if (!isRateLimitError(e)) {
          throw e;
        }
      }
      await delay(intervalMs * (i + 1));
    }
    throw new Error(`Timeout en attente du receipt: ${hash}`);
  };
  const sendWithRetry = async (fn, label, attempts = 5, baseWaitMs = 1500) => {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        if (isRateLimitError(err) && i < attempts - 1) {
          const waitMs = baseWaitMs * (i + 1);
          console.warn(`⚠️ Rate limit lors de \"${label}\" (tentative ${i + 1}/${attempts}), nouvel essai dans ${waitMs}ms`);
          await delay(waitMs);
          continue;
        }
        throw err;
      }
    }
  };

  const vault = await ethers.getContractAt("VaultContract", VAULT);
  const handler = await ethers.getContractAt("CoreInteractionHandler", HANDLER);
  const signer = (await ethers.getSigners())[0];
  const who = await signer.getAddress();

  console.log(`Deployer: ${who}`);
  console.log(`Vault:    ${VAULT}`);
  console.log(`Handler:  ${HANDLER}`);
  console.log(`Amount:   ${amount1e18.toString()} wei`);

  // NAV avant
  let navBefore = 0n;
  try { navBefore = await vault.nav1e18(); } catch (_) {}

  const tx = await sendWithRetry(() => vault.connect(signer).deposit({ value: amount1e18, gasPrice }), "vault.deposit()");
  console.log(`tx sent: ${tx.hash}`);
  const rcpt = await waitForReceipt(tx.hash);
  console.log(`tx mined in block ${rcpt.blockNumber}`);

  // Lire dernier event Deposit
  const latest = await ethers.provider.getBlockNumber();
  const MAX_RANGE = 1000;
  const fromBlock = latest > MAX_RANGE ? latest - MAX_RANGE : 0;
  try {
    const logs = await vault.queryFilter(vault.filters.Deposit(), fromBlock, latest);
    const last = logs.slice(-1)[0];
    if (last) {
      console.log("Last Deposit:", {
        blockNumber: last.blockNumber,
        txHash: last.transactionHash,
        user: last.args?.user,
        amount1e18: last.args?.amount1e18?.toString?.() || last.args?.[1]?.toString?.(),
        sharesMinted: last.args?.sharesMinted?.toString?.() || last.args?.[2]?.toString?.(),
      });
    }
  } catch (err) {
    console.warn("⚠️ Impossible de récupérer les événements Deposit (probable rate limit):", errorMessage(err));
  }

  // NAV après
  let navAfter = 0n;
  try { navAfter = await vault.nav1e18(); } catch (_) {}

  // Equity côté Core (peut rester 0 si dépôt minimal ou oracles déviés)
  let equity = 0n;
  try { equity = await handler.equitySpotUsd1e18(); } catch (_) {}

  console.log(JSON.stringify({
    network: hre.network.name,
    deposit: { ok: true, txHash: tx.hash },
    navBefore: navBefore.toString(),
    navAfter: navAfter.toString(),
    coreEquity1e18: equity.toString(),
  }, null, 2));
}

main().catch((e) => {
  console.error("❌ deposit error:", e);
  process.exit(1);
});
