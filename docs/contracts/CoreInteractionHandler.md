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

## API Clés
- `receive()` (payable): permet de recevoir le jeton natif HYPE en provenance du Core si nécessaire.
- `setRebalancer(address rebalancer)` (onlyOwner): définit l'adresse autorisée à appeler `rebalancePortfolio`.
- `rebalancePortfolio(uint128 cloidBtc, uint128 cloidHype)` (onlyRebalancer, whenNotPaused): calcule les deltas via l'oracle et place des ordres IOC SPOT pour revenir vers 50/50 (avec deadband).
- `executeDepositHype(bool forceRebalance)` (payable, onlyVault, whenNotPaused): dépôt HYPE natif (`msg.value`) → envoi natif vers `hypeCoreSystemAddress` → vente 100% en USDC via ordre SPOT IOC → achats ~50% BTC et ~50% HYPE via ordres SPOT IOC. Le rate limit s'applique sur l'équivalent USD (1e8).
- `pullHypeFromCoreToEvm(uint64 hype1e8)` (onlyVault, whenNotPaused): achète du HYPE si nécessaire puis crédite l'EVM en HYPE.
- `sweepHypeToVault(uint256 amount1e18)` (onlyVault, whenNotPaused): calcule les frais en HYPE (1e18), puis transfère le net vers le vault.

## Événements
- `Rebalanced(int256 dBtc1e18, int256 dHype1e18)`
- `SpotOrderPlaced(uint32 asset, bool isBuy, uint64 limitPx1e8, uint64 sizeSzDecimals, uint128 cloid)`
- `RebalancerSet(address rebalancer)`

## Paramètres et Contraintes
- `deadbandBps ≤ 50`.
- Garde oracle: `maxOracleDeviationBps` borne l'écart relatif par rapport au dernier prix.
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
- **Oracle**: `maxOracleDeviationBps` borne l’écart par rapport au dernier prix; période de grâce lors de l’initialisation.
- **IDs Core**: `setSpotTokenIds` n’écrase pas un `usdcCoreTokenId` déjà défini; configurer `setUsdcCoreLink`/`setHypeCoreLink`/`setSpotIds` au préalable.
- **Frais**: `setFeeConfig(feeVault, feeBps)` applique un prélèvement lors de `sweepToVault`/`sweepHypeToVault`.

## Note d'implémentation HYPE50 (encodage SPOT)

- Pour les rééquilibrages et achats/ventes au comptant, utilisez l'encodage SPOT: `encodeSpotLimitOrder(asset, isBuy, limitPx1e8, szInSzDecimals, TIF_IOC, cloid)`.
- Les tailles d'ordres doivent être exprimées en `szDecimals` du token base (voir `toSzInSzDecimals`).
- Éviter d'utiliser `encodeLimitOrder` (perps) pour les marchés spot BTC/USDC et HYPE/USDC.

## Mode Market (IOC via BBO)

- Définition: un ordre “market” est soumis en IOC avec un prix limite marketable calé sur le BBO (ask pour BUY, bid pour SELL) normalisé en 1e8.
- Implémentation HYPE50:
  - `_spotBboPx1e8(spot)` lit `l1read.bbo(spot)` et normalise: BTC ×1e5 (1e3→1e8), HYPE ×1e2 (1e6→1e8).
  - `_marketLimitFromBbo(asset, isBuy)`:
    - BUY: utilise `ask1e8` (+ `marketEpsilonBps`)
    - SELL: utilise `bid1e8` (− `marketEpsilonBps`)
    - Fallback: `_limitFromOracle(spotOraclePx1e8(asset), isBuy)` si BBO indisponible
- EP prix SPOT: `spotPx`. Les endpoints `oraclePx` et `markPx` concernent les perps.
