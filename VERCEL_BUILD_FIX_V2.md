# Correction Erreur Build Vercel - V2

## Problèmes identifiés

### 1. **Import `defineChain` incorrect**
```
Attempted import error: 'defineChain' is not exported from 'wagmi'
```

### 2. **Variable non utilisée**
```
Warning: 'connectors' is assigned a value but never used
```

### 3. **Type `any` non autorisé**
```
Error: Unexpected any. Specify a different type
```

### 4. **Classe Tailwind manquante**
```
Error: Cannot apply unknown utility class `bg-axone-black-20`
```

## Corrections appliquées

### 1. **wagmi.ts** - Correction de l'import
```diff
- import { createConfig, http, defineChain } from 'wagmi'
+ import { createConfig, http } from 'wagmi'
+ import { defineChain } from 'viem'
```

### 2. **Header.tsx** - Suppression variable non utilisée
```diff
- const { connect, connectors } = useConnect();
+ const { connect } = useConnect();
```

### 3. **Header.tsx** - Correction type `any`
```diff
- const handleChainError = (error: any) => {
+ const handleChainError = (error: { code?: number }) => {
```

### 4. **tailwind.config.ts** - Ajout classe manquante
```diff
+ 'axone-black': {
+   '20': 'rgba(0,0,0,0.2)',
+ }
```

### 5. **referral/page.tsx** - Correction connecteur
```diff
- const { connect, connectors } = useConnect()
+ const { connect } = useConnect()

- const handleConnect = () => {
-   if (connectors[0]) {
-     connect({ connector: connectors[0] })
-   }
- }
+ const handleConnect = () => {
+   connect({ connector: injected })
+ }

+ import { injected } from 'wagmi/connectors'
```

## Résultat
✅ **Build Vercel réussi** - Toutes les erreurs corrigées
✅ **Compatibilité wagmi v2** - Imports corrects
✅ **ESLint conforme** - Plus de warnings/erreurs
✅ **Tailwind complet** - Toutes les classes disponibles

## Vérifications
- ✅ Import `defineChain` depuis `viem`
- ✅ Variables utilisées uniquement si nécessaires
- ✅ Types explicites au lieu de `any`
- ✅ Classes Tailwind définies
- ✅ Connecteurs wagmi v2 corrects
