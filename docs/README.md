# Documentation du projet AxoneIndex

## Introduction
AxoneIndex est une plateforme DeFi construite sur HyperEVM (Hyperliquid). Elle combine des contrats intelligents Solidity et une interface Next.js (App Router) pour offrir des coffres (vaults), une gestion de parrainages et une intégration wallet moderne.

## Configuration initiale
- Guide de démarrage parrainage: [REFERRAL_GUIDE.md](./REFERRAL_GUIDE.md)
- Implémentation des vaults: voir [VaultContract](./contracts/VaultContract.md) et [CoreInteractionHandler](./contracts/CoreInteractionHandler.md)
- Prérequis techniques:
  - Node.js ≥ 18 (LTS recommandée)
  - pnpm 9.x (aligné avec les déploiements CI/CD)
  - Git
  - Accès à un wallet compatible EVM pour les tests manuels

## Architecture
- Composants principaux
  - Contrats Solidity (Hardhat)
    - Dossier `contracts/` avec configuration Hardhat, scripts de déploiement et tests JS
    - Contrats clés: 
      - `ReferralRegistry.sol` : Système de parrainage avec codes à usage unique
      - `AxoneToken.sol` : Token natif AXN (18 décimales)
      - `AxoneSale.sol` : Vente publique d'AXN contre USDC avec protection slippage
      - Modules vaults : STRATEGY_1 (VaultContract + CoreInteractionHandler)
      - Système de staking : `RewardsHub.sol`, `EmissionController.sol` (voir [Staking/README.md](../contracts/src/Staking/README.md))
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
|  Pages: /market,      |            |  - WagmiProvider           |
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
- Documentation des contrats (détails récents):
  - [ReferralRegistry — système de parrainage avec codes à usage unique](./contracts/ReferralRegistry.md)
  - [AxoneSale — vente publique USDC avec protection slippage](./contracts/AxoneSale.md)
  - [CoreInteractionHandler — rôle rebalancer et sécurité](./contracts/CoreInteractionHandler.md)
  - [VaultContract — frais de retrait par paliers](./contracts/VaultContract.md)
  - [STRATEGY_1 VaultContract — dépôts HYPE et NAV USD](./contracts/STRATEGY_1_VaultContract.md)
  - [Système de Staking — RewardsHub et EmissionController](./contracts/StakingSystem.md)

## Guide d’intégration rapide Vault + Handler

1) Déployer les contrats
- Déployer `CoreInteractionHandler` (USDC) et/ou `CoreInteractionHandler` HYPE50 (sans paramètre `hype`; HYPE est natif).
- Déployer le `VaultContract` compatible (USDC ou HYPE50).

2) Lier le vault au handler et configurer l’approval
- Appeler `vault.setHandler(address(handler))` depuis l’owner du vault.
- USDC: approval USDC illimitée; HYPE50: pas d’approval (dépôts natifs payable).

3) Configurer Core (handler)
- `handler.setVault(address(vault))`.
- USDC: `handler.setUsdcCoreLink(systemAddress, usdcTokenId)`
- HYPE50: `handler.setHypeCoreLink(systemAddress, hypeTokenId)`
- Commun: `handler.setSpotIds(btcSpot, hypeSpot)` + `handler.setSpotTokenIds(usdcTokenId, btcTokenId, hypeTokenId)`

4) Paramétrer le vault
- Définir `setFees(depositFeeBps, withdrawFeeBps, autoDeployBps)`.
- Définir les paliers via `setWithdrawFeeTiers(...)` (USDC 1e8 pour USDC, HYPE 1e18 pour STRATEGY_1).

5) Dépôts
- USDC vault: `vault.deposit(amount1e8)` puis auto-deploy vers `executeDeposit(amount1e8, true)`.
- STRATEGY_1 vault: `vault.deposit()` (payable, montant via `msg.value`) puis auto-deploy vers `executeDepositHype{value: deployAmt}(true)`.

6) Rappel de liquidités
- USDC: `vault.recallFromCoreAndSweep(amount1e8)` → `pullFromCoreToEvm` + `sweepToVault`.
- STRATEGY_1: `vault.recallFromCoreAndSweep(amount1e18)` → `pullHypeFromCoreToEvm` + `sweepHypeToVault`.

7) Vérifications rapides
- Après `setHandler`, vérifier l’`allowance` illimitée du token de dépôt vers le handler (USDC uniquement).
- Tester un petit `deposit` et confirmer la mise à jour NAV.
