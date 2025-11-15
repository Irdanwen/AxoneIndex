## STRATEGY_1 — Règles de prix, quantization et gardes

- Source pxDecimals: mapping on-chain `spotPxDecimals[spotIndex]` (défini par owner).
- Normalisation prix raw → 1e8:
  - si `pxDec == 8`: `px1e8 = raw`
  - si `pxDec < 8`: `px1e8 = raw * 10^(8 - pxDec)`
  - si `pxDec > 8`: `px1e8 = raw / 10^(pxDec - 8)`
- Inverse exact 1e8 → raw: symétrique de la règle ci‑dessus.

### Quantization du prix (après epsilon/slippage)
- Règles Hyperliquid:
  - ≤ 5 chiffres significatifs
  - ≤ (8 − szDecimals) décimales
  - Arrondi agressif: BUY ↑ (ceil), SELL ↓ (floor)
- Appliqué aux deux chemins:
  - BBO (`_marketLimitFromBbo`) : après epsilon
  - Fallback oracle (`_limitFromOracleQuantized`) : après (slippage + epsilon)

### Taille et notional
- Alignement de la taille sur le lot (`szDecimals`) via `snapToLot`.
- Garde `_assertOrder`: `px>0`, `size>0`, et `limitPx1e8` déjà quantisé.

### Asset et métadata
- `assetId = 10000 + spotIndex` (SPOT offset).
- `spotInfo(spotIndex)` → tokens base/quote.
- `tokenInfo(tokenId)` → `szDecimals` (lot size), `weiDecimals` (pour conversions de soldes).

### API (extraits)
- `setSpotPxDecimals(spotIndex, pxDec)` (owner)
- `_toPx1e8()`, `_toRawPx()`
- `quantizePx1e8()`
- `snapToLot()`, `_assertOrder()`

### Tests clés
1. BTC/USDC BUY avec ask 98765.4321 (1e8) → +ε → quantize OK
2. Meme coin szDecimals=2 → `maxPxDecimals=6`, ≤5 sig figs
3. Fallback BBO=0 → oracle ±(slippage+epsilon) → même quantize
4. Direction: BUY ↑, SELL ↓
5. Round-trip: raw → 1e8 → raw stable (pxDec variés)


