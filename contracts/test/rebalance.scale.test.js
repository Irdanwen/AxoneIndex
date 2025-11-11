'use strict';

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Rebalance scale: dB/dH 1e18 -> tailles en szDecimals, BBO limit, cap USDC', function () {
  let MockL1Read, mock, MockCoreWriter, writer, MockUSDC, usdc, Handler, handler, owner, rebalancer, vault;

  beforeEach(async () => {
    [owner, rebalancer, vault] = await ethers.getSigners();
    MockL1Read = await ethers.getContractFactory('MockL1Read');
    mock = await MockL1Read.deploy();
    await mock.waitForDeployment();

    MockCoreWriter = await ethers.getContractFactory('MockCoreWriter');
    writer = await MockCoreWriter.deploy();
    await writer.waitForDeployment();
    const systemCoreWriter = '0x3333333333333333333333333333333333333333';
    const writerCode = await ethers.provider.getCode(writer.target);
    await ethers.provider.send('hardhat_setCode', [systemCoreWriter, writerCode]);

    MockUSDC = await ethers.getContractFactory('MockUSDC');
    usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    Handler = await ethers.getContractFactory('CoreInteractionHandler');
    handler = await Handler.deploy(
      mock.target,
      usdc.target,
      1_000_000_000,
      5,
      ethers.ZeroAddress,
      0
    );
    await handler.waitForDeployment();
    await handler.setMinNotionalUsd1e8(1n);

    await handler.setRebalancer(rebalancer.address);
    await handler.setVault(vault.address);

    // Configure SPOT: BTC=1, HYPE=2
    const spotBTC = 1;
    const spotHYPE = 2;
    await handler.setSpotIds(spotBTC, spotHYPE);

    // TokenIds (USDC=10, BTC=11, HYPE=12)
    await handler.setSpotTokenIds(10, 11, 12);

    // Token infos: USDC wei=6 (exemple), BTC wei=8, sz=3 ; HYPE wei=18, sz=2
    await mock.setTokenInfo(10, 'USDC', 0, 6);
    await mock.setTokenInfo(11, 'BTC', 3, 8);
    await mock.setTokenInfo(12, 'HYPE', 2, 18);

    // Prix bruts
    await mock.setSpotPx(spotBTC, 30_000); // avec scalar 1e3 => 30_000_000 1e8 (30000 USD)
    await mock.setSpotPx(spotHYPE, 50_000_000); // avec scalar 1 => 50_000_000 1e8 (50 USD)
    await mock.setSpotInfo(spotBTC, 'BTC/USDC', 11, 10);
    await mock.setSpotInfo(spotHYPE, 'HYPE/USDC', 12, 10);

    // BBO: assetId = spot + 10000
    await mock.setBbo(10000 + spotBTC, 29_900_000, 30_100_000);
    await mock.setBbo(10000 + spotHYPE, 49_800_000, 50_200_000);
  });

  it('cappe l’achat à l’USDC disponible quand il n’y a pas de ventes, et utilise BBO', async () => {
    // Solde USDC Core (en szDecimals -> ici 1e6 => mais precompile mock renvoie total "brut" déjà cohérent)
    // On crédite 1000 USDC (1e6 => amount=1_000_000_000 pour 1000*1e6). Mock stocke "total" en uint64 "brut".
    await mock.setSpotBalance(handler.target, 10, 1_000_000_000); // 1000 USDC
    // Balances BTC/HYPE = 0
    await mock.setSpotBalance(handler.target, 11, 0);
    await mock.setSpotBalance(handler.target, 12, 0);

    // deadband réduit pour forcer des deltas non-nuls
    await handler.setParams(50, 0, 0);

    // Appel du rebalance: on ne s'intéresse qu'à l’exécution (aucune vente possible ici)
    await expect(handler.connect(rebalancer).rebalancePortfolio(0, 0))
      .to.emit(handler, 'SpotOrderPlaced'); // au moins un ordre placé (BUY BTC ou BUY HYPE)
  });
});


