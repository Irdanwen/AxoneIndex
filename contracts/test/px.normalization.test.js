'use strict';

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Prix normalisation 1e8 (CoreHandlerLib/CoreInteractionHandler)', function () {
  let MockL1Read, mock;
  let Handler, handler;

  beforeEach(async () => {
    MockL1Read = await ethers.getContractFactory('MockL1Read');
    mock = await MockL1Read.deploy();
    await mock.waitForDeployment();

    // Déployer des mocks minimum pour CoreWriter/USDC
    const MockCoreWriter = await ethers.getContractFactory('MockCoreWriter');
    const writer = await MockCoreWriter.deploy();
    await writer.waitForDeployment();

    const MockUSDC = await ethers.getContractFactory('MockUSDC');
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    Handler = await ethers.getContractFactory('CoreInteractionHandler');
    handler = await Handler.deploy(
      mock.target,
      writer.target,
      usdc.target,
      10_000_000, // maxOutbound
      5,          // epochLength
      ethers.ZeroAddress,
      0
    );
    await handler.waitForDeployment();
  });

  it('normalise un prix brut selon (weiDecimals - szDecimals) pour obtenir px1e8', async () => {
    // Crée un spot BTC = 1, token base id = 100
    const spotBTC = 1;
    const baseTokenId = 100;
    // Déclare le tokenInfo base avec szDecimals=3, weiDecimals=8 → diff = 5 → exponent = 8 - 5 = 3 → scalar = 1e3
    await mock.setTokenInfo(baseTokenId, 'BTC', 3, 8);
    // spotInfo(asset) est simulé côté handler via tokenId connus (ici on n'a pas setter spotInfo mock,
    // on configurera directement handler pour spot token mapping afin que _pxScalar utilise tokenInfo)
    await handler.setSpotIds(spotBTC, 0);
    await handler.setSpotTokenIds(0, baseTokenId, 0);

    // Prix brut renvoyé par precompile (ex: 12_345), prix 1e8 attendu = raw * 1e3 = 12_345_000
    await mock.setSpotPx(spotBTC, 12_345);
    const px1e8 = await handler.oraclePxBtc1e8();
    expect(px1e8).to.equal(12_345_000);
  });
});


