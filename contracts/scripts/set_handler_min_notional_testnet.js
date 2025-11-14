const hre = require("hardhat");

async function main() {
  const { ethers } = hre;

  // Handler STRATEGY_1 - dernier déploiement (override possible via HANDLER)
  const HANDLER =
    process.env.HANDLER ||
    "0xDD5f060D9d728FC254f1cD71584311c005acEd62";

  const targetMinUsd1e8 =
    process.env.MIN_NOTIONAL_USD_1E8 != null
      ? BigInt(process.env.MIN_NOTIONAL_USD_1E8)
      : 10n * 10n ** 8n; // 10 USD par défaut

  const [signer] = await ethers.getSigners();
  const who = await signer.getAddress();

  console.log("Signer (doit être owner du handler):", who);
  console.log("Handler:", HANDLER);
  console.log("Nouveau minNotionalUsd1e8:", targetMinUsd1e8.toString());

  const handler = await ethers.getContractAt(
    "CoreInteractionHandler",
    HANDLER,
    signer
  );

  const owner = await handler.owner();
  if (owner.toLowerCase() !== who.toLowerCase()) {
    throw new Error(
      `Signer ${who} n'est pas owner du handler (owner on-chain: ${owner})`
    );
  }

  const currentMin = await handler.minNotionalUsd1e8();
  console.log("minNotionalUsd1e8 actuel:", currentMin.toString());

  if (currentMin === targetMinUsd1e8) {
    console.log("minNotionalUsd1e8 est déjà à la valeur souhaitée, rien à faire.");
    return;
  }

  console.log(
    `Appel setMinNotionalUsd1e8(${targetMinUsd1e8.toString()}) …`
  );
  const tx = await handler.setMinNotionalUsd1e8(targetMinUsd1e8);
  console.log("tx sent:", tx.hash);
  const rcpt = await tx.wait();
  console.log("tx mined, status:", rcpt.status);

  const newMin = await handler.minNotionalUsd1e8();
  console.log("minNotionalUsd1e8 après:", newMin.toString());
}

main().catch((err) => {
  console.error("Erreur set_handler_min_notional_testnet:", err);
  process.exit(1);
});


