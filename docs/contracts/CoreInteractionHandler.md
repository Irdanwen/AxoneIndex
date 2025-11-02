# CoreInteractionHandler — Rôle Rebalancer et Sécurité

## Résumé
- `CoreInteractionHandler.sol` gère les interactions avec Core (Hyperliquid): transferts HYPE natif, ordres IOC SPOT BTC/HYPE, et rééquilibrage 50/50. Le rééquilibrage est restreint à une adresse `rebalancer` définie par l'owner. Pour HYPE50 Defensive, HYPE est traité comme le jeton de gaz natif: les dépôts se font en natif (payable), sont convertis 100% en USDC côté Core, puis alloués 50/50.

## 🔒 Améliorations de Sécurité

### Mécanisme de Pause d'Urgence
- **Héritage de Pausable** : Le contrat utilise maintenant `Pausable` d'OpenZeppelin
- **Protection des fonctions critiques** : Toutes les opérations principales sont protégées par `whenNotPaused`
- **Contrôle d'urgence** : `pause()` et `unpause()` permettent d'arrêter immédiatement les opérations
- **🚨 NOUVEAU** : **Fonction d'urgence** : `emergencyPause()` pour les situations critiques
- **Protection contre les défaillances d'oracle** : Pause disponible en cas de manipulation ou de défaillance

### Corrections Implémentées
- **Optimisation du rate limiting** : Sortie précoce si `usdc1e8 == 0` dans `_rateLimit()`
- **Période de grâce pour l'oracle** : Initialisation progressive de l'oracle sans blocage initial
- **⚡ OPTIMISATION CRITIQUE** : **Migration vers block.number** - Remplacement de `block.timestamp` par `block.number` pour éviter la manipulation des validateurs
- **🔒 SÉCURITÉ RENFORCÉE** : **Rate limiting basé sur les blocs** - Utilisation de `block.number` pour les époques au lieu de timestamps manipulables
- **🐛 CORRECTION CRITIQUE** : **Migration vers ordres SPOT** — Les ordres de rééquilibrage et de dépôt utilisent désormais un encodage SPOT dédié (`encodeSpotLimitOrder`) avec TIF=IOC. Les tailles sont converties selon `szDecimals` via `toSzInSzDecimals()`.
- **💰 CORRECTION AUDIT** : **Valorisation correcte des soldes spot** - Implémentation de `spotBalanceInWei()` pour convertir les balances de `szDecimals` vers `weiDecimals` avant calcul de la valeur USD. Correction appliquée dans `equitySpotUsd1e18()` et `_computeRebalanceDeltas()` pour éviter la surévaluation/sous-évaluation des actifs.
 - **🐛 CORRECTION CRITIQUE (tailles d'ordre ×100)** : **Conversion USD → taille en `szDecimals`** — `toSzInSzDecimals()` divise désormais par `price1e8 * 1e10` (et non `price1e8 * 1e8`). Cela corrige un facteur ×100 sur les tailles d’ordres qui pouvait empêcher l’exécution (ex: vente HYPE initiale lors d’un dépôt natif).

### 🔄 Mécanisme de Rattrapage Graduel Oracle

Le contrat implémente un mécanisme de **rattrapage graduel par paliers** pour gérer les grandes variations de prix oracle tout en conservant une protection contre les manipulations.

#### Fonctionnement

Quand le prix oracle dévie de plus de `maxOracleDeviationBps` (défaut: 5%) :
1. La transaction **échoue** avec l'erreur `OracleGradualCatchup`
2. Mais `lastPx` est **quand même mis à jour** vers la limite de la fourchette (±5%)
3. Les transactions suivantes progressent par paliers successifs jusqu'à convergence

#### Exemple Concret

Prix passe de 100 à 110 (10% de déviation) :

**Transaction 1:**
- `lastPx = 100`
- Prix oracle = 110
- Fourchette autorisée: 95-105
- Prix ajusté: 105 (borne supérieure)
- Mise à jour: `lastPx = 105` ✅
- Transaction ÉCHOUE avec `OracleGradualCatchup` ❌

**Transaction 2:**
- `lastPx = 105` (mis à jour lors de la transaction précédente)
- Prix oracle = 110
- Fourchette autorisée: 99.75-110.25
- Prix ajusté: 110 (dans la fourchette)
- Mise à jour: `lastPx = 110` ✅
- Transaction RÉUSSIT ✅

#### Avantages

- ✅ **Protection contre manipulations** : Changements limités par transaction
- ✅ **Convergence automatique** : Pas de blocage permanent du système
- ✅ **Feedback clair** : Erreur spécifique pour l'utilisateur
- ✅ **Paramétrable** : Ajustable selon les conditions de marché

#### Configuration

```solidity
// Définir une déviation stricte (1%)
handler.setMaxOracleDeviationBps(100);

// Définir une déviation modérée (3%)
handler.setMaxOracleDeviationBps(300);

// Valeur par défaut recommandée (5%)
handler.setMaxOracleDeviationBps(500);

// Déviation permissive pour haute volatilité (10%)
handler.setMaxOracleDeviationBps(1000);
```

**Limites** : Entre 1 et 5000 bps (0.01% - 50%)

## API Clés
- `receive()` (payable): permet de recevoir le jeton natif HYPE en provenance du Core si nécessaire.
- `setRebalancer(address rebalancer)` (onlyOwner): définit l'adresse autorisée à appeler `rebalancePortfolio`.
- `setMaxOracleDeviationBps(uint64 _maxDeviationBps)` (onlyOwner): Configure la déviation maximale autorisée par transaction (entre 1 et 5000 bps). Défaut: 500 bps (5%).
- `rebalancePortfolio(uint128 cloidBtc, uint128 cloidHype)` (onlyRebalancer, whenNotPaused): calcule les deltas via l'oracle et place des ordres IOC SPOT pour revenir vers 50/50 (avec deadband).
- `executeDepositHype(bool forceRebalance)` (payable, onlyVault, whenNotPaused): dépôt HYPE natif (`msg.value`) → envoi natif vers `hypeCoreSystemAddress` → vente 100% en USDC via ordre SPOT IOC → achats ~50% BTC et ~50% HYPE via ordres SPOT IOC. Le rate limit s'applique sur l'équivalent USD (1e8).
- `pullHypeFromCoreToEvm(uint64 hype1e8)` (onlyVault, whenNotPaused): achète du HYPE si nécessaire puis crédite l'EVM en HYPE.
- `sweepHypeToVault(uint256 amount1e18)` (onlyVault, whenNotPaused): calcule les frais en HYPE (1e18), envoie le frais à `feeVault`, transfère le net vers le vault.

## Fonctions (vue d’ensemble)
| Nom | Signature | Visibilité | Mutabilité | Accès |
|-----|-----------|------------|-----------|-------|
| setVault | `setVault(address _vault)` | external | - | onlyOwner |
| setUsdcCoreLink | `setUsdcCoreLink(address systemAddr, uint64 tokenId)` | external | - | onlyOwner |
| setHypeCoreLink | `setHypeCoreLink(address systemAddr, uint64 tokenId)` | external | - | onlyOwner |
| setSpotIds | `setSpotIds(uint32 btcSpot, uint32 hypeSpot)` | external | - | onlyOwner |
| setSpotTokenIds | `setSpotTokenIds(uint64 usdcToken, uint64 btcToken, uint64 hypeToken)` | external | - | onlyOwner |
| setLimits | `setLimits(uint64 _maxOutboundPerEpoch, uint64 _epochLength)` | external | - | onlyOwner |
| setParams | `setParams(uint64 _maxSlippageBps, uint64 _marketEpsilonBps, uint64 _deadbandBps)` | external | - | onlyOwner |
| setMaxOracleDeviationBps | `setMaxOracleDeviationBps(uint64 _maxDeviationBps)` | external | - | onlyOwner |
| setFeeConfig | `setFeeConfig(address _feeVault, uint64 _feeBps)` | external | - | onlyOwner |
| setUsdcReserveBps | `setUsdcReserveBps(uint64 bps)` | external | - | onlyOwner |
| setRebalancer | `setRebalancer(address _rebalancer)` | external | - | onlyOwner |
| setRebalanceAfterWithdrawal | `setRebalanceAfterWithdrawal(bool v)` | external | - | onlyOwner |
| pause/unpause | `pause()` / `unpause()` | external | - | onlyOwner |
| emergencyPause | `emergencyPause()` | external | - | onlyOwner |
| oraclePxHype1e8 | `oraclePxHype1e8()` → `uint64` | external view | view | - |
| oraclePxBtc1e8 | `oraclePxBtc1e8()` → `uint64` | external view | view | - |
| spotBalance | `spotBalance(address coreUser, uint64 tokenId)` → `uint64` | public view | view | - |
| spotOraclePx1e8 | `spotOraclePx1e8(uint32 spotAsset)` → `uint64` | public view | view | - |
| equitySpotUsd1e18 | `equitySpotUsd1e18()` → `uint256` | public view | view | - |
| executeDeposit | `executeDeposit(uint64 usdc1e8, bool forceRebalance)` | external | whenNotPaused | onlyVault |
| executeDepositHype | `executeDepositHype(bool forceRebalance)` | external payable | whenNotPaused | onlyVault |
| pullFromCoreToEvm | `pullFromCoreToEvm(uint64 usdc1e8)` → `uint64` | external | whenNotPaused | onlyVault |
| pullHypeFromCoreToEvm | `pullHypeFromCoreToEvm(uint64 hype1e8)` → `uint64` | external | whenNotPaused | onlyVault |
| sweepToVault | `sweepToVault(uint64 amount1e8)` | external | whenNotPaused | onlyVault |
| sweepHypeToVault | `sweepHypeToVault(uint256 amount1e18)` | external | whenNotPaused | onlyVault |
| rebalancePortfolio | `rebalancePortfolio(uint128 cloidBtc, uint128 cloidHype)` | public | whenNotPaused | onlyRebalancer |

## Événements
- `Rebalanced(int256 dBtc1e18, int256 dHype1e18)`
- `SpotOrderPlaced(uint32 asset, bool isBuy, uint64 limitPx1e8, uint64 sizeSzDecimals, uint128 cloid)`
- `RebalancerSet(address rebalancer)`
- `FeeConfigSet(address feeVault, uint64 feeBps)`
- `HypeCoreLinkSet(address systemAddress, uint64 tokenId)`
- `InboundFromCore(uint64 amount1e8)`
- `LimitsSet(uint64 maxOutboundPerEpoch, uint64 epochLength)`
- `OutboundToCore(bytes data)`
- `ParamsSet(uint64 maxSlippageBps, uint64 marketEpsilonBps, uint64 deadbandBps)`
- `SpotIdsSet(uint32 btcSpot, uint32 hypeSpot)`
- `SpotTokenIdsSet(uint64 usdcToken, uint64 btcToken, uint64 hypeToken)`
- `SweepWithFee(uint64 gross1e8, uint64 fee1e8, uint64 net1e8)`
- `UsdcCoreLinkSet(address systemAddress, uint64 tokenId)`
- `UsdcReserveSet(uint64 bps)`
- `VaultSet(address vault)`

## Erreurs
- `NotOwner()` — appelant ≠ owner
- `NotRebalancer()` — appelant ≠ rebalancer
- `NotVault()` — appelant ≠ vault
- `RateLimited()` — dépassement de plafond sur l’epoch courante
- `OracleZero()` — prix oracle nul
- `OracleGradualCatchup()` — déviation oracle > seuil; mécanisme de rattrapage graduel

## Paramètres et Contraintes
- `deadbandBps ≤ 50`.
- **Garde oracle avec rattrapage graduel** : `maxOracleDeviationBps` borne l'écart relatif par rapport au dernier prix. Si dépassé, la transaction échoue avec `OracleGradualCatchup` mais `lastPx` est mis à jour vers la limite (±5%), permettant une convergence progressive. Configurable entre 1 et 5000 bps (défaut: 500 bps = 5%).
- Limitation de débit par epoch via `maxOutboundPerEpoch` et `epochLength`.

### ⚠️ Rate Limiting et Epochs (IMPORTANT)
Le contrat utilise un système de rate limiting basé sur les **blocs** (et non les timestamps) pour éviter toute manipulation par les validateurs.

- **`epochLength`** : ⚠️ **Exprimé en nombre de blocs**, pas en secondes !
- **`maxOutboundPerEpoch`** : Plafond de transferts USDC/HYPE (en équivalent USD pour les dépôts HYPE) par epoch.
- **Réinitialisation** : Quand `epochLength` blocs sont écoulés, le compteur `sentThisEpoch` est remis à zéro.

### Liens Core
- `setUsdcCoreLink(systemAddress, tokenId)`
- `setHypeCoreLink(systemAddress, tokenId)`
- `setSpotIds(btcSpot, hypeSpot)`
- `setSpotTokenIds(usdcToken, btcToken, hypeToken)`

## Intégration avec `VaultContract`
- Les vaults HYPE50 appellent `executeDepositHype{value: deployAmt}(true)` pour auto-déployer la fraction HYPE en 50/50 après conversion en USDC.
- Les retraits HYPE utilisent `pullHypeFromCoreToEvm()` puis `sweepHypeToVault()` si nécessaire.
- Cohérence des frais: le `VaultContract` réutilise la même adresse `feeVault` (via `handler.feeVault()`) pour envoyer les frais de dépôt et de retrait. Ainsi, les `sweep` du Handler et les frais du Vault convergent tous vers `feeVault`.

## Gestion des Décimales (szDecimals vs weiDecimals + pxDecimals)

### 🔧 Correction Critique - Prix Oracle (pxDecimals)

**Problème identifié** : Les prix oracle Hyperliquid (`spotPx`) sont renvoyés avec des échelles variables selon l'actif :
- BTC : 1e3 (ex: 45000000 = 45000 USD)  
- HYPE : 1e6 (ex: 50000000 = 50 USD)

**Solution implémentée** : La fonction `spotOraclePx1e8()` normalise automatiquement les prix vers 1e8 :
- BTC : `px * 100000` (conversion 1e3 → 1e8)
- HYPE : `px * 100` (conversion 1e6 → 1e8)

Cette correction garantit que tous les calculs de valorisation et rebalancement utilisent des prix cohérents en 1e8.

## Gestion des Décimales (szDecimals vs weiDecimals)

### 🔍 Distinction Critique

Le contrat gère deux types de décimales pour les tokens HyperLiquid :

1. **szDecimals** : Format utilisé pour les opérations de trading (ordres, transfers)
   - Utilisé par `SpotBalance.total` (retourné par le precompile)
- Utilisé pour les montants dans `encodeSpotLimitOrder()` et `encodeSpotSend()`
   - Fonction : `spotBalance()` retourne directement en szDecimals

2. **weiDecimals** : Format utilisé pour la représentation on-chain et valorisation
   - Utilisé pour calculer les valeurs en USD correctement
   - Fonction : `spotBalanceInWei()` convertit de szDecimals vers weiDecimals

### ⚠️ Formule de Conversion

```solidity
balanceInWei = balanceSz × 10^(weiDecimals - szDecimals)
```

### 🔢 Formule `toSzInSzDecimals` (USD1e18 → taille en `szDecimals`)

Pour convertir un notional USD en 1e18 vers une taille base exprimée en `szDecimals` du token spot (avec prix normalisé en 1e8):

```solidity
// tailleBase(szDecimals) = (USD1e18 / px1e8) * 10^(szDecimals-8)
// = USD1e18 * 10^szDecimals / (px1e8 * 1e10)
uint256 numerator = usd1e18 * 10**szDecimals;
uint256 denom = price1e8 * 1e10; // CORRECT
uint256 sizeSz = numerator / denom;
```

Ancienne formule incorrecte (ajoutait un facteur ×100 sur la taille, à éviter):

```solidity
// ❌ denom = price1e8 * 1e8  // trop petit → tailles ×100
```

### 📊 Cas d'Usage

| Fonction | Format Balance | Raison |
|----------|---------------|---------|
| `executeDeposit()` | szDecimals (via `spotBalance()`) | Ordres SPOT / Transfers |
| `pullFromCoreToEvm()` | szDecimals (via `spotBalance()`) | Ordres SPOT / Transfers |
| `equitySpotUsd1e18()` | weiDecimals (via `spotBalanceInWei()`) | Valorisation USD |
| `_computeRebalanceDeltas()` | weiDecimals (via `spotBalanceInWei()`) | Valorisation USD |

### 🎯 Impact

Sans cette correction, si `weiDecimals - szDecimals > 0`, les actifs seraient **sous-valorisés**, affectant :
- Le calcul du NAV (Net Asset Value)
- Le prix par share (PPS)
- Les calculs de rebalancement
- L'équité reportée aux utilisateurs

## Intégration avec `VaultContract`

- Le `VaultContract` doit appeler `setHandler(handler)` après déploiement. USDC conserve une approval illimitée côté vault; HYPE50 n'utilise plus d'approvals (dépôts natifs payable).
- Le `VaultContract` transmet désormais directement les montants en 1e8 au handler (`executeDeposit`, `pullFromCoreToEvm`, `sweepToVault`). Plus aucune conversion 1e8↔1e6 n'est nécessaire.

## FAQ (résumé)

- **Deadband**: la valeur de `deadbandBps` doit être ≤ 50.
- **Rate limiting**: `epochLength` est en nombre de blocs; compteur remis à zéro quand l’epoch expire.
- **Oracle**: `maxOracleDeviationBps` borne l'écart par rapport au dernier prix; période de grâce lors de l'initialisation.
- **Rattrapage graduel oracle**: Si le prix oracle dévie de plus de `maxOracleDeviationBps`, la transaction échoue avec `OracleGradualCatchup` mais `lastPx` est mis à jour vers la limite. Les transactions suivantes convergent progressivement vers le prix réel. Ajustable via `setMaxOracleDeviationBps()` (limites: 1-5000 bps).
- **IDs Core**: `setSpotTokenIds` n'écrase pas un `usdcCoreTokenId` déjà défini; configurer `setUsdcCoreLink`/`setHypeCoreLink`/`setSpotIds` au préalable.
- **Frais**: `setFeeConfig(feeVault, feeBps)` applique un prélèvement lors de `sweepToVault`/`sweepHypeToVault`.

## Note d'implémentation HYPE50 (SPOT uniquement)

- Pour les rééquilibrages et achats/ventes au comptant, utilisez l'encodage SPOT: `encodeSpotLimitOrder(assetId, isBuy, limitPx1e8, szInSzDecimals, TIF_IOC, cloid)`.
- Les tailles d'ordres doivent être exprimées en `szDecimals` du token base (voir `toSzInSzDecimals`).
- Le Handler est strictement SPOT: aucun encodage perps n'est exposé (helpers perps supprimés).

## Mode Market (IOC via BBO)

- Définition: un ordre "market" est soumis en IOC avec un prix limite marketable calé sur le BBO (ask pour BUY, bid pour SELL) normalisé en 1e8.
 - Implémentation HYPE50:
  - `_spotBboPx1e8(spotIndex)` lit `l1read.bbo(assetId)` où `assetId = spotIndex + 10000` (offset Hyperliquid pour les actifs spot), puis normalise: BTC ×1e5 (1e3→1e8), HYPE ×1e2 (1e6→1e8).
  - `_marketLimitFromBbo(asset, isBuy)`:
    - BUY: utilise `ask1e8` (+ `marketEpsilonBps`)
    - SELL: utilise `bid1e8` (− `marketEpsilonBps`)
    - Fallback: `_limitFromOracle(spotOraclePx1e8(asset), isBuy)` si BBO indisponible

## Asset IDs Spot (Offset 10000)

- Les APIs qui attendent un "asset ID spot" utilisent un offset: `assetId = 10000 + spotIndex`.
- À utiliser pour: `bbo(assetId)`, `encodeSpotLimitOrder(assetId, ...)`.
- À ne PAS utiliser pour: `spotPx(spotIndex)`, `spotInfo(spotIndex)`, `tokenInfo(tokenId)`, `spotBalance(user, tokenId)`, `encodeSpotSend(destination, tokenId, amount)`.

Exemple:
```solidity
uint32 assetId = spotBTC + 10000; // BTC/USDC spot
L1Read.Bbo memory b = l1read.bbo(assetId);
// Ordre SPOT IOC
_send(coreWriter, CoreHandlerLib.encodeSpotLimitOrder(assetId, true, limitPx1e8, szInSzDecimals, 0));
```
