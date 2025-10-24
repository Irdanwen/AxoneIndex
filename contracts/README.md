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

- **USDC décimales (EVM/Core)**: USDC est en 1e8 sur EVM et côté Core. Les montants `amount1e8` sont attendus par `VaultContract` et `CoreInteractionHandler` (BTC50). Ne pas utiliser 1e6.
- **Deadband ≤ 50 bps**: `CoreInteractionHandler.setParams(_, _, deadbandBps)` refuse les valeurs > 50. Valeur défaut: 50 bps.
- **Slippage AxoneSale**: `getCurrentPrice()` augmente graduellement, borné par `maxSlippageBps` et convergent en ~100 blocs. Ajuster via `setMaxSlippageBps` (≤ 1000 = 10%).
- **IDs Core (tokens/markets)**: `setSpotTokenIds` n’écrase pas un `usdcCoreTokenId` existant (revert en cas de conflit). Configurer `setUsdcCoreLink`/`setSpotIds`/`setSpotTokenIds` avec les bonnes valeurs réseau.
- **Rebalanceur**: seul l’adresse configurée via `setRebalancer(address)` peut appeler `rebalancePortfolio`.
- **Retraits différés (Vault)**: `settleWithdraw(id, pay, to)` exige `pay` égal au net dû calculé à partir du PPS courant et du BPS figé lors de la demande. Utiliser `cancelWithdrawRequest(id)` pour annuler avant règlement.
- **Approvals USDC ↔ Handler**: `Vault.setHandler` tente une approbation illimitée; si l’approbation échoue, rappeler `setHandler` après reset.
- **AxoneToken inflation**: `mintInflation()` exige un intervalle écoulé (par défaut 1 jour, min 1 heure). La frappe est basée sur `circulatingSupply()` (exclut les adresses marquées via `setExcludedFromCirculating`).
- **Vente AXN — trésorerie**: définir `setTreasury(address)` avant `buyWithUSDC`, sinon revert "Treasury not set".


## BTC50 Defensive — Guide et Déploiement Remix

> Remarque: Les instructions ci‑dessous s’appliquent également à **HYPE50 Defensive**. Le code et les interfaces de `VaultContract` et `CoreInteractionHandler` sont identiques; seules les valeurs d’IDs marché/token à configurer côté HYPE diffèrent. Voir aussi `contracts/src/HYPE50 Defensive/` et `docs/contracts/HYPE50_VaultContract.md`.

### Aperçu des contrats

- **VaultContract** (`contracts/src/BTC50 Defensive/VaultContract.sol`)
  - Jeton de parts 18 décimales (PPS/NAV en 1e18).
  - Shares ERC20-like: `name = "Core50 Vault Share"`, `symbol = "c50USD"`, `decimals = 18`.
  - Dépôt en USDC 1e8 via `deposit(uint256 amount1e8)` avec frais de dépôt optionnels (`depositFeeBps`).
  - Retrait immédiat si la trésorerie EVM est suffisante, sinon mise en file et règlement ultérieur via `settleWithdraw`.
  - Déploiement automatique d'une fraction du dépôt vers Core via `autoDeployBps` (par défaut 90%).
  - Frais de retrait dépendants du montant retiré (brut, USDC 1e8): configuration par paliers avec `setWithdrawFeeTiers(WithdrawFeeTier[])`. Si aucun palier ne correspond, fallback sur `withdrawFeeBps`.
  - Shares ERC20-like: support de `transfer`, `approve`, `transferFrom`, `allowance` et événements `Transfer`/`Approval`.
  - Sécurité: `ReentrancyGuard`, `paused`, `SafeERC20`, snapshot des frais (BPS) au moment de la demande pour les retraits différés.
  - Utilitaires: `cancelWithdrawRequest(id)` (annule une demande en file non réglée).
  - Détails:
    - `pps1e18()` retourne `1e18` si `totalSupply == 0` (PPS initiale)
    - `deposits[address]` suit la base de dépôts cumulée (USDC 1e8), consommée au paiement des retraits (brut)

- **CoreInteractionHandler** (`contracts/src/BTC50 Defensive/CoreInteractionHandler.sol`)
  - Pont vers Core: envoi USDC spot, placements d'ordres IOC BTC/HYPE, rebalancement 50/50.
  - Limitation de débit par epoch: `maxOutboundPerEpoch`, `epochLength` (obligatoirement non nuls) via `setLimits(uint64, uint64)`.
  - Paramètres de marché: `maxSlippageBps`, `marketEpsilonBps`, `deadbandBps` (≤ 50 bps), garde d'écart oracle via `maxOracleDeviationBps` (par défaut 5%).
  - Sécurité: `onlyVault` pour les flux de fonds, `onlyRebalancer` pour `rebalancePortfolio`, validation de prix oracle avec mémoire du dernier prix.
  - Admin: `setRebalancer(address)` pour définir l'adresse autorisée à appeler le rééquilibrage.
  - Frais: configuration via `setFeeConfig(address feeVault, uint64 feeBps)` et prélèvement à la collecte (`sweepToVault`).
  - Décimales/Valorisation: conversions précises `szDecimals → weiDecimals` pour le calcul de l’equity (`equitySpotUsd1e18`) et du rebalance.

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
  - `IERC20 _usdc` (USDC EVM, 8 décimales)
  - `uint64 _maxOutboundPerEpoch` (> 0)
  - `uint64 _epochLength` (> 0, en blocs)
  - `address _feeVault`, `uint64 _feeBps` (0–10000)
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
  - `_maxOutboundPerEpoch`: ex. `1000000` (1,000,000 USDC 1e8 par epoch).
  - `_epochLength`: ex. `300` (≈ 1 heure si ~12s/bloc).
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
- Appeler `Vault.deposit(amount1e8)` (USDC 8 décimales).
- Le Vault transférera automatiquement une fraction (`autoDeployBps`) vers le Handler, qui: crédite USDC spot sur Core, puis passe des IOC pour acheter BTC/HYPE, puis (si `forceRebalance=true` côté Vault) peut rebalancer 50/50.

8) Tester les retraits
- `Vault.withdraw(shares)` retire selon la trésorerie EVM; sinon crée une demande en file. Les frais appliqués dépendent du montant brut (USDC 1e8) selon les paliers configurés via `setWithdrawFeeTiers`; la valeur de BPS utilisée est figée au moment de la demande si le retrait est différé.
- `settleWithdraw(id, pay1e8, to)` doit payer exactement le dû net calculé avec le BPS figé au moment de la demande (basé sur le montant brut à cette date).

### Bonnes pratiques et sécurité

- Utiliser des adresses officielles (USDC, L1Read, CoreWriter, systemAddress) pour le réseau choisi.
- Choisir `maxOutboundPerEpoch` en adéquation avec la liquidité et le risque.
- `deadbandBps` limité à `≤ 50` pour éviter une dérive excessive.
- La garde oracle bloque un prix s’écartant de `maxOracleDeviationBps` par rapport au dernier observé; ajustez prudemment.
- Tous les transferts USDC utilisent `SafeERC20`.

### Exemples de configuration

```solidity
// Définir l'adresse rebalancer (seul autorisé à appeler rebalancePortfolio)
handler.setRebalancer(0x1234...ABCD);

// Configurer des paliers de frais de retrait (USDC 1e8)
VaultContract.WithdrawFeeTier[] memory tiers = new VaultContract.WithdrawFeeTier[](3);
tiers[0] = VaultContract.WithdrawFeeTier({amount1e8: 100_000_000, feeBps: 50});    // <= 1 USDC : 0,50%
tiers[1] = VaultContract.WithdrawFeeTier({amount1e8: 1_000_000_000, feeBps: 30});  // <= 10 USDC : 0,30%
tiers[2] = VaultContract.WithdrawFeeTier({amount1e8: 10_000_000_000, feeBps: 10}); // <= 100 USDC : 0,10%
vault.setWithdrawFeeTiers(tiers);
```

### How‑to (déploiement rapide) — Configurer rebalancer & paliers de frais

1. Après déploiement des contrats, reliez Vault et Handler:
   - `vault.setHandler(handlerAddress)`
   - `handler.setVault(vaultAddress)`
2. Définissez l’adresse autorisée à rééquilibrer:
   - `handler.setRebalancer(0x...REBALANCER)`
3. Paramétrez les frais (défauts):
   - `vault.setFees(depositFeeBps, withdrawFeeBps, autoDeployBps)`
4. Configurez les paliers de frais de retrait (USDC 1e8):
   - Construire un tableau `WithdrawFeeTier[]` et appeler `vault.setWithdrawFeeTiers(tiers)`

Exemple succinct (Remix/Script):
```solidity
// Rebalancer
handler.setRebalancer(0x1234...ABCD);

// Paliers de frais (brut en USDC 1e8)
VaultContract.WithdrawFeeTier[] memory tiers = new VaultContract.WithdrawFeeTier[](2);
tiers[0] = VaultContract.WithdrawFeeTier({amount1e8: 500_000_000, feeBps: 40});   // 5 USDC
tiers[1] = VaultContract.WithdrawFeeTier({amount1e8: 5_000_000_000, feeBps: 20}); // 50 USDC
vault.setWithdrawFeeTiers(tiers);
```
