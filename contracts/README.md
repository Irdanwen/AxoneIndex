# Smart Contracts Axone Finance

Ce dossier contient tous les smart contracts utilisés par la plateforme Axone Finance.

## Structure

```
contracts/
├── src/           # Smart contracts Solidity
├── test/          # Tests des smart contracts
├── scripts/       # Scripts de déploiement
├── hardhat.config.js
└── package.json
```

## Installation

```bash
cd contracts
npm install
```

## Scripts disponibles

- `npm run compile` - Compiler les smart contracts
- `npm run test` - Exécuter les tests
- `npm run test:referral` - Tester le système de parrainage
- `npm run deploy` - Déployer les contrats
- `npm run deploy:local` - Déployer sur réseau local
- `npm run deploy:testnet` - Déployer sur testnet
- `npm run deploy:mainnet` - Déployer sur mainnet
- `npm run node` - Démarrer un nœud Hardhat local
- `npm run clean` - Nettoyer les artefacts

## Configuration

1. Copiez le fichier `env.example` vers `.env`
2. Configurez vos variables d'environnement :
   - `PRIVATE_KEY` : Votre clé privée pour le déploiement
   - `TESTNET_RPC_URL` : URL RPC du testnet
   - `MAINNET_RPC_URL` : URL RPC du mainnet
   - `ETHERSCAN_API_KEY` : Clé API Etherscan pour la vérification

## Développement

### Compiler les contrats
```bash
npm run compile
```

### Exécuter les tests
```bash
npm run test
```

### Déployer localement
```bash
npm run node  # Dans un terminal
npm run deploy:local  # Dans un autre terminal
```

### Tester le système de parrainage
```bash
npm run test:referral  # Test complet du ReferralRegistry
```

## Smart Contracts

### ReferralRegistry
- **Type** : Registry de parrainage avec whitelist
- **Fonctionnalités** :
  - Création de codes de parrainage uniques
  - Système de whitelist basé sur les codes
  - Quota configurable par créateur (défaut: 5 codes)
  - Expiration automatique des codes (30 jours)
  - Pause d'urgence
  - Gestion des permissions (Ownable)
- **Sécurité** : ReentrancyGuard, Pausable, validation complète

### AxoneToken
- **Type** : ERC20 Token
- **Nom** : Axone Token
- **Symbole** : AXONE
- **Supply initial** : 1,000,000 tokens
- **Fonctionnalités** : Mint, Burn, Transfer

## Sécurité

⚠️ **IMPORTANT** : Ne commitez jamais vos clés privées ou fichiers `.env` contenant des informations sensibles.

## Intégration avec le Frontend

Les artefacts compilés (ABI et adresses) peuvent être utilisés dans votre application Next.js pour interagir avec les smart contracts.
