import type { NextApiRequest, NextApiResponse } from "next";
import { createPublicClient, http } from "viem";

// Hyperliquid testnet RPC
const RPC_URL = process.env.HL_TESTNET_RPC || "https://rpc.hyperliquid-testnet.xyz/evm";

// Precompile spotInfo address (voir contracts/src/HYPE50 Defensive/interfaces/L1Read.sol)
const SPOT_INFO_PRECOMPILE = "0x000000000000000000000000000000000000080b" as const;

// ABI minimal de spotInfo
const spotInfoAbi = [
  {
    type: "function",
    stateMutability: "view",
    name: "spotInfo",
    inputs: [{ name: "spot", type: "uint32" }],
    outputs: [
      { name: "name", type: "string" },
      { name: "tokens", type: "uint64[2]" }
    ],
  },
] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const maxSpot = Number(req.query.maxSpot ?? 4096);
    const filter = String(req.query.filter ?? "USDC").toUpperCase();
    const client = createPublicClient({ transport: http(RPC_URL) });

    const matches: Array<{ sid: number; name: string; tokens: [string, string] }> = [];

    // Scanner les spots et relever ceux qui contiennent le filtre (par défaut USDC)
    for (let sid = 0; sid < maxSpot; sid++) {
      try {
        const [name, tokens] = await client.readContract({
          address: SPOT_INFO_PRECOMPILE,
          abi: spotInfoAbi,
          functionName: "spotInfo",
          args: [sid],
        });
        if (typeof name === "string" && name.toUpperCase().includes(filter)) {
          const asStrings: [string, string] = [tokens[0].toString(), tokens[1].toString()];
          matches.push({ sid, name, tokens: asStrings });
        }
      } catch {
        // trous/ids invalides: ignorer
      }
    }

    // Chercher prioritairement BTC/USDC
    const btcUsdc = matches.find(m => m.name.toUpperCase().includes("BTC") && m.name.toUpperCase().includes("USDC"));

    res.status(200).json({
      network: "hyperliquid-testnet",
      rpc: RPC_URL,
      coreSystemAddress: "0x2222222222222222222222222222222222222222",
      btcUsdc,
      matches,
      hint: "USDC_CORE_TOKEN_ID = tokens[1] du marché BTC/USDC (quote).",
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
}


