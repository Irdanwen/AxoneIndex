# CoreInteractionHandler — Rôle Rebalancer et Sécurité

## Résumé
- `CoreInteractionHandler.sol` gère les interactions avec Core (Hyperliquid): transferts HYPE natif, ordres IOC SPOT BTC/HYPE, et rééquilibrage 50/50. Le rééquilibrage est restreint à une adresse `rebalancer` définie par l'owner. Pour HYPE50 Defensive, HYPE est traité comme le jeton de gaz natif: les dépôts se font en natif (payable), sont convertis 100% en USDC côté Core, puis alloués 50/50.

## 🔒 Améliorations de Sécurité
- **Héritage de Pausable** : Le contrat utilise maintenant `Pausable` d'OpenZeppelin
- **Protection des fonctions critiques** : Toutes les opérations principales sont protégées par `whenNotPaused`
- **Contrôle d'urgence** : `pause()` et `unpause()` permettent d'arrêter immédiatement les opérations
- **Protection contre les défaillances d'oracle** : Pause disponible en cas de manipulation ou de défaillance

### Corrections Implémentées
- **Optimisation du rate limiting** : Sortie précoce si `usdc1e8 == 0` dans `_rateLimit()`
- **Période de grâce pour l'oracle** : Initialisation progressive de l'oracle sans blocage initial
- **⚡ OPTIMISATION CRITIQUE** : **Migration vers block.number** - Remplacement de `block.timestamp` par `block.number` pour éviter la manipulation des validateurs
- **🔒 SÉCURITÉ RENFORCÉE** : **Rate limiting basé sur les blocs** - Utilisation de `block.number` pour les époques au lieu de timestamps manipulables
- **🐛 CORRECTION CRITIQUE** : **Migration vers ordres SPOT** — Les ordres de rééquilibrage et de dépôt utilisent désormais un encodage SPOT dédié (`encodeSpotLimitOrder`) avec `reduceOnly=false` et `encodedTif=IOC`. Les tailles sont converties selon `szDecimals` via `toSzInSzDecimals()`.
- **🔗 HARDENING (2025-11-10)** : **Adresse CoreWriter constante** — `CORE_WRITER` est figée à `0x3333…3333` (contrat système HyperCore), supprimant tout risque de mauvaise configuration lors du déploiement.
- **🛡️ GARDE CORE** : **Vérification d’existence du compte HyperCore** — Chaque envoi `sendRawAction` appelle `_ensureCoreAccountExists()` et revert avec `CoreAccountMissing()` si le compte n’est pas encore initialisé côté Core.
- **💰 CORRECTION (2025-11-09)** : **Valorisation fiable des soldes spot** — `spotBalanceInWei()` lit les métadonnées Hyperliquid (`tokenInfo`) et convertit systématiquement les soldes `szDecimals → weiDecimals`, garantissant une valorisation correcte même si le format des precompiles évolue.
- **⚖️ CORRECTION (2025-11-08)** : **Conversion des tailles au prix limite courant** — les ordres de rebalancing utilisent maintenant le même prix que la limite BBO (ask/bid ajusté par `marketEpsilonBps`) pour convertir le notional USD en taille base. Cela empêche d'essayer d'acheter plus d'actifs que la trésorerie disponible lorsque le carnet est loin de l'oracle et réduit les rejets Hyperliquid pour « insufficient funds ».
- **🐛 CORRECTION CRITIQUE (tailles d'ordre ×100)** : **Conversion USD → taille en `szDecimals`** — `toSzInSzDecimals()` divise désormais par `price1e8 * 1e10` (et non `price1e8 * 1e8`). Cela corrige un facteur ×100 sur les tailles d’ordres qui pouvait empêcher l’exécution (ex: vente HYPE initiale lors d’un dépôt natif).

### Encodage CoreWriter (v=1 + ActionID sur 3 bytes)
- L’encodage suit le format: `[0]=0x01, [1..3]=ActionID (big-endian), [4..]=abi.encode(...)`.
- Implémenté dans `HLConstants._encodeAction()` et utilisé par `encodeSpotLimitOrder` et `encodeSpotSend`.

### Adresses Système (Core → EVM / EVM → Core)
- Spot system address: premier octet `0x20`, le reste zéro sauf l’index `tokenId` en big‑endian.
- HYPE natif: adresse spéciale `0x2222222222222222222222222222222222222222`.
- `SystemAddressLib.getSpotSystemAddress(tokenId)` calcule toujours `0x20 + tokenId`, y compris pour `tokenId = 0` (USDC). Aucun traitement spécial n’est appliqué à `tokenId == 0`.

### 🔄 Mécanisme de Rattrapage Graduel Oracle

Le contrat implémente un mécanisme de **rattrapage graduel par paliers** pour gérer les grandes variations de prix oracle tout en conservant une protection contre les manipulations.

#### Fonctionnement

Quand le prix oracle dévie de plus de `maxOracleDeviationBps` (défaut: 5%) :
1. `lastPx` est **mis à jour** vers la limite de la fourchette (±5%)
2. **Rebalance**: n'échoue plus — il devient un **no‑op** (aucun ordre placé) et émet `RebalanceSkippedOracleDeviation(pxB1e8, pxH1e8)`
3. **Dépôts/Retraits**: continuent d'**échouer** avec `OracleGradualCatchup` (sécurité maintenue)
4. Les transactions suivantes progressent par paliers successifs jusqu'à convergence

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
- `rebalancePortfolio(uint128 cloidBtc, uint128 cloidHype)` (onlyRebalancer, whenNotPaused): calcule les deltas via l'oracle et place des ordres IOC SPOT pour revenir vers 50/50 (avec deadband). En cas de déviation oracle, le rebalance est **no‑op** (aucun ordre) et **n'échoue pas**.
- `executeDepositHype(bool forceRebalance)` (payable, onlyVault, whenNotPaused): dépôt HYPE natif (`msg.value`) → envoi natif vers `hypeCoreSystemAddress` → vente 100% en USDC via ordre SPOT IOC → achats ~50% BTC et ~50% HYPE via ordres SPOT IOC. Le rate limit s'applique sur l'équivalent USD (1e8).
- ⤴️ En cas de déviation oracle: les dépôts sont désormais **no‑op** (aucun ordre placé et aucune vente HYPE→USDC pour le dépôt HYPE), mais le crédit sur Core est bien effectué. Événements: `DepositSkippedOracleDeviationUsdc(pxB1e8, pxH1e8)` pour un dépôt USDC, `DepositSkippedOracleDeviationHype(pxH1e8)` pour un dépôt HYPE.
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
- `DepositSkippedOracleDeviationUsdc(uint64 pxB1e8, uint64 pxH1e8)`
- `DepositSkippedOracleDeviationHype(uint64 pxH1e8)`
- `RebalanceSkippedOracleDeviation(uint64 pxB1e8, uint64 pxH1e8)`
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
- `CoreAccountMissing()` — le compte HyperCore de ce contrat n’est pas encore initialisé (exige un micro-transfert Core avant les actions)

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

**Solution implémentée** : Les fonctions de lecture (`spotOraclePx1e8()`, `_spotBboPx1e8()`, `CoreHandlerLib.validatedOraclePx1e8()`) dérivent désormais dynamiquement le facteur d'échelle à partir de `szDecimals` du token base (via `tokenInfo`). Le prix est ensuite normalisé vers 1e8, quelle que soit la paire configurée.

Cette approche respecte les règles Hyperliquid (tick & lot size) : si `szDecimals` change ou qu'un nouvel actif est ajouté, le facteur est recalculé automatiquement.

## Gestion des Décimales (szDecimals vs weiDecimals)

### 🔍 Distinction Critique

Le contrat gère deux types de décimales pour les tokens HyperLiquid :

1. **szDecimals** : Format utilisé pour les opérations de trading (ordres, transferts)
   - Utilisé pour les montants encodés via `encodeSpotLimitOrder(asset, isBuy, limitPxRaw, szInSzDecimals, reduceOnly, encodedTif, cloid)` et `encodeSpotSend(destination, tokenId, amount1e8)`
   - Exemple Hyperliquid : HYPE `szDecimals = 2` (1 unité = 0.01 HYPE)

2. **weiDecimals** : Format utilisé pour la représentation on-chain et la valorisation
   - Le précompilé `spotBalance` renvoie la balance en `szDecimals`
   - `spotBalanceInWei()` récupère les métadonnées via `tokenInfo` et convertit systématiquement en `weiDecimals`

### ⚠️ Formule de Conversion

Depuis 2025‑11‑09, la conversion `szDecimals → weiDecimals` est systématiquement appliquée on-chain :

```solidity
L1Read.TokenInfo memory info = l1read.tokenInfo(uint32(tokenId));
uint256 balanceInWei = convertSzToWei(balanceSz, info.szDecimals, info.weiDecimals);
```

Cela garantit une valorisation correcte même si Hyperliquid modifie le format retourné par les precompiles.

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

Avant la correction 2025‑11‑07, multiplier par `10^(weiDecimals - szDecimals)` sur des valeurs déjà exprimées en `weiDecimals` conduisait à une **sur-valorisation massive** (ex: HYPE ×10⁶). Les conséquences observées :
- NAV et PPS artificiellement gonflés
- Deltas de rebalancement démesurés → ordres SPOT rejetés (balance insuffisante)
- Difficulté à diagnostiquer car les événements `SpotOrderPlaced` étaient bien émis malgré l'absence de fills
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

- Pour les rééquilibrages et achats/ventes au comptant, utilisez l'encodage SPOT: `encodeSpotLimitOrder(assetId, isBuy, limitPxRaw, szInSzDecimals, reduceOnly, encodedTif, cloid)` avec `reduceOnly=false` et `encodedTif=HLConstants.TIF_IOC`.
- Les tailles d'ordres doivent être exprimées en `szDecimals` du token base (voir `toSzInSzDecimals`).
- Le Handler est strictement SPOT: aucun encodage perps n'est exposé (helpers perps supprimés).

## Mode Market (IOC via BBO)

- Définition: un ordre "market" est soumis en IOC avec un prix limite marketable calé sur le BBO (ask pour BUY, bid pour SELL) normalisé en 1e8.
 - Implémentation HYPE50:
  - `_spotBboPx1e8(spotIndex)` lit `l1read.bbo(assetId)` où `assetId = spotIndex + 10000` (offset Hyperliquid pour les actifs spot), puis applique automatiquement `10^(8 - szDecimals(baseToken))` pour normaliser le prix.
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
// Ordre SPOT IOC (reduceOnly=false, TIF=IOC)
_send(
    CoreHandlerLib.encodeSpotLimitOrder(
        assetId,
        true,
        limitPxRaw,
        szInSzDecimals,
        false,
        HLConstants.TIF_IOC,
        0
    )
);
```
