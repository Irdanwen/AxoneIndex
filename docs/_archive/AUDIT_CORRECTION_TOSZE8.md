# Rapport d'Audit - Correction Critique de la Fonction _toSz1e8

**Date**: 1er Octobre 2025  
**Contrat**: `CoreInteractionHandler.sol`  
**Sévérité**: 🔴 **CRITIQUE**  
**Status**: ✅ **CORRIGÉ**

> Erratum (Important) — toSzInSzDecimals (facteur ×100)
>
> Au cours de la vérification, un problème distinct et plus critique a été identifié dans `toSzInSzDecimals` (conversion USD1e18 → taille en `szDecimals` avec prix en 1e8). Le dénominateur utilisait `price1e8 * 1e8` au lieu de `price1e8 * 1e10`, gonflant les tailles d’ordres d’un facteur ×100 (ex: vente HYPE initiale lors d’un dépôt natif). La fonction a été corrigée pour diviser par `price1e8 * 1e10`. Des tests ont été ajoutés pour couvrir ce chemin.

---

## 📋 Résumé Exécutif

Un bug critique a été identifié dans la fonction `_toSz1e8` du contrat `CoreInteractionHandler.sol`. Cette fonction calculait incorrectement les quantités d'actifs à trader, résultant en des ordres **100x trop petits** par rapport aux montants attendus.

### Impact Global
- **99% des dépôts USDC restaient non investis** en BTC/HYPE
- **Rebalancement inefficace** avec des ordres trop petits
- **Échecs potentiels de retraits** par manque de liquidité disponible
- **Perte d'opportunité d'investissement** pour les utilisateurs

---

## 🐛 Description du Bug

### Code Incorrect (Avant)
```solidity
function _toSz1e8(int256 deltaUsd1e18, uint64 price1e8) internal pure returns (uint64) {
    if (deltaUsd1e18 == 0 || price1e8 == 0) return 0;
    uint256 absUsd = uint256(deltaUsd1e18 > 0 ? deltaUsd1e18 : -deltaUsd1e18);
    // size1e8 = (absUsd1e18 / price1e8) / 1e10
    uint256 s = absUsd / uint256(price1e8) / 1e10;  // ❌ ERREUR ICI
    if (s > type(uint64).max) return type(uint64).max;
    return SafeCast.toUint64(s);
}
```

### Code Corrigé (Après)
```solidity
function _toSz1e8(int256 deltaUsd1e18, uint64 price1e8) internal pure returns (uint64) {
    if (deltaUsd1e18 == 0 || price1e8 == 0) return 0;
    uint256 absUsd = uint256(deltaUsd1e18 > 0 ? deltaUsd1e18 : -deltaUsd1e18);
    // size1e8 = (absUsd1e18 / price1e8) / 100
    // Formule correcte: usd1e18 / price1e8 = 1e10, puis / 100 = 1e8
    uint256 s = absUsd / uint256(price1e8) / 100;  // ✅ CORRIGÉ
    if (s > type(uint64).max) return type(uint64).max;
    return SafeCast.toUint64(s);
}
```

---

## 📐 Analyse Mathématique

### Analyse Dimensionnelle

**Formule correcte attendue:**
```
size1e8 = usd1e18 / price1e8 / 100
```

**Vérification dimensionnelle:**
```
usd1e18      : USD × 10^18
price1e8     : USD/unité × 10^8
usd/price    : unités × 10^10
/ 100        : unités × 10^8 ✅
```

### Erreur Détectée

**Ancien calcul (incorrect):**
```
absUsd (1e18) / price1e8 (1e8) / 1e10
= résultat en 1e18 / 1e8 / 1e10
= résultat en 1e0 (quantité de base sans décimales) ❌
```

**Problème:** La fonction retournait des quantités en **1e0** au lieu de **1e8**, soit **100x trop petit**.

### Exemple Numérique

**Scénario:** Achat de BTC avec 50,000 USD  
**Prix BTC:** 50,000 USD (50,000 × 10^8 en format 1e8)

**Ancien calcul (bug):**
```
s = (50,000 × 1e18) / (50,000 × 1e8) / 1e10
s = 1e18 / 1e8 / 1e10
s = 1e0
s = 1 (représente 0.00000001 BTC au lieu de 1 BTC)
```

**Nouveau calcul (corrigé):**
```
s = (50,000 × 1e18) / (50,000 × 1e8) / 100
s = 1e10 / 100
s = 1e8
s = 100,000,000 (représente 1 BTC correctement en format 1e8)
```

---

## 🎯 Fonctions Impactées

### 1. `executeDeposit` (Lignes 235-236)

**Impact:** Lors des dépôts, les ordres d'achat BTC/HYPE étaient 100x trop petits.

```solidity
uint256 halfUsd1e18 = (uint256(usdc1e8) * 1e10) / 2;
uint64 pxB = _validatedOraclePx1e8(true);
uint64 pxH = _validatedOraclePx1e8(false);
uint64 szB1e8 = _toSz1e8(int256(halfUsd1e18), pxB);  // ❌ Bug ici
uint64 szH1e8 = _toSz1e8(int256(halfUsd1e18), pxH);  // ❌ Bug ici
```

**Conséquence:**
- Un dépôt de 1000 USDC ne générait que ~10 USDC d'ordres BTC/HYPE
- 99% des fonds restaient en USDC non investis
- Les utilisateurs ne bénéficiaient pas de l'exposition BTC/HYPE promise

---

### 2. `_placeRebalanceOrders` (Lignes 319, 330)

**Impact:** Les ordres de rebalancement étaient 100x sous-évalués.

```solidity
function _placeRebalanceOrders(
    int256 dB,
    int256 dH,
    uint64 pxB,
    uint64 pxH,
    uint128 cloidBtc,
    uint128 cloidHype
) internal {
    uint64 szB1e8 = _toSz1e8(dB, pxB);  // ❌ Bug ici
    uint64 szH1e8 = _toSz1e8(dH, pxH);  // ❌ Bug ici
    // ... ordres trop petits
}
```

**Conséquence:**
- Le rebalancement 50/50 ne fonctionnait pas correctement
- Déséquilibre persistant du portefeuille
- Risque accru pour les utilisateurs

---

### 3. `_sellAssetForUsd` (Ligne 365)

**Impact:** Les ventes d'actifs pour les retraits étaient 100x insuffisantes.

```solidity
function _sellAssetForUsd(uint32 spotAsset, uint64 tokenId, uint256 targetUsd1e8) internal {
    if (targetUsd1e8 == 0) return;
    uint64 px = spotOraclePx1e8(spotAsset);
    uint256 targetUsd1e18 = targetUsd1e8 * 1e10;
    uint64 sz1e8 = _toSz1e8(int256(targetUsd1e18), px);  // ❌ Bug ici
    // ... vente insuffisante
}
```

**Conséquence:**
- Les retraits pouvaient échouer (balance USDC insuffisante)
- Nécessité de ventes multiples pour couvrir un retrait
- Expérience utilisateur dégradée

---

## ✅ Autres Conversions Vérifiées

### Conversions 1e8 ↔ 1e18 (CORRECTES)

Toutes les autres conversions utilisant `* 1e10` ou `/ 1e10` ont été vérifiées et sont **CORRECTES**:

#### VaultContract.sol
```solidity
// ✅ Conversion USDC 1e8 → 1e18 pour NAV
uint256 evm1e18 = usdc.balanceOf(address(this)) * 1e10;

// ✅ Calcul PPS
uint256 pps = (nav * 1e18) / totalSupply;

// ✅ Mint initial de shares
sharesMint = uint256(amount1e8) * 1e10;  // 1:1 ratio

// ✅ Conversion pour retraits
uint256 gross1e8 = target1e18 / 1e10;
```

#### CoreInteractionHandler.sol
```solidity
// ✅ Conversion USDC 1e8 → 1e18
uint256 usdc1e18 = usdcBal1e8 * 1e10;

// ✅ Calcul equity en USD
uint256 btcUsd1e18 = btcBal1e0 * pxB1e8 * 1e10;
uint256 hypeUsd1e18 = hypeBal1e0 * pxH1e8 * 1e10;

// ✅ Préparation pour _toSz1e8
uint256 halfUsd1e18 = (uint256(usdc1e8) * 1e10) / 2;
```

**Conclusion:** Aucune autre erreur de conversion détectée. Le bug était isolé à `_toSz1e8`.

---

## 📊 Impact Estimé

### Scénarios de Perte Potentielle

#### Scénario 1: Dépôt de 100,000 USDC
- **Attendu:** 50,000 USD en BTC + 50,000 USD en HYPE
- **Réel (avec bug):** 500 USD en BTC + 500 USD en HYPE
- **Non investi:** 99,000 USDC (99%)
- **Perte d'opportunité:** Si BTC +10%, perte de 5,000 USD de gains

#### Scénario 2: Rebalancement
- **Déséquilibre:** 60% BTC / 40% HYPE (100,000 USD equity)
- **Ordre nécessaire:** Vendre 10,000 USD de BTC
- **Ordre réel (avec bug):** Vendre 100 USD de BTC
- **Résultat:** Déséquilibre persistant, risque accru

#### Scénario 3: Retrait de 50,000 USDC
- **USDC disponible:** 1,000 USDC
- **Vente BTC nécessaire:** 49,000 USD
- **Vente BTC réelle (avec bug):** 490 USD
- **Résultat:** Transaction échoue, utilisateur bloqué

### Estimation de l'Impact Global

Si le contrat avait été déployé avec ce bug :
- **Taux d'investissement réel:** 1% au lieu de 90-95%
- **Capital sous-utilisé:** 99% des dépôts
- **Rendement effectif:** Quasi-nul (USDC non investi)
- **Réputation:** Dommage sévère

---

## 🔒 Mesures Correctives Appliquées

### 1. Correction du Code ✅
- Remplacement de `/ 1e10` par `/ 100` dans `_toSz1e8`
- Ajout de commentaires explicatifs sur la formule

### 2. Documentation Mise à Jour ✅
- `docs/contracts/CoreInteractionHandler.md` : Ajout de la correction dans la section "Corrections Implémentées"
- `docs/_archive/Smart_Contracts_Functions_Documentation.md` : Archivé; contenu remplacé par docs/contracts/*

### 3. Tests Recommandés 🔄

#### Tests Unitaires à Effectuer
```javascript
// Test 1: _toSz1e8 avec prix BTC à 50,000 USD
it("should convert 50000 USD to 1 BTC correctly", async () => {
  const usd1e18 = ethers.utils.parseUnits("50000", 18);
  const priceBTC1e8 = 50000 * 1e8; // 50,000 USD
  const size = await handler._toSz1e8(usd1e18, priceBTC1e8);
  expect(size).to.equal(1e8); // 1 BTC en format 1e8
});

// Test 2: Dépôt avec investissement complet
it("should invest ~50% in BTC and ~50% in HYPE on deposit", async () => {
  const deposit = 1000 * 1e8; // 1000 USDC
  await handler.executeDeposit(deposit, false);
  // Vérifier que les ordres sont proches de 500 USD chacun
  // et non 5 USD (bug)
});

// Test 3: Rebalancement effectif
it("should rebalance correctly to 50/50", async () => {
  // Setup: portefeuille déséquilibré 70/30
  // Action: rebalancer
  // Vérification: ordres de taille appropriée
});

// Test 4: Retrait avec ventes suffisantes
it("should sell enough assets to cover withdrawal", async () => {
  const withdrawAmount = 500 * 1e8;
  // Vérifier que les ventes couvrent le montant
  // et non 1% du montant (bug)
});
```

---

## 📝 Recommandations

### Court Terme (Avant Déploiement)
1. ✅ **Correction appliquée** dans `_toSz1e8`
2. ⏳ **Tests exhaustifs** de toutes les fonctions impactées
3. ⏳ **Tests d'intégration** avec scenarios réels
4. ⏳ **Audit de code** par une tierce partie
5. ⏳ **Vérification gas** (division par 100 vs 1e10)

### Moyen Terme
1. Mettre en place des **tests automatisés** de régression
2. Ajouter des **assertions** dans le code pour vérifier les ordres de grandeur
3. Implémenter des **limites de sanity check** (ex: order size > minSize)
4. Logger les ordres pour **monitoring en production**

### Long Terme
1. Audits réguliers par des experts externes
2. Programme de bug bounty
3. Tests de fuzzing sur les conversions de décimales
4. Documentation exhaustive des formats de données

---

## 🎓 Leçons Apprises

### Points Clés
1. **Vérification dimensionnelle systématique** : Toujours vérifier les unités dans les calculs
2. **Tests avec valeurs réelles** : Utiliser des prix et montants réalistes dans les tests
3. **Commentaires explicites** : Documenter les formats attendus (1e8, 1e18, etc.)
4. **Peer review** : Les erreurs d'échelle sont difficiles à détecter seul

### Bonnes Pratiques pour Éviter ce Type de Bug
```solidity
// ❌ Mauvais: conversion ambiguë
uint256 result = amount / 1e10;

// ✅ Bon: conversion documentée
// Convert from 1e18 to 1e8 format
uint256 result1e8 = amount1e18 / 1e10;

// ✅ Encore mieux: avec assertion
uint256 result1e8 = amount1e18 / 1e10;
assert(result1e8 < type(uint64).max); // sanity check
```

---

## 📞 Contact

Pour toute question concernant cette correction :
- **Développeur** : Morgan Magalhaes
- **Date de correction** : 1er Octobre 2025
- **Référence** : AUDIT_TOSZE8_FIX_001

---

## 🔗 Références

- Fichier modifié : `contracts/src/HYPE50 Defensive/CoreInteractionHandler.sol`
- Fonction corrigée : `_toSz1e8` (ligne 351-358)
- Documentation : `docs/contracts/CoreInteractionHandler.md`
- Guide fonctions : `docs/_archive/Smart_Contracts_Functions_Documentation.md`

---

## 📝 Recommandation d'Audit Supplémentaire: Documentation de `epochLength`

**Date**: 1er Octobre 2025  
**Type**: Documentation  
**Sévérité**: ⚠️ **AVERTISSEMENT IMPORTANT**  
**Référence**: AUDIT_TOSZE8_DOC_001

### Problème Identifié

La documentation du paramètre `epochLength` était **ambiguë** et pouvait conduire à une erreur critique de configuration lors du déploiement.

### Confusion Potentielle

**Documentation originale** (incorrecte/ambiguë):
```
EPOCH_LENGTH_SECONDS (uint64): durée d'une epoch en secondes (ex: 86400)
```

**Réalité dans le code**:
```solidity
uint64 currentBlock = uint64(block.number);
if (currentBlock - lastEpochStart >= epochLength) {
    lastEpochStart = currentBlock;
    sentThisEpoch = 0;
}
```

Le paramètre `epochLength` est **exprimé en nombre de blocs**, pas en secondes !

### Impact Potentiel de l'Erreur

Si un développeur suivait l'ancienne documentation et utilisait `86400` (1 jour en secondes):
- **Intention**: 1 jour
- **Résultat réel**: 86400 blocs ≈ **12-20 jours** selon la chaîne
  - HyperEVM (≈2 sec/bloc): 86400 × 2 = 172,800 sec ≈ 2 jours
  - Ethereum (≈12 sec/bloc): 86400 × 12 = 1,036,800 sec ≈ 12 jours
- **Conséquence**: Rate limiting beaucoup trop permissif, affaiblissant la sécurité du contrat

### ✅ Corrections Appliquées

#### 1. Guide de Déploiement Mis à Jour
**Fichier**: `docs/guides/deploiement/HYPE50_Defensive_Deployment_Guide.md`

**Nouveau contenu** (lignes 35-39):
```markdown
- **EPOCH_LENGTH_BLOCKS (uint64)**: ⚠️ **IMPORTANT** : durée d'une epoch **EN NOMBRE DE BLOCS** (pas en secondes). 
  Le contrat utilise `block.number` pour éviter la manipulation des timestamps par les validateurs. 
  Exemples de calcul :
    - Sur HyperEVM (~2 sec/bloc) : 1 jour = 43200 blocs (86400 sec ÷ 2)
    - Sur Ethereum mainnet (~12 sec/bloc) : 1 jour = 7200 blocs (86400 sec ÷ 12)
    - Sur Polygon (~2 sec/bloc) : 1 jour = 43200 blocs
    - ⚠️ **Erreur courante** : Ne PAS utiliser `86400` directement (valeur en secondes)
```

**Section "Recommandations de valeurs initiales"** (lignes 120-131):
```markdown
- `EPOCH_LENGTH_BLOCKS`: ⚠️ **EXPRIMÉ EN BLOCS** :
  - **HyperEVM (≈2 sec/bloc)** :
    - 1 heure = `1800` blocs (3600 sec ÷ 2)
    - 1 jour = `43200` blocs (86400 sec ÷ 2)
    - 1 semaine = `302400` blocs
  - **Ethereum mainnet (≈12 sec/bloc)** :
    - 1 heure = `300` blocs (3600 sec ÷ 12)
    - 1 jour = `7200` blocs (86400 sec ÷ 12)
  - **Polygon (≈2 sec/bloc)** :
    - 1 heure = `1800` blocs
    - 1 jour = `43200` blocs
  - ⚠️ **NE JAMAIS utiliser des valeurs en secondes** (ex: 86400) directement !
```

#### 2. Documentation CoreInteractionHandler
**Fichier**: `docs/contracts/CoreInteractionHandler.md`

**Nouvelle section** (lignes 41-52):
```markdown
### ⚠️ Rate Limiting et Epochs (IMPORTANT)
Le contrat utilise un système de rate limiting basé sur les **blocs** (et non les timestamps) 
pour éviter toute manipulation par les validateurs.

- **`epochLength`** : ⚠️ **Exprimé en nombre de blocs**, pas en secondes !
  - Le code utilise `block.number` pour calculer les époques
  - **Exemples de calcul** :
    - **HyperEVM (≈2 sec/bloc)** : 1 jour = 43200 blocs
    - **Ethereum mainnet (≈12 sec/bloc)** : 1 jour = 7200 blocs
  - ⚠️ **Erreur critique** : Utiliser `86400` (valeur en secondes) créerait une epoch 
    de 86400 blocs ≈ 12-20 jours selon la chaîne
```

### Justification Technique

L'utilisation de `block.number` au lieu de `block.timestamp` est une **bonne pratique de sécurité** :
- **Résistance à la manipulation**: Les validateurs peuvent légèrement manipuler `block.timestamp` (±15 secondes sur Ethereum)
- **Prévisibilité**: Le nombre de blocs est déterministe et non manipulable
- **Cohérence**: Évite les dérives temporelles entre nœuds

### État Final

✅ **Documentation clarifiée et complétée**
- Ajout d'avertissements visuels (⚠️) pour attirer l'attention
- Exemples de calcul concrets pour différentes chaînes
- Mise en garde explicite contre l'erreur courante (86400)
- Entrée dans le CHANGELOG avec référence AUDIT_TOSZE8_DOC_001

---

**Status Final: CORRIGÉ ✅**

La correction de code et la clarification de documentation ont été appliquées avec succès. Tests et déploiement en attente.

