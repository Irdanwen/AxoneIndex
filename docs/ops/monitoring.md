### Monitoring des actions Core (Hyperliquid)

<!--
title: "Ops — Monitoring des actions Core"
lang: fr
updated: 2025-10-24
owner: Axone Team
-->

Ce sous-dossier fournit un service de monitoring off-chain des actions Core (ordres IOC et transferts) initiées par le contrat `CoreInteractionHandler`. Il vérifie l'exécution via l'API Hyperliquid et expose des métriques Prometheus.

### Fonctionnalités

- **Écoute on-chain**: événements `OutboundToCore(bytes)` et `InboundFromCore(uint64)`.
- **Vérification off-chain**:
  - Ordres: requête `userFills` de l'API Hyperliquid pour confirmer un fill autour de l'horodatage de l'événement.
  - Inbound (Core → EVM): contrôle de l'augmentation du solde USDC du handler ≥ montant attendu.
- **Alertes**: envoi optionnel via `WEBHOOK_URL` (ex: Discord).
- **Métriques**: `/metrics` au format Prometheus (compteurs confirmés/échoués/pending).

### Prérequis

- Node.js 18+
- Accès RPC HyperEVM (Testnet ou Mainnet)

### Installation

```bash
cd monitoring
npm install
# Créez un fichier .env avec votre configuration (exemple ci-dessous)
```

Exemple de `.env`:

```
RPC_URL=https://rpc.hyperliquid-testnet.xyz/evm
HANDLER_ADDRESS=0xVotreAdresseHandler
HL_API_URL=https://api.hyperliquid-testnet.xyz
# START_BLOCK=0
ORDER_VERIFY_DELAY_MS=10000
INBOUND_VERIFY_DELAY_MS=8000
VERIFY_INTERVAL_MS=30000
MAX_VERIFY_ATTEMPTS=5
# WEBHOOK_URL=https://discord.com/api/webhooks/xxx
METRICS_PORT=3001
LOG_LEVEL=info
```

### Lancement

```bash
# Développement
npm run dev

# Production avec PM2
npm run pm2

# Logs PM2
npm run pm2:logs
```

### Variables d'environnement (.env)

- `RPC_URL`: URL RPC HyperEVM (ex: `https://rpc.hyperliquid-testnet.xyz/evm`).
- `HANDLER_ADDRESS`: adresse du contrat `CoreInteractionHandler`.
- `HL_API_URL`: URL de l'API Hyperliquid (`https://api.hyperliquid-testnet.xyz` ou mainnet).
- `START_BLOCK` (optionnel): bloc de départ pour backfill initial.
- `ORDER_VERIFY_DELAY_MS`, `INBOUND_VERIFY_DELAY_MS`: délais avant la première vérification.
- `VERIFY_INTERVAL_MS`, `MAX_VERIFY_ATTEMPTS`: cadence et nombre max de tentatives.
- `WEBHOOK_URL` (optionnel): webhook Discord/Telegram via passerelle HTTP.
- `METRICS_PORT`: port HTTP pour `/metrics`.
- `LOG_LEVEL`: `info` (défaut), `warn`, `error`.

### Ce qui est vérifié

- **Ordres IOC** (déduits des `OutboundToCore`): le service recherche des fills récents sur l'API Hyperliquid pour l'adresse du handler. Si un fill est trouvé dans la fenêtre ±2 min autour de l'événement, l'action est **confirmée**.
  - Fallback SPOT: si aucun fill perps correspondant n'est trouvé, le service interroge `spotClearinghouseState` et tente de corréler des fills SPOT récents.
- **Transferts Inbound** (`InboundFromCore(amount)`): le service lit le solde USDC EVM du handler et confirme si l'augmentation est ≥ `amount` dans la fenêtre de vérification.

Notes:
- Les `OutboundToCore` regroupent plusieurs types d'actions. Faute d'événements dédiés, le service suppose des ordres IOC. Vous pouvez durcir la corrélation en ajoutant des événements spécifiques côté contrat plus tard.
- L'API Hyperliquid peut varier; adaptez les parsers si nécessaire.

### Métriques Prometheus

Expose sur `http://localhost:$METRICS_PORT/metrics`:

- `core_actions_total{type}`
- `core_actions_confirmed_total{type}`
- `core_actions_failed_total{type}`
- `core_actions_pending`

### Dépannage

- Aucune détection? Vérifiez `HANDLER_ADDRESS`, et que le réseau HyperEVM correspond.
- Pas de confirmations d'ordres? Inspectez `userFills` manuellement:

```bash
curl -s -X POST "$HL_API_URL/info" \
  -H 'content-type: application/json' \
  -d '{"type":"userFills","user":"'$HANDLER_ADDRESS'"}' | jq .
```

- Inbound non confirmé? Vérifiez le solde USDC du handler et les logs de transactions.

### Sécurité

- Ne logguez pas de secrets. Le service ne requiert aucune clé privée.
- Limitez l'accès au port de métriques si nécessaire (firewall / reverse-proxy).

### Roadmap (optionnelle)

- Décodage précis des `bytes data` (limite vs spot send) pour corrélation fine.
- Enrichissement des événements côté contrat (`CoreOrderInitiated`, etc.).
- Persistance (SQLite) et tableau de bord (Grafana).


