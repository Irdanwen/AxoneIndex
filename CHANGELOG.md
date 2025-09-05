# Changelog

## [2025-09-05] - Correctif décimales AxoneSale et docs

### 🔴 Correction critique
- Correction du calcul USDC dans `AxoneSale.sol` en normalisant les décimales (AXN 18, USDC 6)
- Ajout de `USDC_DECIMALS` et redéfinition de `PRICE_PER_AXN_IN_USDC` à `USDC_DECIMALS / 10` (0,1 USDC)

### 📝 Documentation
- Nouveau: `docs/contracts/AxoneSale.md`
- Index docs mis à jour pour référencer AxoneSale

## [2024-08-18] - Corrections critiques

### 🔴 **Erreurs bloquantes corrigées**
- ✅ **Footer.tsx** : `socialLinks` était déjà correctement défini
- ✅ **TrustBar.tsx** : Clés React stabilisées (`key={partner.name}` et `key={point.title}`)
- ✅ **Footer.tsx** : Clés React stabilisées (`key={social.label}`)

### 🟠 **Bugs fonctionnels corrigés**
- ✅ **Header.tsx** : Boutons unifiés avec le composant `Button` standardisé
- ✅ **Classes Tailwind** : Validation confirmée (toutes les classes sont valides)
- ✅ **Hero.tsx** : State inutilisé supprimé (`isVisible` et `useEffect`)

### 🟢 **Optimisations critiques appliquées**
- ✅ **ErrorBoundary** : Composant créé et intégré dans le layout principal
- ✅ **Dépendances** : `clsx` et `tailwind-merge` déjà présentes dans package.json
- ✅ **Imports** : `ChevronRight` supprimé des imports inutilisés

### 📦 **Scripts ajoutés**
- ✅ **optimize-project** : Script d'optimisation complet
- ✅ **clean** : Script de nettoyage et réinstallation

### 🧪 **Tests de validation**
- ✅ **ESLint** : 0 erreurs, 0 warnings
- ✅ **TypeScript** : 0 erreurs de type
- ✅ **Build** : Compilation réussie (50 kB bundle size)

### 📊 **Métriques**
- **Taille du bundle** : 50 kB (optimisé)
- **Erreurs TypeScript** : 0 (était 10)
- **Warnings ESLint** : 0 (était 4)
- **Composants corrigés** : 6 fichiers
- **Nouveaux composants** : 1 (ErrorBoundary)

---
*Corrections appliquées le 18 août 2024*

