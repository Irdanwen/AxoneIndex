const axios = require("axios");

async function main() {
  const url = process.env.HL_API_URL || "https://api.hyperliquid-testnet.xyz";
  const { data } = await axios.post(`${url}/info`, { type: "spotMeta" }, { timeout: 15000 });
  const matches = (data?.universe || []).filter(
    (entry) => entry.tokens?.includes(Number(process.env.SEARCH_TOKEN || -1))
  );
  if (matches.length > 0) {
    console.log(JSON.stringify(matches, null, 2));
  } else {
    console.log("Total markets:", data?.universe?.length || 0);
  }
}

main().catch((err) => {
  console.error(err.response?.data || err.message);
  process.exit(1);
});

