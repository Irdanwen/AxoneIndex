# RewardsHub — Staking de shares (MasterChef mono‑reward)

## Présentation
`RewardsHub` permet de staker les parts (`shares`) de vaults et distribue un token de récompense (AXN) fourni par `EmissionController`. Architecture de type MasterChef mono‑reward.

## Éléments clés
- Héritage: `Ownable2Step`, `Pausable`, `ReentrancyGuard`
- Précision d’accumulation: `ACC_PRECISION = 1e12`
- Rewarder optionnel par pool (bonus)

## Événements
- `PoolAdded(uint256 indexed pid, address indexed stakeToken, uint128 allocPoint)`
- `PoolUpdated(uint256 indexed pid, uint128 oldAlloc, uint128 newAlloc)`
- `Deposit(address indexed user, uint256 indexed pid, uint256 amount)`
- `Withdraw(address indexed user, uint256 indexed pid, uint256 amount)`
- `Harvest(address indexed user, uint256 indexed pid, uint256 amount)`
- `EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount)`
- `ControllerSet(address indexed oldC, address indexed newC)`
- `PoolRewarderSet(uint256 indexed pid, address indexed rewarder)`

## Fonctions (vue d’ensemble)
| Nom | Signature | Visibilité | Mutabilité | Accès |
|-----|-----------|------------|-----------|-------|
| poolLength | `poolLength()` → `uint256` | external view | view | - |
| addPool | `addPool(IERC20 stakeToken, uint128 allocPoint)` | external | - | onlyOwner |
| setAllocPoint | `setAllocPoint(uint256 pid, uint128 newAllocPoint)` | external | - | onlyOwner |
| setPoolRewarder | `setPoolRewarder(uint256 pid, IRewarder rewarder)` | external | - | onlyOwner |
| setController | `setController(IEmissionController newController)` | external | - | onlyOwner |
| massUpdatePools | `massUpdatePools()` | public | - | - |
| updatePool | `updatePool(uint256 pid)` | public | - | - |
| pendingReward | `pendingReward(uint256 pid, address user)` → `uint256` | external view | view | - |
| deposit | `deposit(uint256 pid, uint256 amount)` | external | nonReentrant whenNotPaused | - |
| withdraw | `withdraw(uint256 pid, uint256 amount)` | external | nonReentrant whenNotPaused | - |
| harvest | `harvest(uint256 pid, address to)` | external | nonReentrant whenNotPaused | - |
| emergencyWithdraw | `emergencyWithdraw(uint256 pid)` | external | nonReentrant | - |
| pause/unpause | `pause()` / `unpause()` | external | - | onlyOwner |
| emergencyTokenRecovery | `emergencyTokenRecovery(IERC20 token, uint256 amount, address to)` | external | - | onlyOwner |
| poolRewarders | `poolRewarders(uint256)` → `address` | public view | view | - |

## Détails essentiels
- Les récompenses sont accrues par pool au fil du temps: `elapsed * controller.rewardPerSecond() * allocPoint / totalAllocPoint`.
- `pull()` est appelé sur `EmissionController` lors des updates pour transférer/mint les récompenses.
- Les variables utilisateur: `amount` staké et `rewardDebt` pour calcul précis.

## Exemples (ethers.js)
```ts
const hub = new ethers.Contract(hubAddr, hubAbi, signer);
await hub.addPool(vaultAddr, 1000);
await hub.deposit(0, shares);
await hub.harvest(0, user);
await hub.withdraw(0, shares);
```

