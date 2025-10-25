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
> Remarques:
> - Les codes expirent après ~30 jours en se basant sur `BLOCKS_PER_DAY` (12s/bloc).
> - `setQuota`, `setCodeGenerationPaused`, `whitelistDirect`, `revokeCode` sont disponibles pour l’admin.

## Smart Contracts

### ReferralRegistry
- **Type** : Registry de parrainage avec whitelist
- **Fonctionnalités** :
  - Création de codes de parrainage uniques
  - Système de whitelist basé sur les codes
  - Quota configurable par créateur (défaut: 5 codes) via `setQuota(uint256)`
  - Expiration automatique des codes (~30 jours) basée sur les blocs (`BLOCKS_PER_DAY = 7200`)
  - Génération de code on-chain optionnelle (`createCode()`) avec stockage du code brut consultable
  - Pause dédiée pour la génération (`setCodeGenerationPaused(bool)`) et pause globale (`pause()`/`unpause()`)
  - Bootstrapping/gestion: `whitelistDirect(address)` et révocation d’un code (`revokeCode(bytes32)`) par l’owner
  - Gestion des permissions (Ownable)
- **Sécurité** : ReentrancyGuard, Pausable, validation complète
 - **Utilitaires** :
   - `createCode(bytes32 codeHash)` pour enregistrer un code déterministe (avec protection de collision par créateur)
   - `getUnusedCodes(address creator)` retourne la liste des codes on-chain non utilisés et non expirés (chaînes brutes)

### AxoneToken
- **Type** : ERC20 Token
- **Nom** : Axone
- **Symbole** : AXN
- **Supply initial** : 100,000,000 tokens
- **Fonctionnalités** : Mint (inflation), Burn, Transfer, Pause
- **Inflation** : 3% annuelle, calculée sur la supply circulante via `circulatingSupply()`
- **Supply circulante** : possibilité d'exclure certaines adresses (trésorerie, vesting, burn)
  - Admin : `setExcludedFromCirculating(address, bool)`
  - Getters : `circulatingSupply()`, `getExcludedAddresses()`, `isAddressExcludedFromCirculating(address)`
- **Paramètres d'inflation** : `setInflationRecipient(address)`, `setInflationInterval(uint256)`, `nextMintTimestamp()`
  - `mintInflation()` (whenNotPaused, nonReentrant) frappe en fonction du temps écoulé depuis `lastMintTimestamp`
  - Intervalle par défaut 1 jour (min 1 heure); premier mint autorisé immédiatement
  - Suivi des adresses exclues via `excludedBalances` et `totalExcludedBalance` pour un `circulatingSupply()` exact
 - **Administration** :
   - `mint(address to, uint256 amount)` (onlyOwner)
   - `rescueTokens(address token, uint256 amount, address to)` (sauf AXN)
   - `pause()` / `unpause()` (onlyOwner)

### AxoneSale
- **Type** : Contrat de vente publique USDC → AXN
- **Fonctionnalités** : Achat en USDC, plafond de vente, pause d'urgence, retrait des invendus
  - Détails clés:
    - Décimales: `AXN` 1e18, `USDC` 1e8
    - Prix initial: `PRICE_PER_AXN_IN_USDC = USDC_DECIMALS / 10` (0,1 USDC en 8 décimales), modifiable via `updatePrice(uint256)`
    - Slippage: augmentation graduelle plafonnée par `maxSlippageBps`, atteinte en ~100 blocs; `getCurrentPrice()` expose la valeur courante; `setMaxSlippageBps(bps)` ≤ 10%
    - Minimum d’achat: `MIN_PURCHASE = 1000 * 1e18`; Cap: `saleCap = 50_000_000 * 1e18`
    - Formule: `usdcAmount = (axnAmount * currentPrice) / AXN_DECIMALS`
    - Flux: `USDC.transferFrom(buyer→treasury)` puis `AXN.transfer(contract→buyer)`
  - **Utilitaires** : `remainingTokens()`, `isSaleActive()`, `endSale()`, `withdrawUnsoldTokens(address)` (après fin de vente), `setTreasury(address)`

## Sécurité

⚠️ **IMPORTANT** : Ne commitez jamais vos clés privées ou fichiers `.env` contenant des informations sensibles.

## Intégration avec le Frontend

Les artefacts compilés (ABI et adresses) peuvent être utilisés dans votre application Next.js pour interagir avec les smart contracts.

---

## FAQ / erreurs communes

- **HYPE décimales (EVM/Core)**: HYPE est en 1e18 sur EVM et côté Core. Les montants `amount1e18` sont attendus par `VaultContract` et `CoreInteractionHandler` (HYPE50). USDC reste en 1e8.
- **Deadband ≤ 50 bps**: `CoreInteractionHandler.setParams(_, _, deadbandBps)` refuse les valeurs > 50. Valeur défaut: 50 bps.
- **Slippage AxoneSale**: `getCurrentPrice()` augmente graduellement, borné par `maxSlippageBps` et convergent en ~100 blocs. Ajuster via `setMaxSlippageBps` (≤ 1000 = 10%).
- **IDs Core (tokens/markets)**: `setSpotTokenIds` n’écrase pas un `usdcCoreTokenId` existant (revert en cas de conflit). Configurer `setUsdcCoreLink`/`setSpotIds`/`setSpotTokenIds` avec les bonnes valeurs réseau.
- **Rebalanceur**: seul l’adresse configurée via `setRebalancer(address)` peut appeler `rebalancePortfolio`.
- **Retraits différés (Vault)**: `settleWithdraw(id, to)` calcule automatiquement le montant net dû à partir du PPS courant et du BPS figé lors de la demande. Utiliser `cancelWithdrawRequest(id)` pour annuler avant règlement.
- **Approvals USDC ↔ Handler**: `Vault.setHandler` tente une approbation illimitée; si l’approbation échoue, rappeler `setHandler` après reset.
- **AxoneToken inflation**: `mintInflation()` exige un intervalle écoulé (par défaut 1 jour, min 1 heure). La frappe est basée sur `circulatingSupply()` (exclut les adresses marquées via `setExcludedFromCirculating`).
- **Vente AXN — trésorerie**: définir `setTreasury(address)` avant `buyWithUSDC`, sinon revert "Treasury not set".


## HYPE50 Defensive — Guide et Déploiement

> Voir `docs/guides/deploiement/HYPE50_Defensive_Deployment_Guide.md` pour le guide complet de déploiement HYPE50 Defensive.

### Aperçu des contrats

- **VaultContract** (`contracts/src/HYPE50 Defensive/VaultContract.sol`)
  - Jeton de parts 18 décimales (PPS/NAV en 1e18).
  - Shares ERC20-like: `name = "Core50 Vault Share"`, `symbol = "c50USD"`, `decimals = 18`.
  - Dépôt en HYPE natif via `deposit()` (payable) avec frais de dépôt optionnels (`depositFeeBps`).
  - Retrait immédiat si la trésorerie EVM est suffisante, sinon mise en file et règlement ultérieur via `settleWithdraw`.
  - Déploiement automatique d'une fraction du dépôt vers Core via `autoDeployBps` (par défaut 90%).
  - Frais de retrait dépendants du montant retiré (brut, HYPE 1e18): configuration par paliers avec `setWithdrawFeeTiers(WithdrawFeeTier[])`. Si aucun palier ne correspond, fallback sur `withdrawFeeBps`.
  - Shares ERC20-like: support de `transfer`, `approve`, `transferFrom`, `allowance` et événements `Transfer`/`Approval`.
  - Sécurité: `ReentrancyGuard`, `paused`, snapshot des frais (BPS) au moment de la demande pour les retraits différés.
  - Utilitaires: `cancelWithdrawRequest(id)` (annule une demande en file non réglée).

- **CoreInteractionHandler** (`contracts/src/HYPE50 Defensive/CoreInteractionHandler.sol`)
  - Pont vers Core: envoi HYPE natif, placements d'ordres IOC BTC/HYPE, rebalancement 50/50.
  - Limitation de débit par epoch: `maxOutboundPerEpoch`, `epochLength` (obligatoirement non nuls) via `setLimits(uint64, uint64)`.
  - Paramètres de marché: `maxSlippageBps`, `marketEpsilonBps`, `deadbandBps` (≤ 50 bps), garde d'écart oracle via `maxOracleDeviationBps` (par défaut 5%).
  - Sécurité: `onlyVault` pour les flux de fonds, `onlyRebalancer` pour `rebalancePortfolio`, validation de prix oracle avec mémoire du dernier prix.
  - Admin: `setRebalancer(address)` pour définir l'adresse autorisée à appeler le rééquilibrage.
  - Frais: configuration via `setFeeConfig(address feeVault, uint64 feeBps)` et prélèvement à la collecte (`sweepHypeToVault`).
  - Décimales/Valorisation: conversions précises `szDecimals → weiDecimals` pour le calcul de l'equity (`equitySpotUsd1e18`) et du rebalance.

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
  - `uint64 _maxOutboundPerEpoch` (> 0)
  - `uint64 _epochLength` (> 0, en blocs)
  - `address _feeVault`, `uint64 _feeBps` (0–10000)
  - Défauts appliqués: `deadbandBps=50`, `maxOracleDeviationBps=500 (5%)`, `maxSlippageBps=50`, `marketEpsilonBps=10`.

- `CoreInteractionHandler.setParams(_, _, deadbandBps)` exige `deadbandBps ≤ 50`.
- `CoreInteractionHandler.setSpotTokenIds(hypeToken, ...)` n'écrase pas un `hypeCoreTokenId` déjà défini; revert si conflit.
- `VaultContract.settleWithdraw(id, to)` calcule automatiquement le paiement basé sur le snapshot des frais au moment de la demande.

### Exemples de configuration

```solidity
// Définir l'adresse rebalancer (seul autorisé à appeler rebalancePortfolio)
handler.setRebalancer(0x1234...ABCD);

// Configurer des paliers de frais de retrait (HYPE 1e18)
VaultContract.WithdrawFeeTier[] memory tiers = new VaultContract.WithdrawFeeTier[](3);
tiers[0] = VaultContract.WithdrawFeeTier({amount1e18: 1_000_000_000_000_000_000, feeBps: 50});    // <= 1 HYPE : 0,50%
tiers[1] = VaultContract.WithdrawFeeTier({amount1e18: 10_000_000_000_000_000_000, feeBps: 30});  // <= 10 HYPE : 0,30%
tiers[2] = VaultContract.WithdrawFeeTier({amount1e18: 100_000_000_000_000_000_000, feeBps: 10}); // <= 100 HYPE : 0,10%
vault.setWithdrawFeeTiers(tiers);
```
