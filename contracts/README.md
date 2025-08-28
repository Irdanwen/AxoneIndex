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

---

## BTC50 Defensive — Guide et Déploiement Remix

### Aperçu des contrats

- **VaultContract** (`contracts/src/BTC50 Defensive/VaultContract.sol`)
  - Jeton de parts 18 décimales (PPS/NAV en 1e18).
  - Dépôt en USDC 1e6 via `deposit(uint64 amount1e6)` avec frais de dépôt optionnels (`depositFeeBps`).
  - Retrait immédiat si la trésorerie EVM est suffisante, sinon mise en file et règlement ultérieur via `settleWithdraw`.
  - Déploiement automatique d'une fraction du dépôt vers Core via `autoDeployBps` (par défaut 90%).
  - Sécurité: `ReentrancyGuard`, `paused`, `SafeERC20` et snapshot des frais de retrait au moment de la demande.

- **CoreInteractionHandler** (`contracts/src/BTC50 Defensive/CoreInteractionHandler.sol`)
  - Pont vers Core: envoi USDC spot, placements d'ordres IOC BTC/HYPE, rebalancement 50/50.
  - Limitation de débit par epoch: `maxOutboundPerEpoch`, `epochLength` (obligatoirement non nuls).
  - Paramètres de marché: `maxSlippageBps`, `marketEpsilonBps`, `deadbandBps` (≤ 50 bps), garde d'écart oracle via `maxOracleDeviationBps` (par défaut 5%).
  - Sécurité: `onlyVault` pour les flux de fonds, validation de prix oracle avec mémoire du dernier prix.

- **Librairies**
  - `Rebalancer50Lib.sol`: calcule les deltas USD pour revenir au 50/50 avec deadband.
  - `utils/HLConstants.sol`: helpers d'encodage d'actions (IOC, spot send, etc.).

### Ordre d'initialisation recommandé

1. Déployer `CoreInteractionHandler` avec son constructeur renforcé.
2. Configurer le Handler (IDs/params Core).
3. Déployer `VaultContract` et relier Vault ↔ Handler.
4. Ajuster les limites et paramètres si besoin.

### Paramètres et contraintes importantes

- `CoreInteractionHandler` (constructeur)
  - `L1Read _l1read` (adresse du reader oracle/état Core)
  - `ICoreWriter _coreWriter` (adresse d'écrivain Core)
  - `IERC20 _usdc` (adresse USDC ERC20 sur EVM)
  - `uint64 _maxOutboundPerEpoch` (> 0)
  - `uint64 _epochLength` (> 0, secondes)
  - Défauts appliqués: `deadbandBps=50`, `maxOracleDeviationBps=500 (5%)`, `maxSlippageBps=50`, `marketEpsilonBps=10`.

- `CoreInteractionHandler.setParams(_, _, deadbandBps)` exige `deadbandBps ≤ 50`.
- `CoreInteractionHandler.setSpotTokenIds(usdcToken, ...)` n'écrase pas un `usdcCoreTokenId` déjà défini; revert si conflit.
- `VaultContract.settleWithdraw(id, pay, to)` exige un paiement exact basé sur le snapshot des frais au moment de la demande.

### Déploiement sur Remix (pas à pas)

1) Préparation
- Ouvrir `Remix` et créer un nouveau workspace.
- Importer les fichiers du dossier `contracts/src/BTC50 Defensive/` (glisser-déposer depuis le repo local) ainsi que leurs interfaces `interfaces/` et `utils/`.
- Sélectionner le compilateur Solidity `0.8.24` et activer `Auto compile`.

2) Déployer `CoreInteractionHandler`
- Compilations: `CoreInteractionHandler.sol` doit compiler avec succès.
- Renseigner le constructeur:
  - `_l1read`: adresse du contrat `L1Read` sur le réseau cible.
  - `_coreWriter`: adresse du contrat writer Core.
  - `_usdc`: adresse du token USDC (ERC20) sur le réseau cible.
  - `_maxOutboundPerEpoch`: ex. `1000000` (1,000,000 USDC par epoch).
  - `_epochLength`: ex. `3600` (1 heure).
- Déployer et noter l’adresse du Handler.

3) Configurer le Handler
- `setSpotIds(btcSpot, hypeSpot)` → IDs des marchés spot BTC/USDC et HYPE/USDC (spécifiques à Core).
- `setSpotTokenIds(usdcTokenId, btcTokenId, hypeTokenId)` → IDs de tokens spot correspondants. Si `usdcCoreTokenId` déjà défini, l’appel exige la même valeur.
- `setUsdcCoreLink(systemAddress, usdcTokenId)` → adresse système Core pour crédit spot et l’ID USDC.
- (Optionnel) `setParams(maxSlippageBps, marketEpsilonBps, deadbandBps)` avec `deadbandBps ≤ 50`.
- (Optionnel) `setMaxOracleDeviationBps(bps)` → par ex. `500` (5%).

4) Déployer `VaultContract`
- Construire `VaultContract` avec `_usdc` (même adresse USDC que pour le Handler).
- Déployer et noter l’adresse du Vault.

5) Lier Vault et Handler
- Dans le Vault: `setHandler(handlerAddress)`.
- Dans le Handler: `setVault(vaultAddress)`.

6) Configurer les frais et l’auto-déploiement (Vault)
- `setFees(depositFeeBps, withdrawFeeBps, autoDeployBps)`:
  - `autoDeployBps` en bps (ex. `9000` = 90%).
  - `depositFeeBps`, `withdrawFeeBps` en bps (0–10000).

7) Effectuer un dépôt de test
- L’utilisateur doit d’abord approuver le Vault sur l’USDC: appeler `USDC.approve(vaultAddress, amount)`.
- Appeler `Vault.deposit(amount1e6)` (USDC 6 décimales).
- Le Vault transférera automatiquement une fraction (`autoDeployBps`) vers le Handler, qui: crédite USDC spot sur Core, puis passe des IOC pour acheter BTC/HYPE, puis (si `forceRebalance=true` côté Vault) peut rebalancer 50/50.

8) Tester les retraits
- `Vault.withdraw(shares)` retire selon la trésorerie EVM; sinon crée une demande en file.
- `settleWithdraw(id, pay1e6, to)` doit payer exactement le dû net calculé au moment de la demande (snapshot des frais).

### Bonnes pratiques et sécurité

- Utiliser des adresses officielles (USDC, L1Read, CoreWriter, systemAddress) pour le réseau choisi.
- Choisir `maxOutboundPerEpoch` en adéquation avec la liquidité et le risque.
- `deadbandBps` limité à `≤ 50` pour éviter une dérive excessive.
- La garde oracle bloque un prix s’écartant de `maxOracleDeviationBps` par rapport au dernier observé; ajustez prudemment.
- Tous les transferts USDC utilisent `SafeERC20`.
