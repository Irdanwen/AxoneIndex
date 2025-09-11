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

## API Clés
- `setRebalancer(address rebalancer)` (onlyOwner): définit l'adresse autorisée à appeler `rebalancePortfolio`.
- `rebalancePortfolio(uint128 cloidBtc, uint128 cloidHype)` (onlyRebalancer, whenNotPaused): calcule les deltas via l'oracle et place des ordres IOC pour revenir vers 50/50 (avec deadband).
- `executeDeposit(uint64 usdc1e6, bool forceRebalance)` (onlyVault, whenNotPaused): le handler attend des montants USDC en 1e6 (unités Core). Il convertit en 1e8 (×100) pour le token EVM (HyperEVM à 8 décimales) avant de transférer.
- `pullFromCoreToEvm(uint64 usdc1e6)` (onlyVault, whenNotPaused): orchestre les ventes si nécessaire et crédite l'EVM; les montants 1e6 sont reconvertis en 1e8 (×100) pour les transferts ERC20.
- `sweepToVault(uint64 amount1e6)` (onlyVault, whenNotPaused): calcule les frais en 1e6, puis transfère en EVM en 1e8 (×100) vers le vault.
- `pause()` (onlyOwner): **NOUVEAU** - Met en pause toutes les opérations critiques
- `unpause()` (onlyOwner): **NOUVEAU** - Reprend toutes les opérations
- `emergencyPause()` (onlyOwner): **🚨 NOUVEAU** - Fonction d'urgence pour les situations critiques

## Événements
- `Rebalanced(int256 dBtc1e18, int256 dHype1e18)`
- `RebalancerSet(address rebalancer)`

## Paramètres et Contraintes
- `deadbandBps ≤ 50`.
- Garde oracle: `maxOracleDeviationBps` borne l’écart relatif par rapport au dernier prix.
- Limitation de débit par epoch via `maxOutboundPerEpoch` et `epochLength`.

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

## Intégration avec `VaultContract`

- Le `VaultContract` doit appeler `setHandler(handler)` après déploiement pour que l’approval USDC illimitée soit configurée côté vault.
- Le `VaultContract` convertit automatiquement ses montants internes en 1e6 (division par 100) lors des appels au handler (`executeDeposit`, `pullFromCoreToEvm`, `sweepToVault`). Le handler reconvertit en 1e8 (×100) pour les transferts EVM.
