# AxoneSale — Vente publique d'AXN contre USDC

## Vue d'ensemble
`AxoneSale` permet l'achat de tokens AXN contre USDC avec un prix fixe et un plafond de vente. Le contrat supporte la pause d'urgence, la fin manuelle de la vente et le retrait des AXN non vendus après la fin de la vente.

- Token vendu: `AXN` (18 décimales)
- Token de paiement: `USDC` (6 décimales)
- Modèle: paiement USDC via `transferFrom`, envoi d'AXN en retour

## Paramètres et constantes principales
- `AXN_DECIMALS = 1e18`
- `USDC_DECIMALS = 1e6`
- `PRICE_PER_AXN_IN_USDC = USDC_DECIMALS / 10` → 0,1 USDC par 1 AXN
- `MIN_PURCHASE = 1000 * 1e18` → achat minimal 1000 AXN
- `saleCap = 50_000_000 * AXN_DECIMALS` → plafond global des ventes

## Calcul des montants (décimales corrigées)
Pour un achat de `axnAmount` (18 décimales), le montant en USDC est calculé en 6 décimales:

```
usdcAmount = (axnAmount * PRICE_PER_AXN_IN_USDC) / AXN_DECIMALS
```

Exemple: pour `axnAmount = 1e18` (1 AXN)
- `PRICE_PER_AXN_IN_USDC = 100_000` (0,1 USDC en 6 décimales)
- `usdcAmount = (1e18 * 100_000) / 1e18 = 100_000` (soit 0,1 USDC)

Cette formulation évite la surcharge due au mélange des décimales 18 (AXN) vs 6 (USDC).

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

## Événements
- `TokensPurchased(address buyer, uint256 axnAmount, uint256 usdcAmount)`
- `TreasuryUpdated(address newTreasury)`
- `SaleEnded()`
- `UnsoldTokensWithdrawn(uint256 amount)`

## États et getters
- `totalSold` — total d'AXN vendus (18 décimales)
- `saleCap` — plafond global des ventes (18 décimales)
- `saleEnded` — statut de fin de vente
- `remainingTokens()` — `saleCap - totalSold`
- `isSaleActive()` — `!saleEnded && axnToken.balanceOf(this) > 0 && !paused()`

## Sécurité
- Pull pattern sur USDC (on prélève d'abord l'USDC, puis on envoie l'AXN)
- `nonReentrant` pour prévenir les réentrances
- `Pausable` pour désactiver les achats en cas d'urgence
- Rejets explicites de ETH via `fallback/receive`

## Intégration côté client
- L'acheteur doit pré-approuver le contrat de vente sur le token USDC pour le montant `usdcAmount`
- Appeler ensuite `buyWithUSDC(axnAmount)`

## Changements récents
- Correction critique des décimales USDC: introduction de `USDC_DECIMALS` et normalisation du prix en 6 décimales
- Mise à jour de `PRICE_PER_AXN_IN_USDC` pour représenter 0,1 USDC correctement
