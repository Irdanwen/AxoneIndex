const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const L1READ = process.env.L1READ || "0x71752E1caFa851f3Cdb34C1B8Dd5D4745d55403A";
  const SPOT_IDS = (process.env.SPOT_IDS || "1054,1035").split(",").map((s) => parseInt(s.trim(), 10));

  const l1 = await ethers.getContractAt("L1Read", L1READ);
  for (const id of SPOT_IDS) {
    try {
      const px = await l1.spotPx(id);
      console.log(`spotPx(${id}) =`, px.toString());
    } catch (e) {
      console.log(`spotPx(${id}) FAILED:`, e.message);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});



