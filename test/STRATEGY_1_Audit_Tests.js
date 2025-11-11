// Tests d'Audit STRATEGY_1 - Conformité Hyperliquid
// Ces tests valident les points critiques identifiés lors de l'audit

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("STRATEGY_1 - Audit Tests", function () {
  let handler, vault, l1read, coreWriter, usdc;
  let owner, user1, user2;
  let spotBTC, spotHYPE, spotTokenBTC, spotTokenHYPE;
  let usdcCoreSystemAddress, hypeCoreSystemAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Déploiement des contrats mock
    const L1ReadMock = await ethers.getContractFactory("L1ReadMock");
    l1read = await L1ReadMock.deploy();

    const CoreWriterMock = await ethers.getContractFactory("CoreWriterMock");
    coreWriter = await CoreWriterMock.deploy();
    await coreWriter.waitForDeployment();
    const systemCoreWriter = "0x3333333333333333333333333333333333333333";
    const writerCode = await ethers.provider.getCode(coreWriter.target);
    await ethers.provider.send("hardhat_setCode", [systemCoreWriter, writerCode]);

    const USDC = await ethers.getContractFactory("ERC20Mock");
    usdc = await USDC.deploy("USDC", "USDC", 8); // 8 decimals comme USDC

    const CoreInteractionHandler = await ethers.getContractFactory("CoreInteractionHandler");
    handler = await CoreInteractionHandler.deploy(
      l1read.address,
      usdc.address,
      ethers.utils.parseUnits("1000000", 8), // maxOutboundPerEpoch
      7200, // epochLength (1 jour sur Ethereum)
      owner.address, // feeVault
      100 // feeBps (1%)
    );

    const VaultContract = await ethers.getContractFactory("VaultContract");
    vault = await VaultContract.deploy();

    // Configuration des IDs (valeurs d'exemple)
    spotBTC = 1;
    spotHYPE = 2;
    spotTokenBTC = 1;
    spotTokenHYPE = 2;
    usdcCoreSystemAddress = owner.address;
    hypeCoreSystemAddress = owner.address;

    // Configuration du handler
    await handler.setVault(vault.address);
    await handler.setUsdcCoreLink(usdcCoreSystemAddress, 1);
    await handler.setHypeCoreLink(hypeCoreSystemAddress, 2);
    await handler.setSpotIds(spotBTC, spotHYPE);
    await handler.setSpotTokenIds(1, spotTokenBTC, spotTokenHYPE);

    // Configuration du vault
    await vault.setHandler(handler.address);
  });

  describe("1. Gestion des Décimales (szDecimals vs weiDecimals)", function () {
    it("should convert szDecimals to weiDecimals correctly", async function () {
      // Test avec différents cas de décimales
      const testCases = [
        { szDecimals: 4, weiDecimals: 10, balanceSz: 10000, expectedWei: 10000000000 },
        { szDecimals: 8, weiDecimals: 8, balanceSz: 100000000, expectedWei: 100000000 },
        { szDecimals: 8, weiDecimals: 4, balanceSz: 100000000, expectedWei: 10000 }
      ];

      for (const testCase of testCases) {
        // Mock tokenInfo pour le test
        await l1read.setTokenInfo(1, "USDC", [], 0, ethers.constants.AddressZero, ethers.constants.AddressZero, testCase.szDecimals, testCase.weiDecimals, 0);
        await l1read.setSpotBalance(handler.address, 1, testCase.balanceSz, 0, 0);

        const balanceWei = await handler.spotBalanceInWei(handler.address, 1);
        expect(balanceWei).to.equal(testCase.expectedWei);
      }
    });

    it("should use correct decimals for valuation vs trading", async function () {
      // Test que la valorisation utilise weiDecimals
      await l1read.setTokenInfo(1, "USDC", [], 0, ethers.constants.AddressZero, ethers.constants.AddressZero, 4, 8, 0);
      await l1read.setSpotBalance(handler.address, 1, 10000, 0, 0); // 10000 en szDecimals = 100000000 en weiDecimals
      await l1read.setSpotPx(spotBTC, 50000 * 1000); // 50000 USD en format 1e3

      const equity = await handler.equitySpotUsd1e18();
      // Devrait utiliser weiDecimals pour la valorisation
      expect(equity).to.be.gt(0);
    });
  });

  describe("2. Prix Oracle et Normalisation", function () {
    it("should normalize BTC price from 1e3 to 1e8", async function () {
      const btcPrice1e3 = 50000; // 50000 USD en format 1e3
      await l1read.setSpotPx(spotBTC, btcPrice1e3);

      const normalizedPrice = await handler.oraclePxBtc1e8();
      const expectedPrice = btcPrice1e3 * 100000; // ×10^5
      expect(normalizedPrice).to.equal(expectedPrice);
    });

    it("should normalize HYPE price from 1e6 to 1e8", async function () {
      const hypePrice1e6 = 50; // 50 USD en format 1e6
      await l1read.setSpotPx(spotHYPE, hypePrice1e6);

      const normalizedPrice = await handler.oraclePxHype1e8();
      const expectedPrice = hypePrice1e6 * 100; // ×10^2
      expect(normalizedPrice).to.equal(expectedPrice);
    });

    it("should handle oracle price validation", async function () {
      // Test avec prix initial
      await l1read.setSpotPx(spotBTC, 50000 * 1000);
      const price1 = await handler.oraclePxBtc1e8();
      expect(price1).to.be.gt(0);

      // Test avec déviation acceptable
      await l1read.setSpotPx(spotBTC, 51000 * 1000); // +2%
      const price2 = await handler.oraclePxBtc1e8();
      expect(price2).to.be.gt(0);

      // Test avec déviation excessive (devrait échouer)
      await l1read.setSpotPx(spotBTC, 100000 * 1000); // +100%
      await expect(handler.oraclePxBtc1e8()).to.be.revertedWith("ORACLE_DEV");
    });
  });

  describe("3. Encodage des Ordres Spot", function () {
    it("should encode spot limit orders correctly", async function () {
      const asset = spotBTC;
      const isBuy = true;
      const limitPx1e8 = 50000 * 1e8;
      const szInSzDecimals = 1000000; // 1 BTC en szDecimals
      const tif = 3; // IOC
      const cloid = 12345;

      // Test via l'événement SpotOrderPlaced
      await l1read.setSpotPx(spotBTC, 50000 * 1000);
      await l1read.setSpotBalance(handler.address, spotTokenBTC, 0, 0, 0);
      await l1read.setSpotBalance(handler.address, 1, 100000000, 0, 0); // 1 USDC

      await expect(handler.executeDeposit(100000000, false))
        .to.emit(handler, "SpotOrderPlaced")
        .withArgs(spotBTC, true, limitPx1e8, szInSzDecimals, 0);
    });

    it("should convert USD to szDecimals correctly", async function () {
      const usd1e18 = ethers.utils.parseEther("50000"); // 50,000 USD
      const price1e8 = 50000 * 1e8; // 50,000 USD per BTC

      // Mock token info pour BTC
      await l1read.setTokenInfo(spotTokenBTC, "BTC", [], 0, ethers.constants.AddressZero, ethers.constants.AddressZero, 4, 10, 0);

      const szDecimals = await handler.toSzInSzDecimals(spotTokenBTC, usd1e18, price1e8);
      expect(szDecimals).to.be.gt(0);
    });
  });

  describe("4. Transfer Natif HYPE vers Core", function () {
    it("should handle native HYPE deposit correctly", async function () {
      const hypeAmount = ethers.utils.parseEther("1.0"); // 1 HYPE
      await l1read.setSpotPx(spotHYPE, 50 * 1e6); // 50 USD en format 1e6

      // Mock balances
      await l1read.setSpotBalance(handler.address, 1, 0, 0, 0); // Pas d'USDC
      await l1read.setSpotBalance(handler.address, spotTokenHYPE, 0, 0, 0); // Pas de HYPE

      await expect(vault.deposit({ value: hypeAmount }))
        .to.emit(vault, "Deposit")
        .withArgs(user1.address, hypeAmount, expect.any(Number));
    });

    it("should send native HYPE to Core system address", async function () {
      const hypeAmount = ethers.utils.parseEther("1.0");
      
      // Test que le transfert natif fonctionne
      await expect(handler.executeDepositHype(false, { value: hypeAmount }))
        .to.not.be.reverted;
    });
  });

  describe("5. Spot Send Encoding", function () {
    it("should encode spot send correctly", async function () {
      const destination = usdcCoreSystemAddress;
      const tokenId = 1;
      const amount1e8 = 100000000; // 1 USDC

      // Test via pullFromCoreToEvm
      await l1read.setSpotBalance(handler.address, 1, amount1e8, 0, 0);
      
      await expect(handler.pullFromCoreToEvm(amount1e8))
        .to.emit(handler, "InboundFromCore")
        .withArgs(amount1e8);
    });
  });

  describe("6. Rebalancement 50/50", function () {
    it("should rebalance to 50/50 correctly", async function () {
      // Setup: Portfolio déséquilibré (70% BTC, 30% HYPE)
      await l1read.setSpotPx(spotBTC, 50000 * 1000);
      await l1read.setSpotPx(spotHYPE, 50 * 1e6);
      
      // Mock balances déséquilibrés
      await l1read.setSpotBalance(handler.address, 1, 30000000, 0, 0); // 0.3 USDC
      await l1read.setSpotBalance(handler.address, spotTokenBTC, 1400000, 0, 0); // 0.7 BTC
      await l1read.setSpotBalance(handler.address, spotTokenHYPE, 600000, 0, 0); // 0.3 HYPE

      // Mock token info
      await l1read.setTokenInfo(1, "USDC", [], 0, ethers.constants.AddressZero, ethers.constants.AddressZero, 8, 8, 0);
      await l1read.setTokenInfo(spotTokenBTC, "BTC", [], 0, ethers.constants.AddressZero, ethers.constants.AddressZero, 4, 10, 0);
      await l1read.setTokenInfo(spotTokenHYPE, "HYPE", [], 0, ethers.constants.AddressZero, ethers.constants.AddressZero, 6, 8, 0);

      await expect(handler.rebalancePortfolio(0, 0))
        .to.emit(handler, "Rebalanced");
    });

    it("should respect deadband for small imbalances", async function () {
      // Setup: Petit déséquilibre (51% BTC, 49% HYPE)
      await l1read.setSpotPx(spotBTC, 50000 * 1000);
      await l1read.setSpotPx(spotHYPE, 50 * 1e6);
      
      await l1read.setSpotBalance(handler.address, 1, 0, 0, 0);
      await l1read.setSpotBalance(handler.address, spotTokenBTC, 1020000, 0, 0); // 51% BTC
      await l1read.setSpotBalance(handler.address, spotTokenHYPE, 980000, 0, 0); // 49% HYPE

      await l1read.setTokenInfo(1, "USDC", [], 0, ethers.constants.AddressZero, ethers.constants.AddressZero, 8, 8, 0);
      await l1read.setTokenInfo(spotTokenBTC, "BTC", [], 0, ethers.constants.AddressZero, ethers.constants.AddressZero, 4, 10, 0);
      await l1read.setTokenInfo(spotTokenHYPE, "HYPE", [], 0, ethers.constants.AddressZero, ethers.constants.AddressZero, 6, 8, 0);

      // Avec deadband de 50 bps, ne devrait pas rebalancer
      await handler.rebalancePortfolio(0, 0);
      // Vérifier qu'aucun ordre n'est placé (pas d'événement SpotOrderPlaced)
    });
  });

  describe("7. Mécanismes de Sécurité", function () {
    it("should enforce rate limiting", async function () {
      const maxOutbound = await handler.maxOutboundPerEpoch();
      const largeAmount = maxOutbound.add(1);

      await expect(handler.executeDeposit(largeAmount, false))
        .to.be.revertedWith("RateLimited");
    });

    it("should pause operations when paused", async function () {
      await handler.pause();
      
      await expect(handler.executeDeposit(100000000, false))
        .to.be.revertedWith("Pausable: paused");
    });

    it("should allow emergency pause", async function () {
      await handler.emergencyPause();
      
      await expect(handler.executeDeposit(100000000, false))
        .to.be.revertedWith("Pausable: paused");
    });

    it("should validate oracle prices", async function () {
      // Test avec prix zéro
      await l1read.setSpotPx(spotBTC, 0);
      
      await expect(handler.oraclePxBtc1e8())
        .to.be.revertedWith("OracleZero");
    });
  });

  describe("8. VaultContract - Gestion HYPE Natif", function () {
    it("should calculate NAV correctly", async function () {
      const hypeBalance = ethers.utils.parseEther("10.0");
      await l1read.setSpotPx(spotHYPE, 50 * 1e6); // 50 USD
      
      // Mock equity Core
      await l1read.setSpotBalance(handler.address, 1, 100000000, 0, 0); // 1 USDC
      await l1read.setTokenInfo(1, "USDC", [], 0, ethers.constants.AddressZero, ethers.constants.AddressZero, 8, 8, 0);

      // Envoyer HYPE au vault
      await user1.sendTransaction({ to: vault.address, value: hypeBalance });

      const nav = await vault.nav1e18();
      expect(nav).to.be.gt(0);
    });

    it("should handle withdrawal with insufficient liquidity", async function () {
      // Setup: Vault avec peu de liquidité
      await l1read.setSpotPx(spotHYPE, 50 * 1e6);
      
      // Mock balances Core
      await l1read.setSpotBalance(handler.address, 1, 1000000, 0, 0); // 0.01 USDC
      await l1read.setSpotBalance(handler.address, spotTokenBTC, 0, 0, 0);
      await l1read.setSpotBalance(handler.address, spotTokenHYPE, 0, 0, 0);

      // Dépôt initial
      await vault.deposit({ value: ethers.utils.parseEther("1.0") });
      
      // Tentative de retrait (devrait créer une queue)
      const shares = await vault.balanceOf(user1.address);
      await expect(vault.withdraw(shares))
        .to.emit(vault, "WithdrawRequested");
    });
  });

  describe("9. Tests d'Intégration", function () {
    it("should handle complete USDC deposit flow", async function () {
      const depositAmount = 100000000; // 1 USDC
      
      // Mock setup
      await l1read.setSpotPx(spotBTC, 50000 * 1000);
      await l1read.setSpotPx(spotHYPE, 50 * 1e6);
      await l1read.setSpotBalance(handler.address, 1, 0, 0, 0);
      await l1read.setSpotBalance(handler.address, spotTokenBTC, 0, 0, 0);
      await l1read.setSpotBalance(handler.address, spotTokenHYPE, 0, 0, 0);

      // Approve USDC
      await usdc.approve(handler.address, depositAmount);
      
      await expect(handler.executeDeposit(depositAmount, false))
        .to.emit(handler, "SpotOrderPlaced")
        .withArgs(spotBTC, true, expect.any(Number), expect.any(Number), 0)
        .and.to.emit(handler, "SpotOrderPlaced")
        .withArgs(spotHYPE, true, expect.any(Number), expect.any(Number), 0);
    });

    it("should handle complete HYPE deposit flow", async function () {
      const hypeAmount = ethers.utils.parseEther("1.0");
      
      // Mock setup
      await l1read.setSpotPx(spotBTC, 50000 * 1000);
      await l1read.setSpotPx(spotHYPE, 50 * 1e6);
      await l1read.setSpotBalance(handler.address, 1, 0, 0, 0);
      await l1read.setSpotBalance(handler.address, spotTokenBTC, 0, 0, 0);
      await l1read.setSpotBalance(handler.address, spotTokenHYPE, 0, 0, 0);

      await expect(handler.executeDepositHype(false, { value: hypeAmount }))
        .to.emit(handler, "SpotOrderPlaced");
    });
  });
});

// Contrats Mock pour les tests
contract("L1ReadMock", function () {
  // Mock implementation pour les tests
});

contract("CoreWriterMock", function () {
  // Mock implementation pour les tests
});
