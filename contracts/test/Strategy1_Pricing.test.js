'use strict';

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Strategy_1 Pricing & Quantization', function () {
  let MockL1Read, mock;
  let MockCoreWriter, writer;
  let MockUSDC, usdc;
  let Handler, handler;

  const SPOT_BTC = 1;
  const SPOT_HYPE = 2;
  const TOKEN_BTC = 100;
  const TOKEN_HYPE = 200;
  const TOKEN_USDC = 300;

  beforeEach(async () => {
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
      10_000_000, // maxOutbound
      5,          // epochLength
      ethers.ZeroAddress,
      0
    );
    await handler.waitForDeployment();

    // Link spot ids and token ids
    await handler.setSpotIds(SPOT_BTC, SPOT_HYPE);
    await handler.setSpotTokenIds(TOKEN_USDC, TOKEN_BTC, TOKEN_HYPE);

    // Token decimals config
    // BTC with szDecimals=8, weiDecimals=8
    await mock.setTokenInfo(TOKEN_BTC, 'BTC', 8, 8);
    // HYPE with szDecimals=2, weiDecimals=18 (example)
    await mock.setTokenInfo(TOKEN_HYPE, 'HYPE', 2, 18);
    // USDC with szDecimals=8, weiDecimals=8
    await mock.setTokenInfo(TOKEN_USDC, 'USDC', 8, 8);

    // Set price decimals mapping (pxDecimals) for spots
    // Suppose market pxDecimals are 8 for both for simplicity
    await handler.setSpotPxDecimals(SPOT_BTC, 8);
    await handler.setSpotPxDecimals(SPOT_HYPE, 8);
  });

  it('1) Normalisation raw -> 1e8 selon pxDecimals (8 => identité)', async () => {
    const raw = 123_456_789n;
    const px = await handler.toPx1e8Public(SPOT_BTC, raw);
    expect(px).to.equal(raw);
  });

  it('2) Round-trip 1e8 -> raw -> 1e8 stable pour pxDecimals 6,8,10', async () => {
    // pxDec=6
    await handler.setSpotPxDecimals(SPOT_BTC, 6);
    let px1e8 = 12_345_678_912_345n; // big number
    let raw = await handler.toRawPxPublic(SPOT_BTC, px1e8);
    let back = await handler.toPx1e8Public(SPOT_BTC, raw);
    // Back may lose precision if pxDec<8; verify scaling symmetry floor
    expect(back).to.equal(px1e8 / 100n * 100n); // drop 2 decimals

    // pxDec=8
    await handler.setSpotPxDecimals(SPOT_BTC, 8);
    px1e8 = 9_876_543_210_000n;
    raw = await handler.toRawPxPublic(SPOT_BTC, px1e8);
    back = await handler.toPx1e8Public(SPOT_BTC, raw);
    expect(back).to.equal(px1e8);

    // pxDec=10
    await handler.setSpotPxDecimals(SPOT_BTC, 10);
    px1e8 = 123_456_789n;
    raw = await handler.toRawPxPublic(SPOT_BTC, px1e8);
    back = await handler.toPx1e8Public(SPOT_BTC, raw);
    expect(back).to.equal(px1e8);
  });

  it('3) Quantization: clamp décimales à (8 - szDecimals) et BUY arrondit vers le haut', async () => {
    // BTC szDecimals=8 → maxPxDecimals=0 → prix entier
    const ask1e8 = 98_765_432_100_000n; // 98765.4321 * 1e8
    const epsBps = 10n;
    const lim = ask1e8 + (ask1e8 * epsBps) / 10_000n;
    const q = await handler.quantizePx1e8Public(lim, 8, true);
    // entier 1e8 (coupe décimales) et ceil pour BUY
    expect(q % 100_000_000n).to.equal(0n);
    expect(q).to.be.at.least(ask1e8);
  });

  it('4) Quantization avec meme coin (szDecimals=2): maxPxDecimals=6', async () => {
    const px = 12_345_678n; // 0.12345678 * 1e8 (pour test)
    const qBuy = await handler.quantizePx1e8Public(px, 2, true);
    const qSell = await handler.quantizePx1e8Public(px, 2, false);
    // Après clamp: garder 6 décimales -> couper 2 décimales en base 1e8 (2 derniers digits à 0)
    expect(qBuy % 100n).to.equal(0n);
    expect(qSell % 100n).to.equal(0n);
    // BUY >= SELL (BUY ceil, SELL floor)
    expect(qBuy).to.be.at.least(qSell);
  });

  it('5) Direction d'arrondi: BUY ↑, SELL ↓', async () => {
    const base = 1_234_567_89n; // 12.3456789 * 1e8
    const buy = await handler.quantizePx1e8Public(base, 7, true);  // maxPxDecimals=1
    const sell = await handler.quantizePx1e8Public(base, 7, false);
    expect(buy).to.be.at.least(sell);
    // modulo 1e7 (cut to 1 decimal): remainder zero
    expect(buy % 10_000_000n).to.equal(0n);
    expect(sell % 10_000_000n).to.equal(0n);
  });
});


