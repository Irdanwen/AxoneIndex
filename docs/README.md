# Documentation du projet AxoneIndex

## Table des matières
- [Introduction](#introduction)
- [Configuration initiale](#configuration-initiale)
- [Architecture](#architecture)
- [Guides pratiques](#guides-pratiques)
  - [Gestion des parrainages](./REFERRAL_MANAGEMENT_GUIDE.md)
  - [Connexion wallet](./WALLET_CONNECTION_GUIDE.md)
  - [Implémentation des vaults](./VAULTS_IMPLEMENTATION.md)
  - [UI – Corrections CSS](./ui/CORRECTIONS_SUMMARY.md)
  - [UI – Theme Toggle](./ui/THEME_TOGGLE_SUMMARY.md)
  - [Ops – Build Vercel (final)](./ops/VERCEL_BUILD_FIX_FINAL.md)
  - [Ops – CSS Vercel](./ops/VERCEL_CSS_FIX.md)
  - [Contrat Vault (technique)](./contracts/VaultContract.md)

## Introduction
AxoneIndex est une plateforme DeFi construite sur HyperEVM (Hyperliquid). Elle combine des contrats intelligents Solidity et une interface Next.js (App Router) pour offrir des coffres (vaults), une gestion de parrainages et une intégration wallet moderne.

## Configuration initiale
- Guide de démarrage parrainage: [REFERRAL_GUIDE.md](./REFERRAL_GUIDE.md)
- Implémentation des vaults: [VAULTS_IMPLEMENTATION.md](./VAULTS_IMPLEMENTATION.md)
- Prérequis techniques:
  - Node.js ≥ 18 (LTS recommandée)
  - pnpm 9.x (aligné avec les déploiements CI/CD)
  - Git
  - Accès à un wallet compatible EVM pour les tests manuels

## Architecture
- Composants principaux
  - Contrats Solidity (Hardhat)
    - Dossier `contracts/` avec configuration Hardhat, scripts de déploiement et tests JS
    - Contrats clés: `ReferralRegistry.sol`, modules liés aux vaults (ex. BTC50 Defensive)
  - Interface utilisateur (Next.js / App Router)
    - Dossier `src/app/` pour les routes (ex. `referral/`, `vaults/`, `admin/`)
    - Dossier `src/components/` pour les sections UI, providers (`WagmiProvider`, `ThemeProvider`) et composants réutilisables
  - Bibliothèques et ABI
    - Dossier `src/lib/` avec utilitaires, types, ABIs (`src/lib/abi`) et intégrations wagmi

- Schéma d’architecture (vue simplifiée)
```
+-----------------------+            +----------------------------+
|  Interface Web        |            |  Providers & Intégrations  |
|  Next.js (src/app)    |            |  (src/components/providers) |
|  Pages: /vaults,      |            |  - WagmiProvider           |
|  /referral, /admin    |            |  - ThemeProvider           |
+----------+------------+            +--------------+-------------+
           |                                        |
           | UI Components                          | Wagmi / Ethers
           v                                        v
+---------------------------+            +-----------------------------+
|  Composants UI            |            |  Lib & ABI                  |
|  (src/components/ui,      |            |  (src/lib, src/lib/abi)     |
|   sections, layout)       |            |  - ABIs (Vault, ERC20, ...) |
+------------+--------------+            |  - Utils (wagmi, helpers)   |
             |                           +--------------+--------------+
             | App Logic                                 |
             v                                           |
+-------------------------------+                        |
|  Intégration On-chain         |                        |
|  (src/lib/wagmi, utils)       |------------------------+
|  Appels: lecture/écriture     |
+---------------+---------------+
                |
                | RPC HyperEVM
                v
+----------------------------------------+
|  Contrats Solidity (contracts/src)     |
|  - ReferralRegistry                    |
|  - VaultContract, CoreInteraction...   |
|  - Libs (ReentrancyGuard, etc.)        |
+----------------------------------------+
```

- Dossiers clés
  - `contracts/`: sources Solidity (`contracts/src/`), scripts (`contracts/scripts/`), tests (`contracts/test/`) et artefacts Hardhat
  - `src/app/`: pages et routes de l’application (App Router Next.js)
  - `src/components/`: composants UI et sections (layout, ui, vaults, providers)
  - `src/lib/`: utilitaires applicatifs, intégrations et ABIs
  - `public/`: assets statiques (ex. logos)
  - `scripts/`: scripts utilitaires côté frontend (ex. optimisation d’images)

## Guides pratiques
- [Gestion des parrainages](./REFERRAL_MANAGEMENT_GUIDE.md)
- [Connexion wallet](./WALLET_CONNECTION_GUIDE.md)
- [Implémentation des vaults](./VAULTS_IMPLEMENTATION.md)
- [Corrections CSS (UI)](./ui/CORRECTIONS_SUMMARY.md)
- [Theme Toggle (UI)](./ui/THEME_TOGGLE_SUMMARY.md)
- [Build Vercel (ops)](./ops/VERCEL_BUILD_FIX_FINAL.md)
- [CSS Vercel (ops)](./ops/VERCEL_CSS_FIX.md)
- [Docs contrat Vault](./contracts/VaultContract.md)
