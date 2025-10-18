# CoreInteractionHandler — Rôle Rebalancer et Sécurité

## Résumé
- `CoreInteractionHandler.sol` gère les interactions avec Core (Hyperliquid): transferts USDC/HYPE spot, ordres IOC BTC/HYPE, et rééquilibrage 50/50. Le rééquilibrage est désormais restreint à une adresse `rebalancer` définie par l'owner. Pour HYPE50 Defensive, HYPE est traité comme le jeton de gaz natif: les dépôts se font en natif (payable), sont convertis 100% en USDC côté Core, puis alloués 50/50.

## 🔒 Améliorations de Sécurité

### Mécanisme de Pause d'Urgence
- **Héritage de Pausable** : Le contrat utilise maintenant `Pausable` d'OpenZeppelin
- **Protection des fonctions critiques** : Toutes les opérations principales sont protégées par `whenNotPaused`
- **Contrôle d'urgence** : `pause()` et `unpause()` permettent d'arrêter immédiatement les opérations
- **🚨 NOUVEAU** : **Fonction d'urgence** : `emergencyPause()` pour les situations critiques
- **Protection contre les défaillances d'oracle** : Pause disponible en cas de manipulation ou de défaillance

### Corrections Implémentées
- **Optimisation du rate limiting** : Sortie précoce si `amount1e6 == 0` dans `_rateLimit()`
- **Période de grâce pour l'oracle** : Initialisation progressive de l'oracle sans blocage initial
- **⚡ OPTIMISATION CRITIQUE** : **Migration vers block.number** - Remplacement de `block.timestamp` par `block.number` pour éviter la manipulation des validateurs
- **🔒 SÉCURITÉ RENFORCÉE** : **Rate limiting basé sur les blocs** - Utilisation de `block.number` pour les époques au lieu de timestamps manipulables
- **🐛 CORRECTION CRITIQUE** : **Fix fonction _toSz1e8** - Correction de la division par 1e10 en division par 100 pour respecter la formule `size1e8 = usd1e18 / price1e8 / 100`. Cette correction multiplie par 100 les quantités d'ordres (dépôts, rebalancement, ventes) pour correspondre aux montants réels d'investissement.
- **💰 CORRECTION AUDIT** : **Valorisation correcte des soldes spot** - Implémentation de `spotBalanceInWei()` pour convertir les balances de `szDecimals` vers `weiDecimals` avant calcul de la valeur USD. Correction appliquée dans `equitySpotUsd1e18()` et `_computeRebalanceDeltas()` pour éviter la surévaluation/sous-évaluation des actifs.

## API Clés
- `receive()` (payable): permet de recevoir le jeton natif HYPE en provenance du Core si nécessaire.
- `setRebalancer(address rebalancer)` (onlyOwner): définit l'adresse autorisée à appeler `rebalancePortfolio`.
- `rebalancePortfolio(uint128 cloidBtc, uint128 cloidHype)` (onlyRebalancer, whenNotPaused): calcule les deltas via l'oracle et place des ordres IOC pour revenir vers 50/50 (avec deadband).
- `executeDeposit(uint64 usdc1e8, bool forceRebalance)` (onlyVault, whenNotPaused): dépôt USDC → achats 50/50 BTC/HYPE.
- `pullFromCoreToEvm(uint64 usdc1e8)` (onlyVault, whenNotPaused): orchestre les ventes si nécessaire et crédite l'EVM en USDC.
- `sweepToVault(uint64 amount1e8)` (onlyVault, whenNotPaused): calcule les frais en 1e8, puis transfère en EVM en 1e8 vers le vault.
- `executeDepositHype(bool forceRebalance)` (payable, onlyVault, whenNotPaused): dépôt HYPE natif (`msg.value`) → envoi natif vers `hypeCoreSystemAddress` → vente 100% en USDC → achats ~50% BTC et ~50% HYPE. Le rate limit s'applique sur l'équivalent USD (1e8).
- `pullHypeFromCoreToEvm(uint64 hype1e8)` (onlyVault, whenNotPaused): achète du HYPE si nécessaire puis crédite l'EVM en HYPE.
- `sweepHypeToVault(uint256 amount1e18)` (onlyVault, whenNotPaused): calcule les frais en HYPE (1e18), puis transfère le net vers le vault.

## Événements
- `Rebalanced(int256 dBtc1e18, int256 dHype1e18)`
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

## Gestion des Décimales (szDecimals vs weiDecimals)

### 🔍 Distinction Critique

Le contrat gère deux types de décimales pour les tokens HyperLiquid :

1. **szDecimals** : Format utilisé pour les opérations de trading (ordres, transfers)
   - Utilisé par `SpotBalance.total` (retourné par le precompile)
   - Utilisé pour les montants dans `encodeLimitOrder()` et `encodeSpotSend()`
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
| `executeDeposit()` | szDecimals (via `spotBalance()`) | Trading/Transfers |
| `pullFromCoreToEvm()` | szDecimals (via `spotBalance()`) | Trading/Transfers |
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
