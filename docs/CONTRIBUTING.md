# Contribuer à AxoneIndex

## Objectif
Ce document décrit les bonnes pratiques de contribution, les conventions de code et le processus de revue.

## Prérequis
- Node.js ≥ 18 (LTS)
- pnpm 9.x
- Git
- Hardhat installé localement pour les tests des contrats

## Mise en place
1. Installer les dépendances: `pnpm install`
2. Lancer le frontend: `pnpm dev`
3. Tests contrats: depuis `contracts/`, exécuter `pnpm hardhat test` (ou `npx hardhat test`)

## Branches et commits
- Branches: `feat/…`, `fix/…`, `chore/…`, `docs/…`
- Commits: style "Conventional Commits" (ex. `feat(referral): add referral code validation`)
- Ouvrir une PR dès que possible, avec description claire, captures/outputs pertinents et checklist (tests, lint, docs)

## Conventions de code
- TypeScript/React
  - Noms explicites et lisibles; éviter abréviations
  - Respecter le style ESLint/Prettier existant
  - UI: suivre les patterns de composants réutilisables dans `src/components/`
- Tailwind CSS
  - Respecter les classes et tokens déjà utilisés dans le projet
  - Préférer les conventions d’espacement vertical existantes (ex. `MB-[20rem]`) lorsqu’elles sont déjà en place
- Solidity
  - Contrats et libs sous `contracts/src/`
  - Tests en JavaScript sous `contracts/test/`
  - Scripts de déploiement sous `contracts/scripts/`

## Tests
- Utiliser Hardhat (Mocha/Chai) pour les contrats
- Les tests E2E/UI peuvent être ajoutés séparément si nécessaire
- Vérifier les régressions sur les intégrations wagmi/HyperEVM côté frontend

## Processus de revue
- Vérifier: lisibilité, tests, sécurité (pas de secrets), impact doc
- Demander une review d’un mainteneur
- À l’acceptation: squash & merge (sauf cas contraire)

## Sécurité et secrets
- Ne jamais committer de clés privées, seeds, RPC privés ou variables `.env`
- Les fichiers de configuration sensibles doivent être documentés mais pas versionnés

## Documentation
- Mettre à jour `docs/README.md` et les guides existants si votre PR impacte:
  - l’architecture (contrats, ABI, intégrations wagmi)
  - les interfaces publiques (fonctions Solidity, endpoints ou événements)
  - la configuration (prérequis, scripts)
