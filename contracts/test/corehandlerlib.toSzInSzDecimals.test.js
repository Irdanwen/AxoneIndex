'use strict';

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('CoreHandlerLib.toSzInSzDecimals', function () {
  let MockL1Read, mock, TestLib, lib;

  beforeEach(async () => {
    MockL1Read = await ethers.getContractFactory('MockL1Read');
    mock = await MockL1Read.deploy();
    await mock.waitForDeployment();

    TestLib = await ethers.getContractFactory('TestCoreHandlerLib');
    lib = await TestLib.deploy();
    await lib.waitForDeployment();
  });

  it('converte correctement USD1e18 -> size (szDecimals=2) avec denom = px1e8 * 1e10', async () => {
    // Simule un token base (HYPE) avec szDecimals=2, weiDecimals=18
    const spotTokenId = 1234;
    await mock.setTokenInfo(spotTokenId, 'HYPE', 2, 18);
    // Prix normalisé 1e8
    const px1e8 = 50n * 10n ** 8n; // 50 USD
    // Notional USD en 1e18
    const usd1e18 = 1000n * 10n ** 18n; // 1000 USD

    const size = await lib.toSzInSzDecimals(
      await mock.getAddress(),
      spotTokenId,
      usd1e18,
      px1e8
    );

    // Formule: size = usd1e18 * 10^sz / (px1e8 * 1e10)
    // => = 1000e18 * 1e2 / (50e8 * 1e10) = 1000e20 / 50e18 = 20e2 = 2000 (représentation en szDecimals)
    expect(size).to.equal(2000);
  });

  it('retourne 0 si usd ou px est 0', async () => {
    const spotTokenId = 1;
    await mock.setTokenInfo(spotTokenId, 'TKN', 3, 18);
    const px1e8 = 0;
    const usd1e18 = 0;
    expect(await lib.toSzInSzDecimals(await mock.getAddress(), spotTokenId, usd1e18, 1)).to.equal(0);
    expect(await lib.toSzInSzDecimals(await mock.getAddress(), spotTokenId, 1, px1e8)).to.equal(0);
  });
});


