const hre = require("hardhat");

async function main() {
  const { ethers } = hre;

  const HANDLER =
    process.env.HANDLER ||
    "0x5Ac60985E55d2B33cc2a26286a7325202bA487db";

  const [signer] = await ethers.getSigners();
  console.log("Signer:", await signer.getAddress());
  console.log("Handler:", HANDLER);

  const handler = await ethers.getContractAt(
    "CoreInteractionHandler",
    HANDLER,
    signer
  );

  // Lire la config de base
  const [
    spotBTC,
    spotHYPE,
    spotTokenBTC,
    spotTokenHYPE,
    usdcCoreTokenId,
    hypeCoreTokenId,
    usdcCoreSystemAddress,
    hypeCoreSystemAddress,
  ] = await Promise.all([
    handler.spotBTC(),
    handler.spotHYPE(),
    handler.spotTokenBTC(),
    handler.spotTokenHYPE(),
    handler.usdcCoreTokenId(),
    handler.hypeCoreTokenId(),
    handler.usdcCoreSystemAddress(),
    handler.hypeCoreSystemAddress(),
  ]);

  console.log("Handler core config:", {
    spotBTC: Number(spotBTC),
    spotHYPE: Number(spotHYPE),
    spotTokenBTC: Number(spotTokenBTC),
    spotTokenHYPE: Number(spotTokenHYPE),
    usdcCoreTokenId: Number(usdcCoreTokenId),
    hypeCoreTokenId: Number(hypeCoreTokenId),
    usdcCoreSystemAddress,
    hypeCoreSystemAddress,
  });

  // Lire l'adresse L1Read depuis le handler
  const l1readAddr = await handler.l1read();
  console.log("L1Read address from handler:", l1readAddr);

  const l1read = await ethers.getContractAt("L1Read", l1readAddr, signer);

  // Helper pour try/catch lisible
  const wrap = async (label, fn) => {
    try {
      const res = await fn();
      console.log(label, "OK:", res);
    } catch (err) {
      const e = err?.error ?? err;
      console.log(label, "REVERT:", e?.message || String(e));
    }
  };

  // 1) Prix spot bruts / normalisés
  await wrap("spotPx(spotBTC)", () => l1read.spotPx(Number(spotBTC)));
  await wrap("spotPx(spotHYPE)", () => l1read.spotPx(Number(spotHYPE)));

  // 2) Infos spot (pairs)
  await wrap("spotInfo(spotBTC)", () => l1read.spotInfo(Number(spotBTC)));
  await wrap("spotInfo(spotHYPE)", () => l1read.spotInfo(Number(spotHYPE)));

  // 3) Infos token (USDC / BTC / HYPE)
  await wrap("tokenInfo(usdcCoreTokenId)", () =>
    l1read.tokenInfo(Number(usdcCoreTokenId))
  );
  await wrap("tokenInfo(spotTokenBTC)", () =>
    l1read.tokenInfo(Number(spotTokenBTC))
  );
  await wrap("tokenInfo(spotTokenHYPE)", () =>
    l1read.tokenInfo(Number(spotTokenHYPE))
  );

  // 4) coreUserExists(handler)
  await wrap("coreUserExists(handler)", () =>
    l1read.coreUserExists(HANDLER)
  );
}

main().catch((err) => {
  console.error("Erreur debug_l1read_handler_state_testnet:", err);
  process.exit(1);
});



