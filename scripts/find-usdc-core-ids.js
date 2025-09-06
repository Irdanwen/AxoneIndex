/*
  Script: find-usdc-core-ids.js
  But: Interroger HyperEVM testnet pour récupérer l'ID uint64 du token USDC (HyperCore) via les precompiles.
*/

const { ethers } = require("ethers");

async function main() {
  const rpcUrl = process.env.HL_TESTNET_RPC || "https://rpc.hyperliquid-testnet.xyz/evm";
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  // Precompile addresses d'après L1Read.sol
  const TOKEN_INFO_PRECOMPILE_ADDRESS = "0x000000000000000000000000000000000000080C";
  const SPOT_INFO_PRECOMPILE_ADDRESS = "0x000000000000000000000000000000000000080b";

  // ABI minimal pour tokenInfo(uint32) -> TokenInfo
  // struct TokenInfo { string name; uint64[] spots; uint64 deployerTradingFeeShare; address deployer; address evmContract; uint8 szDecimals; uint8 weiDecimals; int8 evmExtraWeiDecimals; }
  const tokenInfoAbi = [
    "function tokenInfo(uint32 token) view returns (string name, uint64[] spots, uint64 deployerTradingFeeShare, address deployer, address evmContract, uint8 szDecimals, uint8 weiDecimals, int8 evmExtraWeiDecimals)"
  ];

  const tokenInfo = new ethers.Contract(TOKEN_INFO_PRECOMPILE_ADDRESS, tokenInfoAbi, provider);
  const spotInfoAbi = [
    "function spotInfo(uint32 spot) view returns (string name, uint64[2] tokens)"
  ];
  const spotInfo = new ethers.Contract(SPOT_INFO_PRECOMPILE_ADDRESS, spotInfoAbi, provider);

  // Support d'un SPOT_ID direct
  const directSpotId = process.env.SPOT_ID ? Number(process.env.SPOT_ID) : null;
  if (directSpotId !== null && !Number.isNaN(directSpotId)) {
    try {
      const res = await spotInfo.spotInfo(directSpotId);
      const name = res.name || res[0];
      const tokens = res.tokens || res[1];
      const usdcTokenId = Array.isArray(tokens) && tokens.length === 2 ? Number(tokens[1]) : null;
      console.log(JSON.stringify({
        network: "hyperliquid-testnet",
        spotId: directSpotId,
        name,
        tokens: Array.isArray(tokens) ? [Number(tokens[0]), Number(tokens[1])] : tokens,
        usdcCoreSystemAddress: "0x2222222222222222222222222222222222222222",
        usdcCoreTokenId: usdcTokenId,
        hint: "Utilisez usdcCoreTokenId comme uint64 pour setUsdcCoreLink"
      }, null, 2));
      return;
    } catch (e) {
      // continue avec scan si échec
    }
  }

  // Balayage d'une plage raisonnable d'IDs de token pour trouver "USDC"
  // D'abord, essayer de trouver le marché spot BTC/USDC en scannant des spot IDs
  const maxSpotId = Number(process.env.MAX_SPOT_ID || 2048);
  let usdcTokenId = null;
  let btcUsdcSpotId = null;
  const matches = [];
  for (let sid = 0; sid < maxSpotId; sid++) {
    try {
      const res = await spotInfo.spotInfo(sid);
      const name = res.name || res[0];
      const tokens = res.tokens || res[1];
      if (typeof name === "string") {
        const upper = name.toUpperCase();
        if (upper.includes("USDC")) {
          matches.push({ sid, name, tokens: Array.isArray(tokens) ? tokens.map(Number) : [] });
        }
        if ((upper.includes("BTC") && upper.includes("USDC")) || upper.includes("BTC/USDC") || upper.includes("BTC-USDC")) {
          btcUsdcSpotId = sid;
          if (Array.isArray(tokens) && tokens.length === 2) {
            usdcTokenId = Number(tokens[1]); // quote token
          }
          break;
        }
      }
    } catch (_) {
      // ignore ids invalides
    }
  }

  // Si non trouvé, fallback: scanner les tokens pour "USDC"
  if (usdcTokenId === null) {
    const maxTokenIdToScan = Number(process.env.MAX_TOKEN_ID || 2048);
    for (let i = 0; i < maxTokenIdToScan; i++) {
      try {
        const res = await tokenInfo.tokenInfo(i);
        const name = res.name || res[0];
        if (typeof name === "string" && name.toUpperCase() === "USDC") {
          usdcTokenId = i;
          break;
        }
      } catch (_) {
        // ignore
      }
    }
  }

  if (usdcTokenId === null) {
    // Si on a des matches USDC, afficher pour aider au debug
    if (matches.length > 0) {
      console.log(JSON.stringify({
        network: "hyperliquid-testnet",
        hint: "Matches USDC trouvés dans spotInfo",
        matches
      }, null, 2));
      process.exit(0);
    } else {
      console.error("Impossible de trouver USDC via spotInfo ou tokenInfo. Augmentez MAX_SPOT_ID / MAX_TOKEN_ID.");
      process.exit(1);
    }
  }

  // Adresse système Core<->EVM (doc HyperCore: 0x222...2222)
  const coreSystemAddr = "0x2222222222222222222222222222222222222222";

  console.log(JSON.stringify({
    network: "hyperliquid-testnet",
    usdcCoreSystemAddress: coreSystemAddr,
    usdcCoreTokenId: usdcTokenId,
    btcUsdcSpotId,
    note: "Passer usdcCoreTokenId en uint64 à setUsdcCoreLink",
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


