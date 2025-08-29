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

  it("Transfert de 0 ne modifie pas les soldes et émet l'event", async function () {
    const b1 = await vault.balanceOf(user1.address);
    await expect(vault.connect(user1).transfer(user2.address, 0))
      .to.emit(vault, 'Transfer')
      .withArgs(user1.address, user2.address, 0);
    const a1 = await vault.balanceOf(user1.address);
    const a2 = await vault.balanceOf(user2.address);
    expect(a1).to.equal(b1);
    expect(a2).to.equal(0n);
  });

  it("Dépôt → Transfert → Retrait sans frais supplémentaires", async function () {
    const shares = await vault.balanceOf(user1.address);
    await vault.connect(user1).transfer(user2.address, shares);

    const pps = await vault.pps1e18();
    const amount1e18 = (shares * pps) / 10n**18n;
    const target1e6 = amount1e18 / 10n**12n;

    await expect(vault.connect(user2).withdraw(shares))
      .to.emit(vault, 'WithdrawPaid')
      .withArgs(ethers.MaxUint256, user2.address, BigInt(target1e6));
  });

  it("Transfert > solde doit échouer (uint max)", async function () {
    await expect(
      vault.connect(user1).transfer(user2.address, ethers.MaxUint256)
    ).to.be.revertedWith("insufficient balance");
  });
});
