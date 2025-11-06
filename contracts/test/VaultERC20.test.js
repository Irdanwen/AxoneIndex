require("@nomicfoundation/hardhat-chai-matchers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VaultContract ERC20", function () {
  let owner, user1, user2, user3;
  let usdc;
  let vault;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    const Vault = await ethers.getContractFactory("VaultContract");
    vault = await Vault.deploy();

    // Create and set a mock handler for the vault
    const MockHandler = await ethers.getContractFactory("MockHandler");
    const mockHandler = await MockHandler.deploy(owner.address);
    await vault.connect(owner).setHandler(mockHandler.target);

    // Montants en 1e8
    await usdc.mint(user1.address, 1000n * 10n**8n);
    await usdc.mint(user2.address, 1000n * 10n**8n);

    // Deposit HYPE (native ETH) - 1 HYPE = 1e18 wei
    await vault.connect(user1).deposit({ value: ethers.parseEther("1.0") }); // 1 HYPE deposit
  });

  it("Transfert réussi entre deux comptes", async function () {
    const sharesUser1Before = await vault.balanceOf(user1.address);
    expect(sharesUser1Before).to.be.gt(0n);

    const half = sharesUser1Before / 2n;
    await expect(vault.connect(user1).transfer(user2.address, half))
      .to.emit(vault, 'Transfer')
      .withArgs(user1.address, user2.address, half);

    expect(await vault.balanceOf(user1.address)).to.equal(sharesUser1Before - half);
    expect(await vault.balanceOf(user2.address)).to.equal(half);
  });

  it("Échec transfert si solde insuffisant", async function () {
    await expect(vault.connect(user3).transfer(user2.address, 1)).to.be.revertedWith("insufficient balance");
  });

  it("approve + transferFrom fonctionne et gère allowance", async function () {
    const shares = await vault.balanceOf(user1.address);
    const spend = shares / 3n;

    await expect(vault.connect(user1).approve(user2.address, spend))
      .to.emit(vault, 'Approval')
      .withArgs(user1.address, user2.address, spend);

    await expect(vault.connect(user2).transferFrom(user1.address, user3.address, spend))
      .to.emit(vault, 'Transfer')
      .withArgs(user1.address, user3.address, spend);

    expect(await vault.allowance(user1.address, user2.address)).to.equal(0n);
    expect(await vault.balanceOf(user3.address)).to.equal(spend);
  });

  it("transferFrom échoue si allowance insuffisante", async function () {
    const shares = await vault.balanceOf(user1.address);
    const spend = shares / 4n;
    await vault.connect(user1).approve(user2.address, spend - 1n);
    await expect(
      vault.connect(user2).transferFrom(user1.address, user3.address, spend)
    ).to.be.revertedWith("allowance too low");
  });

  it("Transfert bloqué quand pausé", async function () {
    await vault.connect(owner).pause();
    await expect(vault.connect(user1).transfer(user2.address, 1)).to.be.revertedWith("paused");
  });

  it("Transfert de 0 doit échouer", async function () {
    await expect(vault.connect(user1).transfer(user2.address, 0)).to.be.revertedWith("zero value");
  });

  it("Transfert vers l'adresse zéro doit échouer", async function () {
    await expect(vault.connect(user1).transfer(ethers.ZeroAddress, 100)).to.be.revertedWith("zero address");
  });

  it("Dépôt → Transfert → Retrait sans frais supplémentaires", async function () {
    await vault.connect(owner).setFees(0, 0, 0);
    const shares = await vault.balanceOf(user1.address);
    await vault.connect(user1).transfer(user2.address, shares);

    const pps = await vault.pps1e18();
    const targetUsd1e18 = (shares * pps) / 10n**18n;
    // Convert USD to HYPE using oracle price (50e8 = $50)
    const handlerAddress = await vault.handler();
    const MockHandler = await ethers.getContractFactory("MockHandler");
    const handler = MockHandler.attach(handlerAddress);
    const pxH = await handler.oraclePxHype1e8();
    const expectedNetHype1e18 = (targetUsd1e18 * 10n**8n) / BigInt(pxH);

    await expect(vault.connect(user2).withdraw(shares))
      .to.emit(vault, 'WithdrawPaid')
      .withArgs(ethers.MaxUint256, user2.address, expectedNetHype1e18);
  });

  it("Calcule les frais autoDeployBps sur retrait immédiat", async function () {
    // Fixer les frais de retrait à base autoDeploy uniquement (10%)
    await vault.connect(owner).setFees(0, 1000, 0);

    const shares = await vault.balanceOf(user1.address);
    const pps = await vault.pps1e18();
    const targetUsd1e18 = (shares * pps) / 10n**18n;
    // Convert USD to HYPE using oracle price (50e8 = $50)
    const handlerAddress = await vault.handler();
    const MockHandler = await ethers.getContractFactory("MockHandler");
    const handler = MockHandler.attach(handlerAddress);
    const pxH = await handler.oraclePxHype1e8();
    const grossHype1e18 = (targetUsd1e18 * 10n**8n) / BigInt(pxH);

    const bps = BigInt(await vault.withdrawFeeBps());
    const expectedFee = (grossHype1e18 * bps) / 10000n;
    const expectedNet = grossHype1e18 - expectedFee;

    await expect(vault.connect(user1).withdraw(shares))
      .to.emit(vault, 'WithdrawPaid')
      .withArgs(ethers.MaxUint256, user1.address, expectedNet);

    // Dépôts enregistrés doivent avoir été consommés à hauteur de la partie base retirée
    // Avec autoDeployBps=9000, 90% est déployé, donc seulement la partie base (10%) est retirée des dépôts
    const autoDeployBps = await vault.autoDeployBps();
    const baseAmount = (grossHype1e18 * (10000n - BigInt(autoDeployBps))) / 10000n;
    const expectedRemainingDeposits = grossHype1e18 > baseAmount ? grossHype1e18 - baseAmount : 0n;
    // Le retrait retire min(grossHype1e18, deposits), donc si grossHype1e18 > deposits, on retire tout
    const initialDeposit = ethers.parseEther("1.0");
    const baseRetired = grossHype1e18 > initialDeposit ? initialDeposit : grossHype1e18;
    const expectedDeposits = initialDeposit - baseRetired;
    expect(await vault.deposits(user1.address)).to.equal(expectedDeposits);
  });

  it("Transfert > solde doit échouer (uint max)", async function () {
    await expect(
      vault.connect(user1).transfer(user2.address, ethers.MaxUint256)
    ).to.be.revertedWith("insufficient balance");
  });

  it("Should prevent withdrawal cancellation if bad id", async function () {
    await expect(
      vault.connect(user1).cancelWithdrawRequest(0)
    ).to.be.revertedWith("bad id");
  });

  it("Reject unsafe approve when allowance already non-zero", async function () {
    await vault.connect(owner).setFees(0, 0, 0);
    const shares = await vault.balanceOf(user1.address);
    const spend = shares / 10n;
    await vault.connect(user1).approve(user2.address, spend);
    await expect(
      vault.connect(user1).approve(user2.address, spend)
    ).to.be.revertedWith("unsafe approve");

    // Reset to zero then set again
    await expect(vault.connect(user1).approve(user2.address, 0))
      .to.emit(vault, 'Approval')
      .withArgs(user1.address, user2.address, 0n);
    await expect(vault.connect(user1).approve(user2.address, spend))
      .to.emit(vault, 'Approval')
      .withArgs(user1.address, user2.address, spend);
  });
});
