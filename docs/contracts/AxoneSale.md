# AxoneSale — Vente publique d'AXN contre USDC

## Vue d'ensemble
`AxoneSale` permet l'achat de tokens AXN contre USDC avec un système de prix dynamique et une protection contre le slippage. Le contrat supporte la pause d'urgence, la fin manuelle de la vente et le retrait des AXN non vendus après la fin de la vente.

## 🔒 Améliorations de Sécurité

### Protection contre le MEV et le Slippage
- **Prix dynamique** : Le prix peut être mis à jour par l'owner pour s'adapter aux conditions du marché
- **Tolérance au slippage** : Limitation de l'augmentation du prix basée sur le temps écoulé
- **Protection progressive** : Le prix augmente graduellement selon le nombre de blocs écoulés
- **Configuration flexible** : `maxSlippageBps` configurable (maximum 10%)

- Token vendu: `AXN` (18 décimales)
- Token de paiement: `USDC` (8 décimales sur HyperEVM)
- Modèle: paiement USDC via `transferFrom`, envoi d'AXN en retour

## Paramètres et constantes principales
- `AXN_DECIMALS = 1e18`
- `USDC_DECIMALS = 1e8`
- `PRICE_PER_AXN_IN_USDC = USDC_DECIMALS / 10` → 0,1 USDC par 1 AXN (prix initial)
- `MIN_PURCHASE = 1000 * 1e18` → achat minimal 1000 AXN
- `saleCap = 50_000_000 * AXN_DECIMALS` → plafond global des ventes

### Nouveaux paramètres de sécurité
- `maxSlippageBps = 100` → tolérance au slippage de 1% par défaut
- `lastPricePerAxn` → dernier prix configuré par l'owner
- `lastPriceUpdateBlock` → bloc de la dernière mise à jour du prix

## Calcul des montants (décimales corrigées)
Pour un achat de `axnAmount` (18 décimales), le montant en USDC est calculé en 8 décimales:

```
usdcAmount = (axnAmount * currentPrice) / AXN_DECIMALS
```

Où `currentPrice` est déterminé par `_getCurrentPrice()` avec protection contre le slippage.

### Logique de prix dynamique
- Si le prix a été mis à jour dans le même bloc → utilise le nouveau prix
- Sinon → applique une augmentation progressive basée sur les blocs écoulés
- Maximum d'augmentation : `maxSlippageBps` (par défaut 1%)

Exemple: pour `axnAmount = 1e18` (1 AXN) avec prix initial
- `PRICE_PER_AXN_IN_USDC = 10_000_000` (0,1 USDC en 8 décimales)
- `usdcAmount = (1e18 * 10_000_000) / 1e18 = 10_000_000` (soit 0,1 USDC)

## Fonctions (vue d’ensemble)
| Nom | Signature | Visibilité | Mutabilité | Accès |
|-----|-----------|------------|-----------|-------|
| buyWithUSDC | `buyWithUSDC(uint256 axnAmount)` | external | whenNotPaused nonReentrant | - |
| endSale | `endSale()` | external | - | onlyOwner |
| setTreasury | `setTreasury(address _treasury)` | external | - | onlyOwner |
| updatePrice | `updatePrice(uint256 newPricePerAxn)` | external | - | onlyOwner |
| setMaxSlippageBps | `setMaxSlippageBps(uint256 _maxSlippageBps)` | external | - | onlyOwner |
| withdrawUnsoldTokens | `withdrawUnsoldTokens(address to)` | external | - | onlyOwner |
| remainingTokens | `remainingTokens()` → `uint256` | public view | view | - |
| isSaleActive | `isSaleActive()` → `bool` | public view | view | - |
| getCurrentPrice | `getCurrentPrice()` → `uint256` | external view | view | - |
| getPriceInfo | `getPriceInfo()` → `(uint256 currentPrice, uint256 lastPrice, uint256 lastUpdateBlock, uint256 maxSlippage)` | external view | view | - |
| emergencyPause | `emergencyPause()` | external | - | onlyOwner |
| emergencyUnpause | `emergencyUnpause()` | external | - | onlyOwner |

## Flux d'achat (`buyWithUSDC`)
1. Vérifications: vente active, trésorerie définie, minimum d'achat, plafond, solde AXN suffisant
2. Calcul `usdcAmount` (voir ci-dessus)
3. `transferFrom(buyer → treasury, usdcAmount)` sur USDC
4. `transfer(contract → buyer, axnAmount)` sur AXN
5. Mise à jour `totalSold` et éventuelle fin automatique (`saleEnded = true`) si le plafond est atteint

## Rôles et permissions
- `owner` (hérité d'`Ownable`):
  - `endSale()` termine la vente de façon irréversible
  - `setTreasury(address)` met à jour l'adresse de trésorerie
  - `withdrawUnsoldTokens(address)` retire les AXN non vendus après la fin de la vente
  - `emergencyPause()` / `emergencyUnpause()` pour pause d'urgence
  - **NOUVEAU** : `updatePrice(uint256 newPricePerAxn)` met à jour le prix de vente
  - **NOUVEAU** : `setMaxSlippageBps(uint256 maxSlippageBps)` configure la tolérance au slippage

## Événements
- `TokensPurchased(address buyer, uint256 axnAmount, uint256 usdcAmount)`
- `TreasuryUpdated(address newTreasury)`
- `SaleEnded()`
- `UnsoldTokensWithdrawn(uint256 amount)`
- **NOUVEAU** : `SlippageToleranceUpdated(uint256 newMaxSlippageBps)`
- **NOUVEAU** : `PriceUpdated(uint256 newPrice, uint256 blockNumber)`

## États et getters
- `totalSold` — total d'AXN vendus (18 décimales)
- `saleCap` — plafond global des ventes (18 décimales)
- `saleEnded` — statut de fin de vente
- `remainingTokens()` — `saleCap - totalSold`
- `isSaleActive()` — `!saleEnded && axnToken.balanceOf(this) > 0 && !paused()`
- **NOUVEAU** : `getCurrentPrice()` — prix actuel avec protection contre le slippage
- **NOUVEAU** : `getPriceInfo()` — informations complètes sur le prix (actuel, dernier, bloc, slippage)

## Sécurité
- Pull pattern sur USDC (on prélève d'abord l'USDC, puis on envoie l'AXN)
- `nonReentrant` pour prévenir les réentrances
- `Pausable` pour désactiver les achats en cas d'urgence
- Rejets explicites de ETH via `fallback/receive`
- **NOUVEAU** : Protection contre le MEV via système de prix dynamique
- **NOUVEAU** : Limitation du slippage pour éviter les manipulations de prix
- **NOUVEAU** : Augmentation progressive du prix basée sur le temps écoulé

## Intégration côté client
- L'acheteur doit pré-approuver le contrat de vente sur le token USDC pour le montant `usdcAmount`
- Appeler ensuite `buyWithUSDC(axnAmount)`

## Changements récents
- Correction critique des décimales USDC: `USDC_DECIMALS` passe à 1e8 et normalisation du prix en 8 décimales
- Mise à jour de `PRICE_PER_AXN_IN_USDC` pour représenter 0,1 USDC correctement
- **NOUVEAU** : Système de prix dynamique avec protection contre le slippage
- **NOUVEAU** : Protection contre les attaques MEV via limitation progressive du prix
- **NOUVEAU** : Fonctions de gestion du prix et de la tolérance au slippage
