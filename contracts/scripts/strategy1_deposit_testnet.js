const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const VAULT = process.env.VAULT || "0x5Fd781645c8867c067db4caC9a4020D774F40028";
  const HANDLER = process.env.HANDLER || "0xd6053F085E844d7924D1AeDAf715378a0a010B63";
  const amount1e18 = process.env.DEPOSIT_HYPE_1E18 ? BigInt(process.env.DEPOSIT_HYPE_1E18) : (10n ** 17n);
  const gasPrice = ethers.parseUnits(process.env.GAS_PRICE_GWEI || "3", "gwei");

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  const waitForReceipt = async (hash, retries = 90, intervalMs = 1500) => {
    for (let i = 0; i < retries; i++) {
      try {
        const rcpt = await ethers.provider.getTransactionReceipt(hash);
        if (rcpt) return rcpt;
      } catch (_) {}
      await delay(intervalMs);
    }
    throw new Error(`Timeout en attente du receipt: ${hash}`);
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

  const tx = await vault.connect(signer).deposit({ value: amount1e18, gasPrice });
  console.log(`tx sent: ${tx.hash}`);
  const rcpt = await waitForReceipt(tx.hash);
  console.log(`tx mined in block ${rcpt.blockNumber}`);

  // Lire dernier event Deposit
  const latest = await ethers.provider.getBlockNumber();
  const MAX_RANGE = 1000;
  const fromBlock = latest > MAX_RANGE ? latest - MAX_RANGE : 0;
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
