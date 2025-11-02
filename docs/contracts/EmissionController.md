# EmissionController — Émission de récompenses (mint ou drip)

## Présentation
`EmissionController` contrôle le débit d’émission d’un token de récompense vers un `RewardsHub` en mode mint (via `IMintable`) ou drip (transfert depuis réserve).

## Éléments clés
- Héritage: `Ownable2Step`, `Pausable`
- `rewardToken` immutable
- `rewardsHub` configuré une seule fois
- `rewardPerSecond` paramétrable
- `isMintMode` (true = mint, false = drip)

## Événements
- `RewardsHubSet(address indexed hub)`
- `RewardPerSecondSet(uint256 oldR, uint256 newR)`
- `Pulled(address indexed to, uint256 amount, uint64 fromTs, uint64 toTs)`
- `MintModeToggled(bool isMint)`

## Fonctions (vue d’ensemble)
| Nom | Signature | Visibilité | Mutabilité | Accès |
|-----|-----------|------------|-----------|-------|
| setRewardsHub | `setRewardsHub(address hub)` | external | - | onlyOwner (une fois) |
| setRewardPerSecond | `setRewardPerSecond(uint256 newR)` | external | - | onlyOwner |
| toggleMintMode | `toggleMintMode(bool on)` | external | - | onlyOwner |
| pause/unpause | `pause()` / `unpause()` | external | - | onlyOwner |
| pendingEmission | `pendingEmission()` → `uint256` | public view | view | - |
| pull | `pull()` → `uint256` | external whenNotPaused | - | onlyRewardsHub |

## Détails essentiels
- `pendingEmission = (block.timestamp - lastPullTime) * rewardPerSecond`.
- `pull()` met à jour `lastPullTime` et effectue:
  - Mint vers `rewardsHub` via `IMintable(rewardToken).mint(...)` si `isMintMode`.
  - Sinon, transfert ERC20 depuis les réserves du contrôleur.

## Exemples (ethers.js)
```ts
const ctrl = new ethers.Contract(ctrlAddr, ctrlAbi, signer);
await ctrl.setRewardsHub(hubAddr);
await ctrl.setRewardPerSecond(ethers.parseUnits("1", 18));
await ctrl.toggleMintMode(true);
```

