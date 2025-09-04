# Correction CSS Vercel - Problèmes de styles non appliqués

## Problème identifié
CSS non pris en compte sur Vercel (styles non appliqués)

## Causes possibles
1. Variables CSS non reconnues par Tailwind sur Vercel
2. `@theme` non supportée partout
3. Directives Tailwind mal placées
4. Couleurs hexadécimales plus fiables que variables CSS

## Corrections appliquées
1) `globals.css` :root + `@tailwind base/components/utilities`
2) `tailwind.config.ts` : couleurs hexadécimales directes
3) `globals.css` : styles de base avec couleurs directes

## Résultat
- CSS fonctionnel sur Vercel
- Palette Axone respectée
- Mode sombre/clair OK

