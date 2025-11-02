# AxoneToken (AXN) — ERC20 avec inflation journalière et supply circulante

## Présentation
`AxoneToken` est un ERC20 étendu (burnable, permit) avec:
- Inflation « journalière » proportionnelle au temps écoulé
- Liste d'adresses exclues de la supply circulante (trésorerie, vesting, burn)
- Pause des transferts et de la frappe d’inflation

## Éléments clés
- Héritage: `ERC20Burnable`, `ERC20Permit`, `Pausable`, `Ownable`, `ReentrancyGuard`
- `INITIAL_SUPPLY = 100,000,000 * 1e18` (mint au déploiement vers `initialRecipient`)
- Inflation basée sur le temps: `ANNUAL_INFLATION_BASIS_POINTS = 300` (3%/an)
- `mintInflation()` frappe vers `inflationRecipient`

## Événements
- `DailyInflationMinted(uint256 amountMinted, uint256 timestamp, uint256 timeElapsed)`
- `InflationRecipientChanged(address indexed oldRecipient, address indexed newRecipient)`
- `InflationIntervalChanged(uint256 oldInterval, uint256 newInterval)`
- `ExcludedFromCirculating(address indexed account, bool isExcluded)`

## Fonctions (vue d’ensemble)
| Nom | Signature | Visibilité | Mutabilité | Accès | Notes |
|-----|-----------|------------|-----------|-------|-------|
| mint | `mint(address to, uint256 amount)` | external | - | onlyOwner | frappe arbitraire (EmissionController) |
| mintInflation | `mintInflation()` | external | whenNotPaused nonReentrant | - | frappe selon temps écoulé |
| setInflationRecipient | `setInflationRecipient(address)` | external | - | onlyOwner | maj destinataire |
| setInflationInterval | `setInflationInterval(uint256)` | external | - | onlyOwner | min 1 heure |
| nextMintTimestamp | `nextMintTimestamp()` → `uint256` | external view | view | - | `lastMintTimestamp + interval` |
| circulatingSupply | `circulatingSupply()` → `uint256` | public view | view | - | `totalSupply - totalExcludedBalance` |
| setExcludedFromCirculating | `setExcludedFromCirculating(address,bool)` | external | - | onlyOwner | wrap interne |
| isAddressExcludedFromCirculating | `isAddressExcludedFromCirculating(address)` → `bool` | external view | view | - | - |
| getExcludedAddresses | `getExcludedAddresses()` → `address[]` | external view | view | - | - |
| excludedBalances | `excludedBalances(address)` → `uint256` | public view | view | - | getter mapping |
| pause/unpause | `pause()` / `unpause()` | external | - | onlyOwner | arrête transferts et inflation |
| rescueTokens | `rescueTokens(address token, uint256 amount, address to)` | external | - | onlyOwner | sauf AXN |
| renounceOwnership | `renounceOwnership()` | external | - | onlyOwner | héritée |

## Détails des fonctions
### mint(address to, uint256 amount)
- Description: Frappe de tokens par l’owner (utilisé par EmissionController en mode mint).
- Reverts: `Zero address` si `to == address(0)`
- Effets: met à jour les soldes exclus si `to` est exclu.

### mintInflation()
- Description: Frappe un montant calculé proportionnellement au temps depuis `lastMintTimestamp`.
- Conditions: `block.timestamp ≥ lastMintTimestamp + inflationInterval`; `whenNotPaused`; `nonReentrant`.
- Formule: `(circulatingSupply * ANNUAL_INFLATION_BPS * timeElapsed) / (SECONDS_IN_YEAR * 10000)`
- Émet: `DailyInflationMinted`.

### setInflationRecipient(address newRecipient)
- Description: Met à jour le destinataire de l’inflation.
- Reverts: `Zero address`.

### setInflationInterval(uint256 newInterval)
- Description: Met à jour l’intervalle minimal entre deux mint d’inflation.
- Reverts: `Too short` si `< MIN_INTERVAL` (1 heure).

### nextMintTimestamp() → uint256
- Description: Retourne `lastMintTimestamp + inflationInterval`.

### circulatingSupply() → uint256
- Description: `totalSupply - totalExcludedBalance` (tracking optimisé).

### setExcludedFromCirculating(address account, bool excluded)
- Description: Exclut/ré‑inclut `account` du calcul circulant; met à jour les soldes exclus et la somme totale.

### isAddressExcludedFromCirculating(address account) → bool
- Description: Statut d’exclusion.

### getExcludedAddresses() → address[]
- Description: Liste courante des adresses exclues.

### pause() / unpause()
- Description: Pause d’urgence affectant `_update` (transferts) et `mintInflation`.

### rescueTokens(address token, uint256 amount, address to)
- Description: Récupération d’urgence (interdit pour AXN lui‑même).

## Notes d’implémentation
- `_update(...)` est surchargée pour refuser les transferts quand `paused()` et maintenir `excludedBalances`/`totalExcludedBalance`.
- Le burn (`to == address(0)`) ajuste le total exclu si l’expéditeur était exclu.

## Exemples (ethers.js)
```ts
import { ethers } from "ethers";
const axn = new ethers.Contract(addr, abi, signer);

// Mint par l’owner
await axn.mint(treasury, ethers.parseUnits("1000", 18));

// Inflation (si intervalle respecté)
await axn.mintInflation();

// Exclure une adresse de la supply circulante
await axn.setExcludedFromCirculating(vault, true);

// Lire la supply circulante
const circ = await axn.circulatingSupply();
```

