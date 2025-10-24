# Axone Finance — Monorepo (App + Contracts + Monitoring + Bot)

Monorepo Axone Finance contenant l’application Next.js, les smart contracts Hardhat, un service de monitoring Core/HyperEVM et un bot de rebalancement. Cette documentation centralise l’installation, les commandes et les liens vers les guides détaillés.

## 🧭 Aperçu des sous‑projets

```
AxoneIndex/
├── src/                  # Frontend Next.js 15 / React 19 / Tailwind 4
├── contracts/            # Smart contracts (Hardhat)
├── monitoring/           # Service Node.js (PM2) pour monitorer les actions Core
├── rebalancingbot/       # Bot Python pour rebalance périodique
├── docs/                 # Documentation technique (contrats, guides, déploiement)
├── scripts/              # Scripts utiles (logs, images, checks…)
└── package.json          # Workspace root
```

## ✅ Prérequis

- Node.js 20 LTS recommandé (≥ 18.17 supporté par Next 15)
- pnpm 9.x (recommandé et exigé en CI/CD)
  - Remarque Vercel: fix réseau en forçant pnpm 9.x via `package.json → engines.pnpm` [[voir `docs/troubleshooting/vercel.md`]]

## 🚀 Démarrage rapide (Frontend)

```bash
# 1) Installer les dépendances du monorepo
pnpm install

# 2) Lancer le frontend en développement (Turbopack)
pnpm dev

# 3) Build et démarrage production
pnpm build && pnpm start

# Outils
pnpm lint
pnpm optimize-project   # prune + clear cache + optimisation des images
pnpm clean              # reset local node_modules/.next puis réinstalle
```

Technos côté app: Next.js 15, React 19, TypeScript, Tailwind CSS v4, Framer Motion, shadcn/ui, lucide-react, wagmi/viem.

## 💼 Smart Contracts (Hardhat)

Emplacement: `contracts/`

```bash
# Installation (dans le dossier contracts/)
pnpm -C contracts install

# Compiler / Tester
pnpm -C contracts compile
pnpm -C contracts test
pnpm -C contracts test:referral

# Nœud local et déploiement
pnpm -C contracts node
pnpm -C contracts deploy:local

# Réseaux
pnpm -C contracts deploy:testnet
pnpm -C contracts deploy:mainnet

# Nettoyage
pnpm -C contracts clean
```

Configuration attendue: copier `contracts/env.example` → `contracts/.env` puis renseigner `PRIVATE_KEY`, `TESTNET_RPC_URL`, `MAINNET_RPC_URL`, `ETHERSCAN_API_KEY`.

Note: pour utiliser `deploy:testnet` et `deploy:mainnet`, décommentez et complétez les blocs `networks.testnet` et `networks.mainnet` dans `contracts/hardhat.config.js` avec vos URLs et clé privée, ou adaptez-les à vos besoins.

Références utiles:
- `docs/contracts/ReferralRegistry.md`
- `docs/contracts/VaultContract.md`
- `docs/contracts/CoreInteractionHandler.md`
- `docs/contracts/StakingSystem.md`
- Guides Remix/HyperCore dans `docs/guides/deploiement/`
- Index complet de la doc: `docs/index.md`

## 📡 Monitoring Core (Node + PM2)

Emplacement: `monitoring/`

```bash
# Dev
pnpm -C monitoring dev

# Production via PM2
pnpm -C monitoring pm2         # start d’après pm2.config.cjs
pnpm -C monitoring pm2:logs
pnpm -C monitoring pm2:stop
```

Variables d’environnement (fichier `.env` dans `monitoring/`):

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

Astuce: PM2 doit être installé (ex: `pnpm dlx pm2 -v` ou installation globale) et le service expose `/metrics` au format Prometheus.

## 🤖 Bot de Rebalancement (Python)

Emplacement: `rebalancingbot/`

Résumé:
- Appelle périodiquement `rebalancePortfolio(0,0)` sur `CoreInteractionHandler`
- Notifie via Telegram (succès/échec + balances Hyper Core)

Démarrage rapide:
```bash
cd rebalancingbot
pip install -r requirements.txt
touch .env             # créez le fichier puis ajoutez les variables ci‑dessous
python bot.py
```

Exemple de `.env` pour le bot:

```
RPC_URL=https://rpc.hyperliquid-testnet.xyz/evm
PRIVATE_KEY=0x_votre_cle_privee
HANDLER_ADDRESS=0x_adresse_du_contrat_handler
TELEGRAM_TOKEN=token_bot_telegram
TELEGRAM_CHAT_ID=chat_id_telegram
```

Production: voir le README du dossier pour systemd, Docker ou PM2.

## 🎨 Design & UI (Frontend)

Pour la charte complète (couleurs, typographies, animations, conventions et exemples de composants), voir `docs/ui/STYLE_GUIDE.md`.

## 📚 Documentation liée

- Index de la documentation: `docs/index.md`
- Guides de vérification et déploiement HyperCore: `docs/HYPERCORE_VERIFICATION_GUIDE.md`, `docs/HYPERCORE_TESTNET_VERIFICATION_GUIDE.md`
- Staking: `docs/contracts/StakingSystem.md`, `contracts/src/Staking/README.md`
- Référencement/Parrainage: `docs/REFERRAL_GUIDE.md`, `docs/REFERRAL_MANAGEMENT_GUIDE.md`
- Ops / CI: `docs/troubleshooting/vercel.md`

## ⚙️ Personnalisation (Frontend)

- Couleurs/Design: éditer `tailwind.config.ts`
- Animations: utiliser/étendre les classes ci‑dessus via Tailwind 4
- Contenus: éditer les composants dans `src/components` et sections dans `src/app`

## 🔐 Sécurité

- Ne jamais committer de secrets (`.env`, clés privées)
- Utiliser des gestionnaires de secrets en production
- Vérifier les adresses officielles (USDC, L1Read, CoreWriter) avant tout déploiement

## 📜 Licence

Projet sous licence MIT. Voir le fichier LICENSE si présent.

—

Axone Finance — Le futur de la finance décentralisée 🌟
