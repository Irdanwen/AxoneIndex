# Rapport d'Audit - Correction Valorisation Soldes Spot (szDecimals vs weiDecimals)

**Date**: 1er Octobre 2025  
**Contrat**: `CoreInteractionHandler.sol`  
**Sévérité**: 🔴 **CRITIQUE**  
**Status**: ✅ **CORRIGÉ**

---

## 📋 Résumé Exécutif

Une vulnérabilité critique a été identifiée dans les fonctions de valorisation du contrat `CoreInteractionHandler.sol`. Le contrat ne convertissait pas correctement les soldes spot de `szDecimals` vers `weiDecimals` avant de calculer leur valeur en USD, résultant en une **valorisation incorrecte** des actifs.

### Impact Global
- **Valorisation incorrecte des actifs** : Surévaluation ou sous-évaluation selon les décimales
- **NAV (Net Asset Value) erroné** : Prix par share (PPS) incorrect
- **Rebalancement incorrect** : Calculs de delta faussés
- **Impact financier** : Pertes potentielles pour les utilisateurs

---

## 🐛 Description du Problème

### Contexte : Deux Types de Décimales

HyperLiquid utilise deux formats de décimales différents pour chaque token :

1. **szDecimals** : Format pour les opérations de trading (taille des ordres, transfers)
   - Retourné par `SpotBalance.total` du precompile
   - Utilisé pour `encodeSpotLimitOrder()` et `encodeSpotSend()`

2. **weiDecimals** : Format pour la représentation on-chain et valorisation
   - Utilisé pour calculer les valeurs correctement
   - Peut différer de szDecimals

### 🔥 Problème Identifié

**Formule incorrecte** : Le code supposait que `SpotBalance.total` était déjà en format weiDecimals, mais il est en fait en format szDecimals.

Pour convertir correctement :
```
balanceInWei = balanceSz × 10^(weiDecimals - szDecimals)
```

**Conséquence** : Si `weiDecimals ≠ szDecimals`, la valorisation était fausse.

---

## 📐 Analyse Détaillée

### Code Incorrect (Avant)

```solidity
function equitySpotUsd1e18() public view returns (uint256) {
    // ❌ Suppose que spotBalance retourne en format correct
    uint256 usdcBal1e8 = spotBalance(address(this), usdcCoreTokenId);
    uint256 btcBal1e0 = spotBalance(address(this), spotTokenBTC);
    uint256 hypeBal1e0 = spotBalance(address(this), spotTokenHYPE);

    uint256 pxB1e8 = spotOraclePx1e8(spotBTC);
    uint256 pxH1e8 = spotOraclePx1e8(spotHYPE);

    // ❌ Calculs supposant des formats fixes
    uint256 usdc1e18 = usdcBal1e8 * 1e10;
    uint256 btcUsd1e18 = btcBal1e0 * pxB1e8 * 1e10;
    uint256 hypeUsd1e18 = hypeBal1e0 * pxH1e8 * 1e10;
    return usdc1e18 + btcUsd1e18 + hypeUsd1e18;
}
```

**Problèmes** :
1. ❌ Ne récupère pas les infos de décimales via `tokenInfo()`
2. ❌ Suppose des formats fixes (1e8 pour USDC, 1e0 pour BTC/HYPE)
3. ❌ Ne convertit pas de szDecimals vers weiDecimals

### Code Corrigé (Après)

```solidity
/// @notice Get spot balance converted to wei decimals
/// @dev Converts SpotBalance.total from szDecimals to weiDecimals format
function spotBalanceInWei(address coreUser, uint64 tokenId) internal view returns (uint256) {
    L1Read.SpotBalance memory b = l1read.spotBalance(coreUser, tokenId);
    L1Read.TokenInfo memory info = l1read.tokenInfo(uint32(tokenId));
    
    uint256 total = uint256(b.total);
    
    // Convert from szDecimals to weiDecimals
    // Formula: balanceInWei = total × 10^(weiDecimals - szDecimals)
    if (info.weiDecimals > info.szDecimals) {
        uint8 diff = info.weiDecimals - info.szDecimals;
        return total * (10 ** diff);
    } else if (info.weiDecimals < info.szDecimals) {
        uint8 diff = info.szDecimals - info.weiDecimals;
        return total / (10 ** diff);
    }
    return total;
}

function equitySpotUsd1e18() public view returns (uint256) {
    // ✅ Utilise spotBalanceInWei pour conversion correcte
    uint256 usdcBalWei = spotBalanceInWei(address(this), usdcCoreTokenId);
    uint256 btcBalWei = spotBalanceInWei(address(this), spotTokenBTC);
    uint256 hypeBalWei = spotBalanceInWei(address(this), spotTokenHYPE);

    uint256 pxB1e8 = spotOraclePx1e8(spotBTC);
    uint256 pxH1e8 = spotOraclePx1e8(spotHYPE);

    // ✅ Récupération des infos de décimales
    L1Read.TokenInfo memory usdcInfo = l1read.tokenInfo(uint32(usdcCoreTokenId));
    L1Read.TokenInfo memory btcInfo = l1read.tokenInfo(uint32(spotTokenBTC));
    L1Read.TokenInfo memory hypeInfo = l1read.tokenInfo(uint32(spotTokenHYPE));

    // ✅ Conversion dynamique basée sur weiDecimals réels
    uint256 usdc1e18 = usdcBalWei * (10 ** (18 - usdcInfo.weiDecimals));
    
    uint256 btcUsd1e18;
    uint256 hypeUsd1e18;
    
    // ✅ Gestion des cas où weiDecimals + 8 > 18 ou <= 18
    if (btcInfo.weiDecimals + 8 <= 18) {
        btcUsd1e18 = btcBalWei * pxB1e8 * (10 ** (18 - btcInfo.weiDecimals - 8));
    } else {
        btcUsd1e18 = (btcBalWei * pxB1e8) / (10 ** (btcInfo.weiDecimals + 8 - 18));
    }
    
    if (hypeInfo.weiDecimals + 8 <= 18) {
        hypeUsd1e18 = hypeBalWei * pxH1e8 * (10 ** (18 - hypeInfo.weiDecimals - 8));
    } else {
        hypeUsd1e18 = (hypeBalWei * pxH1e8) / (10 ** (hypeInfo.weiDecimals + 8 - 18));
    }
    
    return usdc1e18 + btcUsd1e18 + hypeUsd1e18;
}
```

---

## 🎯 Fonctions Impactées

### 1. `equitySpotUsd1e18()` (Lignes 229-265)

**Impact** : Calcul de l'équité totale en USD pour le reporting et le NAV.

**Avant** :
- ❌ Suppose des formats fixes
- ❌ Pas de conversion szDecimals → weiDecimals

**Après** :
- ✅ Récupère dynamiquement les décimales via `tokenInfo()`
- ✅ Convertit correctement avec `spotBalanceInWei()`
- ✅ Gère tous les cas de weiDecimals

---

### 2. `_computeRebalanceDeltas()` (Lignes 342-377)

**Impact** : Calcul des deltas pour le rebalancement 50/50.

**Avant** :
- ❌ Valorisation incorrecte des positions BTC/HYPE
- ❌ Calculs de delta faussés

**Après** :
- ✅ Valorisation correcte avec weiDecimals
- ✅ Rebalancement basé sur des valeurs réelles

---

### 3. Fonctions NON Modifiées (et c'est correct !)

#### `executeDeposit()` et `pullFromCoreToEvm()`

**Pourquoi pas de modification ?**

Ces fonctions utilisent `spotBalance()` (format szDecimals) car :
- Elles effectuent des **opérations de trading/transfer**
- Les protocoles HyperLiquid attendent des montants en szDecimals
- `encodeSpotLimitOrder()` et `encodeSpotSend()` utilisent szDecimals

**Conclusion** : L'utilisation de szDecimals est **correcte** pour les opérations, seule la **valorisation** nécessite weiDecimals.

---

## 📊 Exemples Numériques

### Exemple 1 : BTC avec weiDecimals=8, szDecimals=4

**Scénario** : 
- Balance spot retournée : `10000` (en szDecimals=4)
- Prix BTC : `50,000 USD` (50,000 × 10^8 en format 1e8)

**Avant (INCORRECT)** :
```
balanceSz = 10000 (interprété comme 1e0)
valueUSD = 10000 × 50,000 × 1e8 × 1e10 = énorme valeur incorrecte
```

**Après (CORRECT)** :
```
balanceSz = 10000 (szDecimals=4)
balanceWei = 10000 × 10^(8-4) = 10000 × 10^4 = 100,000,000 (1e8)
valueUSD1e18 = (100,000,000 × 50,000 × 1e8) / 10^(8+8-18)
             = (100,000,000 × 50,000 × 1e8) × 10^2
             = 50,000 USD × 10^18 ✅
```

### Exemple 2 : USDC avec weiDecimals=8, szDecimals=8

**Scénario** :
- Balance spot retournée : `1000 × 10^8` (en szDecimals=8)

**Avant et Après (IDENTIQUE car weiDecimals=szDecimals)** :
```
balanceSz = 100,000,000 (1e8)
balanceWei = 100,000,000 (1e8) [pas de conversion nécessaire]
valueUSD1e18 = 100,000,000 × 10^(18-8) = 1000 USD × 10^18 ✅
```

---

## 🔒 Mesures Correctives Appliquées

### 1. Nouvelle Fonction Helper ✅

```solidity
function spotBalanceInWei(address coreUser, uint64 tokenId) internal view returns (uint256)
```

- Récupère le balance en szDecimals
- Récupère les infos de token via `tokenInfo()`
- Convertit en weiDecimals selon la formule

### 2. Mise à Jour des Fonctions de Valorisation ✅

- `equitySpotUsd1e18()` : Utilise `spotBalanceInWei()` + conversion dynamique
- `_computeRebalanceDeltas()` : Utilise `spotBalanceInWei()` + conversion dynamique

### 3. Documentation Complète ✅

- Section "Gestion des Décimales" ajoutée à `CoreInteractionHandler.md`
- Tableau des cas d'usage (trading vs valorisation)
- Exemples et formules de conversion

---

## 📝 Distinction Critique : Trading vs Valorisation

| Opération | Format Requis | Fonction à Utiliser | Raison |
|-----------|---------------|-------------------|---------|
| **Trading** (ordres SPOT) | szDecimals | `spotBalance()` | Format attendu par `encodeSpotLimitOrder()` |
| **Transfers** (spot sends) | szDecimals | `spotBalance()` | Format attendu par `encodeSpotSend()` |
| **Valorisation USD** | weiDecimals | `spotBalanceInWei()` | Calcul de valeur correct |
| **NAV / PPS** | weiDecimals | `spotBalanceInWei()` | Équité correcte |
| **Rebalancement** | weiDecimals | `spotBalanceInWei()` | Deltas basés sur valeur réelle |

---

## ⚠️ Impact Estimé

### Scénarios Potentiels

#### Scénario 1 : Sous-valorisation (weiDecimals > szDecimals)

**Exemple** : BTC avec weiDecimals=8, szDecimals=4
- **Balance réelle** : 1 BTC = 100,000,000 (en weiDecimals)
- **Balance retournée** : 10,000 (en szDecimals)
- **Sans correction** : Valorisé comme 0.0001 BTC au lieu de 1 BTC
- **Erreur** : 10,000x sous-valorisation

**Conséquences** :
- NAV drastiquement sous-évalué
- PPS incorrect (trop bas)
- Utilisateurs reçoivent trop de shares
- Dilution des shares existants

#### Scénario 2 : Surévaluation (weiDecimals < szDecimals)

**Exemple** : Token avec weiDecimals=4, szDecimals=8
- **Balance réelle** : 10,000 (en weiDecimals)
- **Balance retournée** : 100,000,000 (en szDecimals)
- **Sans correction** : Valorisé 10,000x trop élevé

**Conséquences** :
- NAV artificiellement gonflé
- PPS incorrect (trop haut)
- Utilisateurs reçoivent trop peu de shares
- Retraits possibles à perte

---

## ✅ Tests Recommandés

### Tests Unitaires

```javascript
describe("Decimal Conversion", () => {
  it("should convert szDecimals to weiDecimals correctly", async () => {
    // Cas 1: weiDecimals > szDecimals
    const balance1 = await handler.spotBalanceInWei(user, tokenId1);
    expect(balance1).to.equal(balanceSz * 10**(weiDecimals - szDecimals));
    
    // Cas 2: weiDecimals = szDecimals
    const balance2 = await handler.spotBalanceInWei(user, tokenId2);
    expect(balance2).to.equal(balanceSz);
    
    // Cas 3: weiDecimals < szDecimals
    const balance3 = await handler.spotBalanceInWei(user, tokenId3);
    expect(balance3).to.equal(balanceSz / 10**(szDecimals - weiDecimals));
  });

  it("should calculate equity correctly with different decimals", async () => {
    // Setup: Mock tokens with different decimals
    // Vérifier que equitySpotUsd1e18() retourne la valeur correcte
    const equity = await handler.equitySpotUsd1e18();
    expect(equity).to.be.closeTo(expectedEquityUSD1e18, tolerance);
  });

  it("should rebalance correctly with proper valuation", async () => {
    // Setup: Portfolio déséquilibré
    await handler.rebalancePortfolio(0, 0);
    // Vérifier que les ordres sont de la bonne taille
    // basés sur la valorisation correcte
  });
});
```

### Tests d'Intégration

1. **Test multi-tokens** : Vérifier avec plusieurs tokens ayant des décimales différentes
2. **Test NAV** : Vérifier que le prix par share est cohérent
3. **Test rebalancement** : Vérifier que le 50/50 est atteint avec les bonnes valeurs

---

## 🎓 Leçons Apprises

### Points Clés

1. **Ne jamais supposer les formats de décimales** : Toujours récupérer via `tokenInfo()`
2. **Distinguer usage vs valorisation** : Opérations (szDecimals) ≠ Valorisation (weiDecimals)
3. **Documenter explicitement** : Commentaires clairs sur les formats attendus
4. **Tests avec valeurs réalistes** : Utiliser différents cas de weiDecimals/szDecimals

### Bonnes Pratiques

```solidity
// ❌ Mauvais : Suppose un format fixe
uint256 value = balance * price * 1e10;

// ✅ Bon : Récupère les infos et convertit
TokenInfo memory info = l1read.tokenInfo(tokenId);
uint256 balanceWei = convertToWeiDecimals(balance, info);
uint256 value = calculateValue(balanceWei, price, info.weiDecimals);

// ✅ Encore mieux : Fonction helper dédiée
uint256 balanceWei = spotBalanceInWei(user, tokenId);
```

---

## 📞 Contact

Pour toute question concernant cette correction :
- **Développeur** : Morgan Magalhaes
- **Date de correction** : 1er Octobre 2025
- **Référence** : AUDIT_DECIMALS_FIX_001

---

## 🔗 Références

- Fichier modifié : `contracts/src/HYPE50 Defensive/CoreInteractionHandler.sol`
- Fonctions ajoutées : 
  - `spotBalanceInWei()` (lignes 200-221)
- Fonctions modifiées :
  - `equitySpotUsd1e18()` (lignes 229-265)
  - `_computeRebalanceDeltas()` (lignes 342-377)
- Documentation : `docs/contracts/CoreInteractionHandler.md`
- Interface L1Read : `contracts/src/HYPE50 Defensive/interfaces/L1Read.sol`

---

## 📈 Matrice de Risque

| Aspect | Avant Correction | Après Correction |
|--------|-----------------|------------------|
| **Sévérité** | 🔴 Critique | ✅ Résolu |
| **Probabilité** | 🔴 Élevée (si weiDecimals ≠ szDecimals) | ✅ N/A |
| **Impact Financier** | 🔴 Majeur (10,000x possible) | ✅ Correct |
| **Impact Utilisateurs** | 🔴 Critique (NAV/PPS faux) | ✅ Protégés |
| **Impact Rebalancement** | 🔴 Dysfonctionnel | ✅ Fonctionnel |
| **Complexité Fix** | 🟡 Moyenne | ✅ Implémenté |

---

**Status Final: CORRIGÉ ✅**

La correction a été appliquée avec succès. Les fonctions de valorisation utilisent maintenant `spotBalanceInWei()` pour convertir correctement de szDecimals vers weiDecimals avant tout calcul de valeur en USD.

Les fonctions de trading et transfer continuent d'utiliser `spotBalance()` (szDecimals) comme prévu par le protocole HyperLiquid.

Tests et validation en production recommandés avant déploiement final.

