const axios = require("axios");
require("dotenv").config({ path: "./env" });

async function main() {
  const handler = (process.env.HANDLER || "0xd6053F085E844d7924D1AeDAf715378a0a010B63").toLowerCase();
  const hlApi = process.env.HL_API_URL || "https://api.hyperliquid-testnet.xyz";

  const post = async (type, payload = {}) => {
    const { data } = await axios.post(`${hlApi}/info`, { type, ...payload }, { timeout: 15000 });
    return data;
  };

  const fills = await post("userFills", { user: handler });
  const spotState = await post("spotClearinghouseState", { user: handler });

  console.log(JSON.stringify({
    handler,
    fills: Array.isArray(fills) ? fills.slice(-10) : fills,
    spotState
  }, null, 2));
}

main().catch((e) => {
  console.error("❌ HL API error:", e.response?.data || e.message);
  process.exit(1);
});




