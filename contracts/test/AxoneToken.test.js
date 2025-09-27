require("@nomicfoundation/hardhat-chai-matchers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AxoneToken", function () {
  let axoneToken;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const AxoneToken = await ethers.getContractFactory("AxoneToken");
    axoneToken = await AxoneToken.deploy(owner.address, owner.address, owner.address);
  });

  describe("Déploiement", function () {
    it("Devrait avoir le bon nom et symbole", async function () {
      expect(await axoneToken.name()).to.equal("Axone");
      expect(await axoneToken.symbol()).to.equal("AXN");
    });

    it("Devrait avoir le bon supply initial", async function () {
      const expectedSupply = BigInt("100000000") * ethers.parseEther("1");
      expect(await axoneToken.totalSupply()).to.equal(expectedSupply);
    });

    it("Devrait assigner le supply initial au owner", async function () {
      const expectedSupply = BigInt("100000000") * ethers.parseEther("1");
      expect(await axoneToken.balanceOf(owner.address)).to.equal(expectedSupply);
    });
  });

  describe("Transferts", function () {
    it("Devrait permettre les transferts entre comptes", async function () {
      const transferAmount = ethers.parseEther("100");
      
      await axoneToken.transfer(addr1.address, transferAmount);
      expect(await axoneToken.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("Devrait échouer si l'expéditeur n'a pas assez de tokens", async function () {
      const initialBalance = await axoneToken.balanceOf(addr1.address);
      const transferAmount = ethers.parseEther("100");

      await expect(
        axoneToken.connect(addr1).transfer(addr2.address, transferAmount)
      ).to.be.revertedWithCustomError(axoneToken, "ERC20InsufficientBalance");
    });
  });

  describe("Mint", function () {
    it("Devrait permettre au owner de mint de nouveaux tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      const initialBalance = await axoneToken.balanceOf(addr1.address);
      
      await axoneToken.mint(addr1.address, mintAmount);
      
      expect(await axoneToken.balanceOf(addr1.address)).to.equal(
        initialBalance + mintAmount
      );
    });

    it("Devrait empêcher les non-owners de mint", async function () {
      const mintAmount = ethers.parseEther("1000");
      
      await expect(
        axoneToken.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.revertedWithCustomError(axoneToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Burn", function () {
    it("Devrait permettre aux utilisateurs de brûler leurs tokens", async function () {
      const transferAmount = ethers.parseEther("1000");
      const burnAmount = ethers.parseEther("500");
      
      await axoneToken.transfer(addr1.address, transferAmount);
      const balanceBeforeBurn = await axoneToken.balanceOf(addr1.address);
      
      await axoneToken.connect(addr1).burn(burnAmount);
      
      expect(await axoneToken.balanceOf(addr1.address)).to.equal(
        balanceBeforeBurn - burnAmount
      );
    });
  });
});
