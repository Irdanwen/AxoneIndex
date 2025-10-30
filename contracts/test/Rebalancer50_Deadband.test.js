require("@nomicfoundation/hardhat-chai-matchers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Rebalancer50Lib: deadband", function () {
  it("Zérote les deltas si |écart| <= deadband", async function () {
    const Test = await ethers.getContractFactory("TestRebalancer50Lib");
    const t = await Test.deploy();

    // Equity = 31 USD → target par asset = 15.5
    const equity = ethers.parseEther("31");
    const target = ethers.parseEther("15.5");
    // Positions: très proches de la cible, écarts 0.01 < threshold 0.155 (0.5% de 31)
    const posB = target - ethers.parseEther("0.01");
    const posH = target + ethers.parseEther("0.01");
    const deadband = 50; // 0.5%

    const [dB, dH] = await t.compute(equity, posB, posH, deadband);
    expect(dB).to.equal(0n);
    expect(dH).to.equal(0n);
  });
});


