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
    vault = await Vault.deploy(usdc.target);

    await usdc.mint(user1.address, 1_000_000n);
    await usdc.mint(user2.address, 1_000_000n);

    await usdc.connect(user1).approve(vault.target, 100_000n);
    await vault.connect(user1).deposit(100_000); // 100 USDC (1e6)
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
    const amount1e18 = (shares * pps) / 10n**18n;
    const target1e6 = amount1e18 / 10n**12n;

    await expect(vault.connect(user2).withdraw(shares))
      .to.emit(vault, 'WithdrawPaid')
      .withArgs(ethers.MaxUint256, user2.address, BigInt(target1e6));
  });

  it("Calcule les frais autoDeployBps sur retrait immédiat", async function () {
    // Fixer les frais de retrait à base autoDeploy uniquement (10%)
    await vault.connect(owner).setFees(0, 0, 1000);

    const shares = await vault.balanceOf(user1.address);
    const pps = await vault.pps1e18();
    const gross1e18 = (shares * pps) / 10n**18n;
    const gross1e6 = gross1e18 / 10n**12n;

    const expectedFee = (gross1e6 * 1000n) / 10000n;
    const expectedNet = gross1e6 - expectedFee;

    await expect(vault.connect(user1).withdraw(shares))
      .to.emit(vault, 'WithdrawPaid')
      .withArgs(ethers.MaxUint256, user1.address, expectedNet);

    // Dépôts enregistrés doivent avoir été consommés à hauteur de gross (base)
    expect(await vault.deposits(user1.address)).to.equal(0n);
  });

  it("Transfert > solde doit échouer (uint max)", async function () {
    await expect(
      vault.connect(user1).transfer(user2.address, ethers.MaxUint256)
    ).to.be.revertedWith("insufficient balance");
  });

  it("Should prevent withdrawal cancellation if balance desynchronized", async function () {
    await vault.connect(owner).setFees(0, 0, 0);
    // Créer une demande de retrait avant de transférer des parts
    const pps = await vault.pps1e18();
    const cash = await usdc.balanceOf(vault.target);
    const target1e6 = (cash * 1000000000000n) + 1n;
    const sharesToWithdraw = (target1e6 * 10000000000000000000n) / pps;
    await vault.connect(user1).withdraw(sharesToWithdraw);
    
    // Désynchroniser le solde via un transfert
    await vault.connect(user1).transfer(user2.address, 500);
    
    // Vérifier que la demande de retrait existe
    expect(await vault.withdrawQueue(0)).to.not.be.null;
    
    // Tentative de cancellation avec solde désynchronisé
    await expect(
      vault.connect(user1).cancelWithdrawRequest(0)
    ).to.be.revertedWith("invalid balance");
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
