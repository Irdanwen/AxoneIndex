'use strict';

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Prix normalisation 1e8 (CoreInteractionHandler via pxDecimals)', function () {
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
    const systemCoreWriter = '0x3333333333333333333333333333333333333333';
    const writerCode = await ethers.provider.getCode(writer.target);
    await ethers.provider.send('hardhat_setCode', [systemCoreWriter, writerCode]);

    const MockUSDC = await ethers.getContractFactory('MockUSDC');
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    Handler = await ethers.getContractFactory('CoreInteractionHandler');
    handler = await Handler.deploy(
      mock.target,
      usdc.target,
      10_000_000, // maxOutbound
      5,          // epochLength
      ethers.ZeroAddress,
      0
    );
    await handler.waitForDeployment();
  });

  it('normalise un prix brut selon pxDecimals (mapping) pour obtenir px1e8', async () => {
    // Crée un spot BTC = 1, token base id = 100
    const spotBTC = 1;
    const baseTokenId = 100;
    // Déclare tokenInfo base (valeurs quelconques ici, on n’infère plus depuis wei/sz)
    await mock.setTokenInfo(baseTokenId, 'BTC', 3, 8);
    // spotInfo(asset) est simulé côté handler via tokenId connus (ici on n'a pas setter spotInfo mock,
    // on configurera directement handler pour spot token mapping afin que _pxScalar utilise tokenInfo)
    await handler.setSpotIds(spotBTC, 0);
    await handler.setSpotTokenIds(0, baseTokenId, 0);

    // Nouveau: définir pxDecimals spot = 5 ⇒ px1e8 = raw * 10^(8-5) = raw * 1e3
    await handler.setSpotPxDecimals(spotBTC, 5);
    // Prix brut renvoyé par precompile (ex: 12_345), prix 1e8 attendu = raw * 1e3 = 12_345_000
    await mock.setSpotPx(spotBTC, 12_345);
    const px1e8 = await handler.oraclePxBtc1e8();
    expect(px1e8).to.equal(12_345_000);
  });
});


