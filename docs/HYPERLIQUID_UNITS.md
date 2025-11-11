# Hyperliquid — Unités et conversions (SPOT)

Ce document synthétise les unités attendues par Hyperliquid pour les opérations SPOT (ordres, soldes, prix), ainsi que les conversions implémentées dans `STRATEGY_1`.

## Références officielles
- Notation (Px, Sz, TIF, Asset): [`hyperliquid-docs/for-developers/api/notation`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/notation)
- Asset IDs (spot offset 10000): [`hyperliquid-docs/for-developers/api/asset-ids`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/asset-ids)
- Tick & lot size (szDecimals, règles décimales Px/Sz): [`hyperliquid-docs/for-developers/api/tick-and-lot-size`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size)
- Info endpoint (meta: `spotInfo`, `tokenInfo`): [`hyperliquid-docs/for-developers/api/info-endpoint`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint) et [`/spot`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/spot)
- Exchange endpoint (soumission d’ordres): [`hyperliquid-docs/for-developers/api/exchange-endpoint`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint)
- Signing, Nonces, erreurs, limites, timings, HyperCore/EVM: 
  - [`nonces-and-api-wallets`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets)
  - [`error-responses`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/error-responses)
  - [`signing`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/signing)
  - [`rate-limits-and-user-limits`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/rate-limits-and-user-limits)
  - [`activation-gas-fee`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/activation-gas-fee)
  - [`optimizing-latency`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/optimizing-latency)
  - [`bridge2`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/bridge2)
  - [`deploying-hip-1-and-hip-2-assets`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/deploying-hip-1-and-hip-2-assets)
  - [`hip-3-deployer-actions`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/hip-3-deployer-actions)
  - [`interacting-with-hypercore`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/interacting-with-hypercore)
  - [`hypercore-<>-hyperevm-transfers`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/hypercore-less-than-greater-than-hyperevm-transfers)
  - [`interaction-timings`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/interaction-timings)

---

## Unités principales
- **Sz (size)**: exprimée en unités de coin (base), arrondies à `szDecimals` de l’actif. Voir tick/lot size.
- **Px (price)**: prix déterminé avec contrainte de chiffres significatifs et de décimales max (voir tick/lot size). Dans nos contrats, les prix oracles sont normalisés en 1e8.
- **Asset (spot)**: `assetId = 10000 + spotIndex` (offset de 10000 pour spot).
- **TIF**: `IOC` (Immediate-Or-Cancel) pour simuler des ordres « marketables ».

Hyperliquid impose des bornes: 
- `sz` doit respecter `szDecimals` de l’actif (lot size).
- `px` doit respecter les contraintes de décimales et de significatifs (tick size). 
Voir: [`tick-and-lot-size`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size).

---

## Métadonnées utilisées
- `spotInfo(spotIndex)` → contient `tokens[0]` (base) et `tokens[1]` (quote).
- `tokenInfo(tokenId)` → fournit `szDecimals`, `weiDecimals` et autres champs.
- `spotPx(spotIndex)` → prix spot brut (décimales variables selon l’actif).
- `bbo(assetId)` → meilleur bid/ask brut pour `assetId = spotIndex + 10000`.
- `spotBalance(user, tokenId)` → solde spot brut en `szDecimals` pour ce `tokenId`.

---

## Normalisation du prix (vers 1e8)
Les précompilés renvoient un Px brut dont l’échelle varie par actif. Désormais, la normalisation en 1e8 utilise la précision prix propre au marché (`pxDecimals`) lue depuis le métadata (stockée on-chain côté handler):

```
// px1e8 = rawPx * 10^(8 - pxDecimals), avec garde pour pxDecimals > 8
if pxDecimals == 8:  px1e8 = rawPx
if pxDecimals < 8:   px1e8 = rawPx * 10^(8 - pxDecimals)
if pxDecimals > 8:   px1e8 = rawPx / 10^(pxDecimals - 8)
```

Conséquence: tous les actifs spot sont ramenés à une base commune (1e8), en respectant exactement la précision de prix du marché (HIP-1/HIP-3 compatibles).

Implémentations:
- `CoreInteractionHandler._spotPxDecimals()` (mapping on-chain), `_toPx1e8()`, `_toRawPx()`
- `_spotBboPx1e8()`/`spotOraclePx1e8()` utilisent `_toPx1e8()`
- `_validatedOraclePx1e8()`/_`_tryValidatedOraclePx1e8()` normalisent avant validations de déviation

---

## Conversion des soldes (szDecimals → weiDecimals)
Les soldes de `spotBalance` sont en `szDecimals`. Pour valoriser en USD 1e18, on convertit d’abord en `weiDecimals`:

```
if weiDecimals > szDecimals: totalWei = totalSz * 10^(weiDecimals - szDecimals)
if weiDecimals < szDecimals: totalWei = totalSz / 10^(szDecimals - weiDecimals)
```

Implémentation: `CoreHandlerLib.spotBalanceInWei()` (utilisé par le handler).

---

## Conversion USD1e18 → taille base (szDecimals)
Pour convertir un notional USD 1e18 en taille base respectant `szDecimals` (en utilisant un prix normalisé 1e8):

```
// tailleBase(szDecimals) = (USD1e18 / px1e8) * 10^(szDecimals-8)
numerator = USD1e18 * 10^szDecimals
denom     = px1e8 * 1e10     // IMPORTANT (et non 1e8)
sizeSz    = numerator / denom
```

Implémentation: `CoreHandlerLib.toSzInSzDecimals()`. Cette version corrige un ancien facteur ×100.

---

## Encodage des ordres SPOT et envois
- `assetId` utilisé pour le carnet/BBO et la soumission d’ordres: `assetId = 10000 + spotIndex`
- `encodeSpotLimitOrder(assetId, isBuy, limitPxRaw, szInSzDecimals, reduceOnly, encodedTif, cloid)`
  - `limitPxRaw` est en décimales « natives » du marché (avant normalisation). Nous partons d’un `limitPx1e8` puis re‑replions via `_toRawPx()`.
  - `szInSzDecimals` est en `szDecimals` de l’actif base.
  - `reduceOnly` = `false` pour les ordres marketables de STRATEGY_1.
  - `encodedTif` = `HLConstants.TIF_IOC` (3) pour exécuter en IOC.
- `encodeSpotSend(destination, tokenId, amount1e8)` pour crédits EVM/Core

Implémentations: `HLConstants`, `CoreHandlerLib.encodeSpotLimitOrder`, `CoreHandlerLib.encodeSpotSend`, `CoreInteractionHandler._sendSpotLimitOrderDirect`.

---

## Règles pratiques appliquées par STRATEGY_1
- Prix normalisés en 1e8; quantisation appliquée après epsilon/slippage:
  - Contrainte prix: ≤ 5 chiffres significatifs et ≤ (8 − szDecimals) décimales
  - Direction d’arrondi agressif pour conserver la « marketability »: BUY ↑ (ceil), SELL ↓ (floor)
- Ordres « market IOC » via le BBO:
  - BUY: limite sur `ask` (élargie par `marketEpsilonBps`)
  - SELL: limite sur `bid` (réduite par `marketEpsilonBps`)
- Rebalance et dépôts:
  - Les deltas/allocations sont calculés en USD 1e18
  - Convertis en tailles `szDecimals` avec `toSzInSzDecimals`
  - Cap achat par solde USDC disponible si aucune vente préalable
- Lot size: la taille est alignée sur `szDecimals` (snap to lot)
- Notional minimum: un seuil en USD 1e8 évite les IOC « poussière »
- Asset IDs:
  - `assetId = spotIndex + 10000` pour `bbo()` et `encodeSpotLimitOrder()`
  - `spotPx/spotInfo/tokenInfo/spotBalance` prennent respectivement `spotIndex` ou `tokenId`, pas `assetId`

---

## Exemples rapides
- AssetId SPOT:
  - BTC/USDC: `assetId = 10000 + spotBTC`
  - HYPE/USDC: `assetId = 10000 + spotHYPE`
- Prix:
  - `px1e8 = rawPx * scalar(spot)` puis éventuellement `_toRawPx()` pour soumettre l’ordre.
- Taille achat 50% d’un dépôt USDC:
  - `allocUsd1e18 = usdc1e8 * 1e10 * (1 - reserveBps)`
  - `halfUsd1e18 = allocUsd1e18 / 2`
  - `sz = toSzInSzDecimals(l1read, spotTokenId, halfUsd1e18, px1e8)`

---

## Conformité aux docs Hyperliquid
- Notation Px/Sz/Side/Asset/TIF: conforme [`notation`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/notation)
- Asset IDs SPOT avec offset 10000: conforme [`asset-ids`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/asset-ids)
- Respect des `szDecimals`/tick rules et normalisation px: conforme [`tick-and-lot-size`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size)

## Adresses système (Spot et HYPE natif)
- Spot system address: premier octet `0x20`, le reste zéro sauf l’index `tokenId` (big‑endian implicite sur les derniers octets).
- HYPE natif: `0x2222222222222222222222222222222222222222`.
- STRATEGY_1: `SystemAddressLib.getSpotSystemAddress(tokenId)` calcule toujours `0x20 + tokenId` — y compris pour `tokenId = 0` (USDC). Le natif HYPE est géré séparément via la constante HYPE.



