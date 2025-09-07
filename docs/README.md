# Documentation du projet AxoneIndex

## Introduction
AxoneIndex est une plateforme DeFi construite sur HyperEVM (Hyperliquid). Elle combine des contrats intelligents Solidity et une interface Next.js (App Router) pour offrir des coffres (vaults), une gestion de parrainages et une intégration wallet moderne.

## Configuration initiale
- Guide de démarrage parrainage: [REFERRAL_GUIDE.md](../REFERRAL_GUIDE.md)
- Implémentation des vaults: [VAULTS_IMPLEMENTATION.md](../VAULTS_IMPLEMENTATION.md)
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
- [Gestion des parrainages](../REFERRAL_MANAGEMENT_GUIDE.md)
- [Connexion wallet](../WALLET_CONNECTION_GUIDE.md)
- - Contrats (détails récents):
  - [CoreInteractionHandler — rôle rebalancer](./contracts/CoreInteractionHandler.md)
  - [VaultContract — frais de retrait par paliers](./contracts/VaultContract.md)
  - [AxoneSale — vente publique USDC](./contracts/AxoneSale.md)

## Guide d’intégration rapide Vault + Handler

1) Déployer les contrats
- Déployer `CoreInteractionHandler` (avec ses paramètres init: `l1read`, `coreWriter`, `usdc`, limites, frais).
- Déployer `VaultContract` avec l’adresse `usdc` (ERC20 à 6 décimales).

2) Lier le vault au handler et configurer l’approval USDC
- Appeler `vault.setHandler(address(handler))` depuis l’owner du vault.
- Cet appel accorde une approval USDC illimitée du vault vers le handler (nécessaire pour `safeTransferFrom` côté handler).

3) Configurer Core (handler)
- `handler.setVault(address(vault))`.
- `handler.setUsdcCoreLink(systemAddress, usdcTokenId)` et `handler.setSpotIds(btcSpot, hypeSpot)`.
- `handler.setSpotTokenIds(usdcTokenId, btcTokenId, hypeTokenId)` si requis.
- Facultatif: `handler.setRebalancer(address)` et ajuster `setParams`, `setLimits`.

4) Paramétrer le vault
- Définir `setFees(depositFeeBps, withdrawFeeBps, autoDeployBps)`.
- Définir les paliers via `setWithdrawFeeTiers(WithdrawFeeTier[])` (en USDC 1e8).

5) Dépôts et conversions d’unités
- Les utilisateurs appellent `vault.deposit(amount1e8)` (USDC en 1e8 côté vault).
- Si `autoDeployBps > 0`, le vault convertit automatiquement en 1e6 et appelle `handler.executeDeposit(usdc1e6, true)`.
- La NAV inclut: USDC EVM (solde * 1e12) + equity Core renvoyée par le handler.

6) Rappel de liquidités
- `vault.recallFromCoreAndSweep(amount1e8)` convertit en 1e6 et appelle `handler.pullFromCoreToEvm(...)` puis `handler.sweepToVault(...)`.

7) Vérifications rapides
- Après `setHandler`, vérifier `USDC.allowance(vault, handler) == type(uint256).max`.
- Tester un petit `deposit` et confirmer l’absence de revert d’allowance.
