require("@nomicfoundation/hardhat-chai-matchers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReferralRegistry", function () {
  let referralRegistry;
  let owner;
  let user1;
  let user2;
  let user3;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    const ReferralRegistry = await ethers.getContractFactory("ReferralRegistry");
    referralRegistry = await ReferralRegistry.deploy(owner.address);
  });

  describe("Déploiement", function () {
    it("Devrait avoir le bon owner", async function () {
      expect(await referralRegistry.owner()).to.equal(owner.address);
    });

    it("Devrait avoir le bon quota par défaut", async function () {
      expect(await referralRegistry.codesQuota()).to.equal(5);
    });

    it("Devrait ne pas être en pause au déploiement", async function () {
      expect(await referralRegistry.paused()).to.be.false;
    });
  });

  describe("Whitelist direct", function () {
    it("Devrait permettre au owner de whitelister directement", async function () {
      await referralRegistry.whitelistDirect(user1.address);
      expect(await referralRegistry.isWhitelisted(user1.address)).to.be.true;
    });

    it("Devrait empêcher les non-owners de whitelister directement", async function () {
      await expect(
        referralRegistry.connect(user1).whitelistDirect(user2.address)
      ).to.be.revertedWithCustomError(referralRegistry, "OwnableUnauthorizedAccount");
    });

    it("Devrait empêcher de whitelister l'adresse zéro", async function () {
      await expect(
        referralRegistry.whitelistDirect(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(referralRegistry, "ZeroAddress");
    });
  });

  describe("Création de codes", function () {
    beforeEach(async function () {
      await referralRegistry.whitelistDirect(user1.address);
    });

    it("Devrait permettre à un utilisateur whitelisté de créer un code", async function () {
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes("TESTCODE"));
      await referralRegistry.connect(user1)["createCode(bytes32)"](codeHash);
      
      const code = await referralRegistry.codes(codeHash);
      expect(code.creator).to.equal(user1.address);
      expect(code.used).to.be.false;
    });

    it("Devrait empêcher un utilisateur non-whitelisté de créer un code", async function () {
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes("TESTCODE"));
      await expect(
        referralRegistry.connect(user2)["createCode(bytes32)"](codeHash)
      ).to.be.revertedWith("Not whitelisted");
    });

    it("Devrait empêcher de créer un code avec un hash nul", async function () {
      await expect(
        referralRegistry.connect(user1)["createCode(bytes32)"](ethers.ZeroHash)
      ).to.be.revertedWithCustomError(referralRegistry, "InvalidCode");
    });

    it("Devrait respecter le quota de codes", async function () {
      // Créer 5 codes (quota par défaut)
      for (let i = 0; i < 5; i++) {
        const codeHash = ethers.keccak256(ethers.toUtf8Bytes(`CODE${i}`));
        await referralRegistry.connect(user1)["createCode(bytes32)"](codeHash);
      }

      // Le 6ème code devrait échouer
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes("CODE6"));
      await expect(
        referralRegistry.connect(user1)["createCode(bytes32)"](codeHash)
      ).to.be.revertedWithCustomError(referralRegistry, "MaxCodesExceeded");
    });

    it("Devrait permettre de créer un code généré automatiquement", async function () {
      await referralRegistry.connect(user1)["createCode()"]();
      const unused = await referralRegistry.getUnusedCodes(user1.address);
      expect(unused.length).to.be.greaterThan(0);
      const rawCode = unused[unused.length - 1];
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes(rawCode));
      const code = await referralRegistry.codes(codeHash);
      expect(code.creator).to.equal(user1.address);
    });
  });

  describe("Utilisation de codes", function () {
    let codeHash;
    let rawCode;

    beforeEach(async function () {
      await referralRegistry.whitelistDirect(user1.address);
      await referralRegistry.connect(user1)["createCode()"]();
      const unused = await referralRegistry.getUnusedCodes(user1.address);
      rawCode = unused[unused.length - 1];
      codeHash = ethers.keccak256(ethers.toUtf8Bytes(rawCode));
    });

    it("Devrait permettre d'utiliser un code valide", async function () {
      await referralRegistry.connect(user2).useCode(codeHash);
      
      expect(await referralRegistry.isWhitelisted(user2.address)).to.be.true;
      expect(await referralRegistry.referrerOf(user2.address)).to.equal(user1.address);
    });

    it("Devrait empêcher d'utiliser un code inexistant", async function () {
      const invalidHash = ethers.keccak256(ethers.toUtf8Bytes("INVALID"));
      await expect(
        referralRegistry.connect(user2).useCode(invalidHash)
      ).to.be.revertedWithCustomError(referralRegistry, "InvalidCode");
    });

    it("Devrait empêcher d'utiliser un code déjà utilisé", async function () {
      await referralRegistry.connect(user2).useCode(codeHash);
      
      await expect(
        referralRegistry.connect(user3).useCode(codeHash)
      ).to.be.revertedWithCustomError(referralRegistry, "CodeAlreadyUsed");
    });

    it("Devrait empêcher l'auto-référence", async function () {
      await expect(
        referralRegistry.connect(user1).useCode(codeHash)
      ).to.be.revertedWithCustomError(referralRegistry, "AlreadyWhitelisted");
    });

    it("Devrait empêcher un utilisateur déjà whitelisté d'utiliser un code", async function () {
      await referralRegistry.whitelistDirect(user2.address);
      
      await expect(
        referralRegistry.connect(user2).useCode(codeHash)
      ).to.be.revertedWithCustomError(referralRegistry, "AlreadyWhitelisted");
    });
  });

  describe("Gestion des codes", function () {
    beforeEach(async function () {
      await referralRegistry.whitelistDirect(user1.address);
    });

    it("Devrait permettre au owner de révoquer un code", async function () {
      const rawCodesBefore = await referralRegistry.getUnusedCodes(user1.address);
      await referralRegistry.connect(user1)["createCode()"]();
      const unused = await referralRegistry.getUnusedCodes(user1.address);
      expect(unused.length).to.be.greaterThan(rawCodesBefore.length);
      const rawCode = unused[unused.length - 1];
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes(rawCode));
      
      await referralRegistry.revokeCode(codeHash);
      
      const code = await referralRegistry.codes(codeHash);
      expect(code.creator).to.equal(ethers.ZeroAddress);
    });

    it("Devrait empêcher les non-owners de révoquer un code", async function () {
      const rawCodesBefore = await referralRegistry.getUnusedCodes(user1.address);
      await referralRegistry.connect(user1)["createCode()"]();
      const unused = await referralRegistry.getUnusedCodes(user1.address);
      expect(unused.length).to.be.greaterThan(rawCodesBefore.length);
      const rawCode = unused[unused.length - 1];
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes(rawCode));
      
      await expect(
        referralRegistry.connect(user1).revokeCode(codeHash)
      ).to.be.revertedWithCustomError(referralRegistry, "OwnableUnauthorizedAccount");
    });

    it("Devrait retourner les codes non utilisés d'un créateur", async function () {
      await referralRegistry.connect(user1)["createCode()"]();
      await referralRegistry.connect(user1)["createCode()"]();
      
      const unusedCodes = await referralRegistry.getUnusedCodes(user1.address);
      expect(unusedCodes.length).to.equal(2);
    });
  });

  describe("Configuration", function () {
    it("Devrait permettre au owner de changer le quota", async function () {
      await referralRegistry.setQuota(10);
      expect(await referralRegistry.codesQuota()).to.equal(10);
    });

    it("Devrait empêcher les non-owners de changer le quota", async function () {
      await expect(
        referralRegistry.connect(user1).setQuota(10)
      ).to.be.revertedWithCustomError(referralRegistry, "OwnableUnauthorizedAccount");
    });

    it("Devrait permettre au owner de pauser/dépauser la génération de codes", async function () {
      await referralRegistry.setCodeGenerationPaused(true);
      expect(await referralRegistry.codeGenerationPaused()).to.be.true;
      
      await referralRegistry.setCodeGenerationPaused(false);
      expect(await referralRegistry.codeGenerationPaused()).to.be.false;
    });
  });

  describe("Pause", function () {
    it("Devrait permettre au owner de pauser le contrat", async function () {
      await referralRegistry.pause();
      expect(await referralRegistry.paused()).to.be.true;
    });

    it("Devrait permettre au owner de dépauser le contrat", async function () {
      await referralRegistry.pause();
      await referralRegistry.unpause();
      expect(await referralRegistry.paused()).to.be.false;
    });

    it("Devrait empêcher les actions quand le contrat est en pause", async function () {
      await referralRegistry.whitelistDirect(user1.address);
      await referralRegistry.pause();
      
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes("TESTCODE"));
      await expect(
        referralRegistry.connect(user1)["createCode(bytes32)"](codeHash)
      ).to.be.revertedWithCustomError(referralRegistry, "EnforcedPause");
    });
  });
});
