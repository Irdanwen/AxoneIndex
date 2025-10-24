# Dépannage Vercel — Build et CSS

<!--
title: "Dépannage Vercel — Build et CSS"
lang: fr
updated: 2025-10-24
owner: Axone Team
-->

Ce document consolide tous les correctifs liés aux erreurs de build et aux problèmes CSS rencontrés sur Vercel. Il remplace les anciens fichiers suivants (archivés): `VERCEL_BUILD_FIX_FINAL.md`, `VERCEL_BUILD_FIX_COMPLETE.md`, `VERCEL_CSS_FIX.md` et `docs/ops/VERCEL_BUILD_FIX_FINAL.md`.

## Problèmes connus et correctifs

### 1) Gestionnaire wagmi — `injected()`

Erreur:

```
Type 'typeof injected' is not assignable to type 'CreateConnectorFn | Connector | Connector<CreateConnectorFn>'
```

Correctif (wagmi v2): appeler la fonction `injected()` au lieu de passer la référence:

```diff
- onClick={() => connect({ connector: injected })}
+ onClick={() => connect({ connector: injected() })}
```

Fichiers typiques affectés: `Header.tsx`, `src/app/referral/page.tsx`, `src/app/documentation/page.tsx`.

### 2) Classe Tailwind inconnue

Erreur:

```
Error: Cannot apply unknown utility class `bg-axone-black-20`
```

Correctif: utiliser la classe native Tailwind

```diff
- className="bg-axone-black-20 ..."
+ className="bg-black/20 ..."
```

### 3) Event listener typé incorrectement

Erreur:

```
Type '(error: { code?: number; }) => void' is not assignable to parameter of type 'EventListener'
```

Correctif minimal:

```diff
- const handleChainError = (error: { code?: number }) => {
+ const handleChainError = (event: Event) => {
+   const error = event as any;
    if (error.code === 4902) {
      alert("Chain non supportée, veuillez choisir la bonne chaîne");
    }
  };
```

### 4) Problèmes CSS/Tailwind non pris en compte

Symptômes: styles non appliqués, variables CSS non reconnues sur Vercel.

Actions recommandées:

```diff
// globals.css
- @custom-variant dark (&:is(.dark *));
- @theme {
+ :root {
  /* Variables CSS */
}
+ @tailwind base;
+ @tailwind components;
+ @tailwind utilities;

// tailwind.config.ts
 colors: {
-  'axone-accent': 'var(--color-axone-accent)',
+  'axone-accent': '#fab062',
-  'axone-flounce': 'var(--color-axone-flounce)',
+  'axone-flounce': '#4a8c8c',
-  'axone-dark': 'var(--color-axone-dark)',
+  'axone-dark': '#011f26',
 }
```

### 5) Réseau Vercel et pnpm

Sur Vercel, forcer pnpm `9.x` dans `package.json` pour éviter les erreurs ETIMEDOUT liées au registre (Vercel utilise pnpm@10 par défaut):

```json
{
  "engines": {
    "pnpm": "9.x"
  }
}
```

Référence interne: voir aussi `vercel.json` si vous personnalisez l’environnement d’exécution.

## Checklist rapide de validation

- [ ] `connect({ connector: injected() })`
- [ ] Aucune classe custom inconnue (ex: `bg-axone-black-20`) → remplacer par équivalent Tailwind
- [ ] `globals.css`: `@tailwind base/components/utilities` présents et ordonnés
- [ ] `tailwind.config.ts`: couleurs hex directes si besoin
- [ ] Event listeners typés `Event` si nécessaire
- [ ] `package.json → engines.pnpm` à `9.x` sur Vercel

## Résultat attendu

- Build Vercel sans erreur
- Styles Tailwind correctement appliqués
- Compatibilité wagmi v2 respectée
- Types TypeScript validés

