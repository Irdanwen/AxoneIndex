const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AxoneToken - Compilation Test", function () {
  it("Should compile successfully", async function () {
    // Just test that the contract can be compiled and deployed
    const AxoneToken = await ethers.getContractFactory("AxoneToken");
    
    const [owner, recipient, inflationRecipient] = await ethers.getSigners();
    
    const axoneToken = await AxoneToken.deploy(
      recipient.address,
      inflationRecipient.address,
      owner.address
    );
    
    await axoneToken.waitForDeployment();
    
    expect(await axoneToken.name()).to.equal("Axone");
    expect(await axoneToken.symbol()).to.equal("AXN");
  });
});
