# CoreInteractionHandler — Rôle Rebalancer et Sécurité

## Résumé
`CoreInteractionHandler.sol` gère les interactions avec Core (Hyperliquid): transferts USDC spot, ordres IOC BTC/HYPE, et rééquilibrage 50/50. Le rééquilibrage est désormais restreint à une adresse `rebalancer` définie par l'owner.

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
- `setRebalancer(address rebalancer)` (onlyOwner): définit l'adresse autorisée à appeler `rebalancePortfolio`.
- `rebalancePortfolio(uint128 cloidBtc, uint128 cloidHype)` (onlyRebalancer, whenNotPaused): calcule les deltas via l'oracle et place des ordres IOC pour revenir vers 50/50 (avec deadband).
- `executeDeposit(uint64 usdc1e8, bool forceRebalance)` (onlyVault, whenNotPaused): le handler attend des montants USDC en 1e8 (unités Core, alignées HyperCore/HyperEVM). Pas de conversion nécessaire pour les transferts ERC20.
- `pullFromCoreToEvm(uint64 usdc1e8)` (onlyVault, whenNotPaused): orchestre les ventes si nécessaire et crédite l'EVM; les montants restent en 1e8 pour les transferts ERC20.
- `sweepToVault(uint64 amount1e8)` (onlyVault, whenNotPaused): calcule les frais en 1e8, puis transfère en EVM en 1e8 vers le vault.
- `equitySpotUsd1e18()` (view): **CORRIGÉ** - Retourne l'équité totale des actifs spot en USD (format 1e18) avec conversion correcte weiDecimals
- `spotBalanceInWei(address, uint64)` (internal view): **NOUVEAU** - Convertit les balances spot de szDecimals vers weiDecimals
- `pause()` (onlyOwner): **NOUVEAU** - Met en pause toutes les opérations critiques
- `unpause()` (onlyOwner): **NOUVEAU** - Reprend toutes les opérations
- `emergencyPause()` (onlyOwner): **🚨 NOUVEAU** - Fonction d'urgence pour les situations critiques

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
  - Le code utilise `block.number` pour calculer les époques : `if (currentBlock - lastEpochStart >= epochLength)`
  - **Exemples de calcul** :
    - **HyperEVM (≈2 sec/bloc)** : 1 jour = 43200 blocs (86400 sec ÷ 2)
    - **Ethereum mainnet (≈12 sec/bloc)** : 1 jour = 7200 blocs (86400 sec ÷ 12)
    - **Polygon (≈2 sec/bloc)** : 1 jour = 43200 blocs
  - ⚠️ **Erreur critique** : Utiliser `86400` (valeur en secondes) créerait une epoch de 86400 blocs ≈ 12-20 jours selon la chaîne, affaiblissant drastiquement la protection de rate limiting !
- **`maxOutboundPerEpoch`** : Plafond de transferts USDC EVM→Core par epoch (en unités 1e8).
- **Réinitialisation** : Quand `epochLength` blocs sont écoulés, le compteur `sentThisEpoch` est remis à zéro.

### Lien USDC Core
- `setUsdcCoreLink(systemAddress, tokenId)`: `systemAddress` doit être non nul (`address(0)` interdit). `tokenId` peut valoir `0` et est accepté sans revert.

## Exemple de Configuration
```solidity
// Définir l’adresse rebalancer
handler.setRebalancer(0x1234...ABCD);

// Appeler le rééquilibrage (depuis l’adresse rebalancer)
handler.rebalancePortfolio(0, 0);
```

## Sécurité
- `onlyVault` protège les flux de fonds (débits/credits USDC).
- `onlyRebalancer` protège `rebalancePortfolio`.
- `_rebalance` est interne pour les appels intra-contrat (ex. `executeDeposit`).
- **NOUVEAU** : `whenNotPaused` protège toutes les opérations critiques contre les défaillances d'oracle
- **NOUVEAU** : Mécanisme de pause d'urgence pour arrêter immédiatement les opérations en cas de problème
- **🚨 CRITIQUE** : **Résistance à la manipulation temporelle** - Utilisation de `block.number` au lieu de `block.timestamp`
- **⚡ OPTIMISÉ** : **Rate limiting basé sur les blocs** - Époques calculées en blocs pour éviter la manipulation des validateurs

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

- Le `VaultContract` doit appeler `setHandler(handler)` après déploiement pour que l'approval USDC illimitée soit configurée côté vault.
- Le `VaultContract` transmet désormais directement les montants en 1e8 au handler (`executeDeposit`, `pullFromCoreToEvm`, `sweepToVault`). Plus aucune conversion 1e8↔1e6 n'est nécessaire.
