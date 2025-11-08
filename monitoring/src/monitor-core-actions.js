import 'dotenv/config';
import axios from 'axios';
import { ethers } from 'ethers';
import pino from 'pino';
import http from 'http';
import client from 'prom-client';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const abiCoder = ethers.AbiCoder.defaultAbiCoder();

const ORDER_WARN_THRESHOLDS = {
  1035: { label: 'HYPE', maxSz: 500_000 }, // 5 000 HYPE en szDecimals=2
  1054: { label: 'BTC', maxSz: 5_000_000 }, // 50 BTC en szDecimals=5
};

// Configuration depuis l'environnement
const RPC_URL = process.env.RPC_URL || 'https://rpc.hyperliquid-testnet.xyz/evm';
const DEFAULT_HANDLER_ADDRESS = '0xaEAe0B32cE902C40A6053950323e6c0228a08efD';
const HANDLER_ADDRESS = (process.env.HANDLER_ADDRESS || DEFAULT_HANDLER_ADDRESS).trim();
const HL_API_URL = process.env.HL_API_URL || 'https://api.hyperliquid-testnet.xyz';
const START_BLOCK = process.env.START_BLOCK ? Number(process.env.START_BLOCK) : undefined;
const ORDER_VERIFY_DELAY_MS = Number(process.env.ORDER_VERIFY_DELAY_MS || 10000);
const INBOUND_VERIFY_DELAY_MS = Number(process.env.INBOUND_VERIFY_DELAY_MS || 8000);
const VERIFY_INTERVAL_MS = Number(process.env.VERIFY_INTERVAL_MS || 30000);
const MAX_VERIFY_ATTEMPTS = Number(process.env.MAX_VERIFY_ATTEMPTS || 5);
const METRICS_PORT = Number(process.env.METRICS_PORT || 3001);
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';

if (!HANDLER_ADDRESS) {
  logger.error('HANDLER_ADDRESS est requis. Renseignez-le dans .env');
  process.exit(1);
}

// Provider EVM
const provider = new ethers.JsonRpcProvider(RPC_URL);

// ABI minimal du handler
const handlerAbi = [
  'event OutboundToCore(bytes data)',
  'event InboundFromCore(uint64 amount1e8)',
  'function usdc() view returns (address)'
];

// ABI minimal ERC20
const erc20Abi = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

const handler = new ethers.Contract(HANDLER_ADDRESS, handlerAbi, provider);

// Prometheus metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const actionCounter = new client.Counter({
  name: 'core_actions_total',
  help: 'Nombre total d\'actions Core détectées',
  labelNames: ['type']
});
const confirmedCounter = new client.Counter({
  name: 'core_actions_confirmed_total',
  help: 'Nombre d\'actions Core confirmées',
  labelNames: ['type']
});
const failedCounter = new client.Counter({
  name: 'core_actions_failed_total',
  help: 'Nombre d\'actions Core échouées',
  labelNames: ['type']
});
const pendingGauge = new client.Gauge({
  name: 'core_actions_pending',
  help: 'Nombre d\'actions Core en attente'
});

register.registerMetric(actionCounter);
register.registerMetric(confirmedCounter);
register.registerMetric(failedCounter);
register.registerMetric(pendingGauge);

// Serveur /metrics
const server = http.createServer(async (req, res) => {
  if (req.url === '/metrics') {
    res.setHeader('Content-Type', register.contentType);
    res.end(await register.metrics());
    return;
  }
  res.statusCode = 404;
  res.end('Not found');
});
server.listen(METRICS_PORT, () => {
  logger.info({ port: METRICS_PORT }, 'Serveur de métriques Prometheus démarré');
});

// Stockage des actions en attente
const pending = new Map(); // key: id (txHash:index), value: { type, emittedAt, retries, data }

function pendingKeyFromEvent(evt) {
  return `${evt.log.transactionHash}:${evt.log.index}`;
}

async function sendAlert(level, message, details) {
  logger[level]({ message, details });
  if (!WEBHOOK_URL) return;
  try {
    await axios.post(WEBHOOK_URL, {
      content: `🚨 Monitoring Core: ${message}\n\n${'```'}\n${JSON.stringify(details || {}, null, 2)}\n${'```'}`
    });
  } catch (e) {
    logger.warn({ err: e.message }, 'Échec envoi webhook');
  }
}

function decodeOutboundData(dataHex) {
  if (!dataHex) return null;
  const hex = dataHex.startsWith('0x') ? dataHex : `0x${dataHex}`;
  if (hex.length < 6) return null;
  const version = parseInt(hex.slice(2, 4), 16);
  const action = parseInt(hex.slice(4, 6), 16);
  const payload = hex.length > 6 ? `0x${hex.slice(6)}` : '0x';
  try {
    if (version === 1 && action === 2 && payload.length > 2) {
      const [asset, isBuy, limitPxRaw, szInSzDecimals, tif, cloid] = abiCoder.decode(
        ['uint32', 'bool', 'uint64', 'uint64', 'uint8', 'uint128'],
        payload
      );
      return {
        version,
        action,
        asset: Number(asset),
        isBuy,
        limitPxRaw,
        szInSzDecimals,
        tif: Number(tif),
        cloid,
      };
    }
    return { version, action };
  } catch (err) {
    logger.warn({ err: err.message }, 'Décodage OutboundToCore impossible');
    return null;
  }
}

async function getUserFills(addressHex) {
  try {
    const { data } = await axios.post(`${HL_API_URL}/info`, {
      type: 'userFills',
      user: addressHex
    }, { timeout: 10000 });
    return Array.isArray(data) ? data : [];
  } catch (e) {
    logger.warn({ err: e.message }, 'Erreur API userFills');
    return [];
  }
}

async function getSpotState(addressHex) {
  try {
    const { data } = await axios.post(`${HL_API_URL}/info`, {
      type: 'spotClearinghouseState',
      user: addressHex
    }, { timeout: 10000 });
    return data || {};
  } catch (e) {
    logger.warn({ err: e.message }, 'Erreur API spotClearinghouseState');
    return {};
  }
}

async function verifyOrder(p) {
  p.retries++;
  const fills = await getUserFills(HANDLER_ADDRESS);
  const emittedSec = Math.floor(p.emittedAt / 1000);
  const found = fills.find(f => {
    const t = Number(f.time || f.timestamp || 0);
    return t && Math.abs(t - emittedSec) <= 120; // confirmation +/- 2 minutes
  });
  if (found) {
    confirmedCounter.inc({ type: 'order' });
    pending.delete(p.id);
    logger.info({ id: p.id, fill: found }, 'Ordre confirmé via API Hyperliquid');
    return true;
  }
  // Fallback: vérifier l’état spot (positions/ordres) si pas de fill perps disponible
  const spotState = await getSpotState(HANDLER_ADDRESS);
  if (spotState && (spotState.openOrders?.length || spotState.recentFills?.length)) {
    const anyFill = (spotState.recentFills || []).find(f => {
      const t = Number(f.time || f.timestamp || 0);
      return t && Math.abs(t - emittedSec) <= 120;
    });
    if (anyFill) {
      confirmedCounter.inc({ type: 'order' });
      pending.delete(p.id);
      logger.info({ id: p.id, fill: anyFill }, 'Ordre SPOT confirmé via spotClearinghouseState');
      return true;
    }
  }
  if (p.retries >= MAX_VERIFY_ATTEMPTS) {
    failedCounter.inc({ type: 'order' });
    pending.delete(p.id);
    await sendAlert('error', 'Ordre non confirmé après tentatives', { id: p.id, emittedAt: p.emittedAt });
    return false;
  }
  return null;
}

async function verifyInbound(p) {
  p.retries++;
  // Vérifier la réception côté EVM (solde USDC du handler)
  try {
    if (!p.baseline) return false;
    const usdcAddr = await handler.usdc();
    const usdc = new ethers.Contract(usdcAddr, erc20Abi, provider);
    const bal = await usdc.balanceOf(HANDLER_ADDRESS);
    // On attend au moins +amount
    if (bal - p.baseline >= p.amount) {
      confirmedCounter.inc({ type: 'inbound' });
      pending.delete(p.id);
      logger.info({ id: p.id, delta: (bal - p.baseline).toString() }, 'Inbound confirmé par solde USDC EVM');
      return true;
    }
  } catch (e) {
    logger.warn({ err: e.message }, 'Erreur vérification inbound');
  }
  if (p.retries >= MAX_VERIFY_ATTEMPTS) {
    failedCounter.inc({ type: 'inbound' });
    pending.delete(p.id);
    await sendAlert('error', 'Inbound non confirmé après tentatives', { id: p.id, emittedAt: p.emittedAt, amount: p.amount?.toString() });
    return false;
  }
  return null;
}

async function scheduleVerification() {
  pendingGauge.set(pending.size);
  if (pending.size === 0) return;
  for (const p of pending.values()) {
    const age = Date.now() - p.emittedAt;
    if (p.type === 'order' && age >= ORDER_VERIFY_DELAY_MS) {
      await verifyOrder(p);
    } else if (p.type === 'inbound' && age >= INBOUND_VERIFY_DELAY_MS) {
      await verifyInbound(p);
    }
  }
  pendingGauge.set(pending.size);
}

async function onOutbound(evt) {
  const id = pendingKeyFromEvent(evt);
  const entry = {
    id,
    type: 'order',
    emittedAt: Date.now(),
    retries: 0,
    txHash: evt.log.transactionHash,
  };
  const decoded = decodeOutboundData(evt.log.data);
  if (decoded) {
    entry.order = {
      asset: decoded.asset,
      isBuy: decoded.isBuy,
      limitPxRaw: decoded.limitPxRaw ? decoded.limitPxRaw.toString() : undefined,
      szInSzDecimals: decoded.szInSzDecimals ? decoded.szInSzDecimals.toString() : undefined,
      cloid: decoded.cloid ? decoded.cloid.toString() : undefined,
    };
    const threshold = decoded.asset != null ? ORDER_WARN_THRESHOLDS[decoded.asset] : undefined;
    if (threshold && decoded.szInSzDecimals !== undefined) {
      const sz = Number(decoded.szInSzDecimals);
      if (!Number.isNaN(sz) && sz > threshold.maxSz) {
        const msg = `Taille d'ordre ${threshold.label} anormalement élevée (${sz} en szDecimals)`;
        const warnDetails = {
          id,
          asset: decoded.asset,
          isBuy: decoded.isBuy,
          limitPxRaw: decoded.limitPxRaw.toString(),
          szInSzDecimals: decoded.szInSzDecimals.toString(),
          cloid: decoded.cloid.toString(),
        };
        logger.warn(warnDetails, msg);
        await sendAlert('warn', msg, warnDetails);
      }
    }
  }
  pending.set(id, entry);
  actionCounter.inc({ type: 'order' });
  logger.info({ id, tx: evt.log.transactionHash }, 'OutboundToCore détecté (supposé ordre IOC)');
}

async function onInbound(amountBn, evt) {
  const id = pendingKeyFromEvent(evt);
  const amount = BigInt(amountBn.toString());
  let baseline = 0n;
  try {
    const usdcAddr = await handler.usdc();
    const usdc = new ethers.Contract(usdcAddr, erc20Abi, provider);
    baseline = BigInt((await usdc.balanceOf(HANDLER_ADDRESS)).toString());
  } catch {}
  const entry = {
    id,
    type: 'inbound',
    emittedAt: Date.now(),
    retries: 0,
    txHash: evt.log.transactionHash,
    amount,
    baseline
  };
  pending.set(id, entry);
  actionCounter.inc({ type: 'inbound' });
  logger.info({ id, tx: evt.log.transactionHash, amount: amount.toString() }, 'InboundFromCore détecté');
}

async function main() {
  logger.info({ RPC_URL, HANDLER_ADDRESS, HL_API_URL, START_BLOCK }, 'Démarrage du monitoring Core');

  // Abonnements aux événements
  handler.on('OutboundToCore', onOutbound);
  handler.on('InboundFromCore', onInbound);

  // Backfill optionnel des logs récents
  if (START_BLOCK) {
    try {
      const current = await provider.getBlockNumber();
      const from = Math.max(START_BLOCK, current - 10_000);
      const to = current;
      logger.info({ from, to }, 'Backfill des événements');
      const iface = new ethers.Interface(handlerAbi);
      const topicsOutbound = [iface.getEvent('OutboundToCore').topicHash];
      const topicsInbound = [iface.getEvent('InboundFromCore').topicHash];
      const logs = await provider.getLogs({ address: HANDLER_ADDRESS, fromBlock: from, toBlock: to, topics: [topicsOutbound] });
      for (const log of logs) {
        const parsed = iface.parseLog(log);
        onOutbound({ log, args: parsed.args });
      }
      const logsIn = await provider.getLogs({ address: HANDLER_ADDRESS, fromBlock: from, toBlock: to, topics: [topicsInbound] });
      for (const log of logsIn) {
        const parsed = iface.parseLog(log);
        await onInbound(parsed.args[0], { log, args: parsed.args });
      }
    } catch (e) {
      logger.warn({ err: e.message }, 'Backfill échoué');
    }
  }

  // Boucle de vérification périodique
  setInterval(scheduleVerification, VERIFY_INTERVAL_MS);
}

main().catch(err => {
  logger.error({ err }, 'Erreur fatale');
  process.exit(1);
});


