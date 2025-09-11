# RewardsHub - Système de Staking Modulaire

## Vue d'ensemble

Le `RewardsHub` est le contrat central du système de staking d'Axone. Il permet aux utilisateurs de staker les **shares** (parts) des différents vaults et de recevoir des récompenses en **AxoneToken (AXN)** selon une architecture de type MasterChef mono-reward.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  VaultContract  │    │   RewardsHub     │    │EmissionController│
│   (Shares)      │───▶│  (Staking)       │◀───│   (Rewards)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   AxoneToken     │
                       │     (AXN)        │
                       └──────────────────┘
```

## Composants

### 1. RewardsHub.sol
- **Rôle** : Contrat central de staking des shares des vaults
- **Fonctionnalités** :
  - Pools dynamiques de staking
  - Distribution de récompenses AXN
  - Gestion des points d'allocation
  - Système de récompenses en attente

### 2. EmissionController.sol
- **Rôle** : Contrôle l'émission des tokens de récompense
- **Fonctionnalités** :
  - Débit de récompense par seconde
  - Mode mint ou drip
  - Gestion des timestamps

### 3. VaultContract.sol
- **Rôle** : Vault ERC4626-like avec shares stakables
- **Fonctionnalités** :
  - Shares à 18 décimales (uniformisation)
  - Compatible avec assets 6/8/18 décimales
  - Gestion des frais et NAV

## Déploiement et Configuration

### 1. Ordre de déploiement

```solidity
// 1. Déployer AxoneToken
AxoneToken axoneToken = new AxoneToken(
    initialRecipient,
    inflationRecipient,
    owner
);

// 2. Déployer EmissionController
EmissionController controller = new EmissionController(
    address(axoneToken),
    rewardPerSecond,  // ex: 1e18 (1 AXN par seconde)
    true              // mode mint
);

// 3. Déployer RewardsHub
RewardsHub rewardsHub = new RewardsHub(address(controller));

// 4. Configurer les autorisations
controller.setRewardsHub(address(rewardsHub));
```

### 2. Configuration des pools

```solidity
// Ajouter un pool pour un vault
rewardsHub.addPool(
    vaultContract,  // Adresse du VaultContract
    1000           // Points d'allocation (ex: 1000 = 10% si total = 10000)
);

// Ajuster les points d'allocation
rewardsHub.setAllocPoint(0, 1500); // Pool 0 passe à 1500 points
```

## Utilisation

### Pour les utilisateurs

#### 1. Dépôt (Staking)
```solidity
// 1. D'abord, déposer dans le vault pour obtenir des shares
vault.deposit(amount1e8); // Dépôt en USDC (8 décimales)

// 2. Ensuite, staker les shares dans le RewardsHub
uint256 shares = vault.balanceOf(user);
vault.approve(address(rewardsHub), shares);
rewardsHub.deposit(poolId, shares);
```

#### 2. Récolte des récompenses
```solidity
// Récolter sans retirer de shares
rewardsHub.harvest(poolId, user);

// Ou retirer et récolter automatiquement
rewardsHub.withdraw(poolId, amount);
```

#### 3. Retrait d'urgence
```solidity
// Retrait immédiat sans récolte (perte des récompenses)
rewardsHub.emergencyWithdraw(poolId);
```

### Pour les administrateurs

#### 1. Gestion des pools
```solidity
// Ajouter un nouveau pool
rewardsHub.addPool(newVault, allocPoints);

// Modifier l'allocation d'un pool
rewardsHub.setAllocPoint(poolId, newAllocPoints);

// Mettre à jour tous les pools (avant modifications importantes)
rewardsHub.massUpdatePools();
```

#### 2. Gestion des récompenses
```solidity
// Modifier le débit de récompense
controller.setRewardPerSecond(newRate);

// Basculer entre mode mint et drip
controller.toggleMintMode(true); // true = mint, false = drip
```

#### 3. Sécurité
```solidity
// Pause d'urgence
rewardsHub.pause();
controller.pause();

// Reprise
rewardsHub.unpause();
controller.unpause();
```

## Gestion des Décimales

### Principe
- **Shares** : Toujours à **18 décimales** (uniformisation)
- **Assets** : Peuvent être à 6, 8 ou 18 décimales
- **Conversion** : Gérée par ERC4626 dans le VaultContract

### Exemples

#### USDC (8 décimales)
```solidity
// Dépôt de 100 USDC (100 * 1e8)
vault.deposit(100 * 1e8);
// → Mint de shares à 18 décimales
// → Conversion automatique 8→18 décimales
```

#### Token 18 décimales
```solidity
// Dépôt de 100 tokens (100 * 1e18)
vault.deposit(100 * 1e18);
// → Mint de shares à 18 décimales
// → Conversion 1:1
```

## Événements (Compat Hyperscan)

### RewardsHub
- `PoolAdded(uint256 indexed pid, address indexed stakeToken, uint128 allocPoint)`
- `PoolUpdated(uint256 indexed pid, uint128 oldAlloc, uint128 newAlloc)`
- `Deposit(address indexed user, uint256 indexed pid, uint256 amount)`
- `Withdraw(address indexed user, uint256 indexed pid, uint256 amount)`
- `Harvest(address indexed user, uint256 indexed pid, uint256 amount)`
- `EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount)`

### EmissionController
- `RewardsHubSet(address indexed hub)`
- `RewardPerSecondSet(uint256 oldR, uint256 newR)`
- `Pulled(address indexed to, uint256 amount, uint64 fromTs, uint64 toTs)`
- `MintModeToggled(bool isMint)`

## Sécurité

### Mesures implémentées
- **ReentrancyGuard** : Protection contre les attaques de réentrance
- **Ownable2Step** : Transfert de propriété en 2 étapes
- **Pausable** : Arrêt d'urgence possible
- **SafeERC20** : Transferts sécurisés
- **Vérifications** : Validation des paramètres et autorisations

### Bonnes pratiques
1. **Toujours** appeler `massUpdatePools()` avant modifications importantes
2. **Vérifier** les autorisations avant déploiement
3. **Tester** avec différents types de tokens (6/8/18 décimales)
4. **Monitorer** les événements pour détecter les anomalies

## Tests

### Scénarios critiques
1. **Cycle complet** : `deposit → stake → harvest → unstake → redeem`
2. **Assets hétérogènes** : Tester avec USDC (8), USDT (6), ETH (18)
3. **Gestion des erreurs** : Pause, retrait d'urgence, récupération
4. **Précision** : Vérifier les calculs de récompenses sur de longues périodes

### Exemple de test
```javascript
// Test d'isomorphisme avec USDC (8 décimales)
const depositAmount = 100 * 1e8; // 100 USDC
await vault.deposit(depositAmount);
const shares = await vault.balanceOf(user);

await vault.approve(rewardsHub.address, shares);
await rewardsHub.deposit(0, shares);

// Attendre et récolter
await time.increase(3600); // 1 heure
await rewardsHub.harvest(0, user);

// Retirer et vérifier
await rewardsHub.withdraw(0, shares);
await vault.withdraw(shares);
```

## Maintenance

### Surveillance
- **Balance du contrat** : Vérifier que le RewardsHub a suffisamment d'AXN
- **Pools actifs** : Monitorer les dépôts/retraits
- **Performance** : Vérifier les calculs de récompenses

### Mises à jour
- **Nouveaux vaults** : Ajouter via `addPool()`
- **Réajustement** : Modifier les `allocPoint` selon les besoins
- **Migration** : Prévoir des mécanismes de migration si nécessaire

## Support

Pour toute question ou problème :
1. Vérifier les événements émis
2. Contrôler les autorisations et balances
3. Consulter la documentation des contrats liés
4. Tester en environnement de développement avant production


