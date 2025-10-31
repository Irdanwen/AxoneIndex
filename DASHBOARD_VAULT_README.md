# Dashboard & Vault Admin - Documentation

Ce document décrit les nouvelles fonctionnalités ajoutées à l'application Axone pour la gestion des vaults et l'affichage du dashboard.

## Fonctionnalités ajoutées

### 1. Page d'administration des vaults (`/admin/vaults`)

Cette page permet de configurer les adresses des contrats et les IDs des tokens Core.

**Configuration disponible :**
- **Adresses des contrats**
  - USDC (ERC-20)
  - Vault (HYPE50 Defensive)
  - CoreInteractionHandler
  - L1Read

- **Token IDs Core**
  - USDC Token ID
  - HYPE Token ID
  - BTC Token ID

Les configurations sont sauvegardées dans le localStorage sous la clé `axone:vault-config:v1`.

### 2. Page Dashboard (`/dashboard`)

Affiche les informations suivantes :

- **Section Compte**
  - Balance HYPE (natif) de l'utilisateur connecté

- **Section Vault**
  - Parts du vault détenues par l'utilisateur
  - Total Supply du vault

- **Section Core**
  - Balances du Handler sur Hypercore pour USDC, HYPE et BTC
  - Affichage des Token IDs configurés

### 3. Page Vault (`/vault`)

Permet d'effectuer les opérations suivantes :

- **Deposit** : Déposer des HYPE (natifs) dans le vault (utilise `deposit()` payable)
- **Withdraw** : Retirer des parts du vault (utilise `withdraw(uint256)`), paiement en HYPE

La page affiche en temps réel :
- Balance HYPE de l'utilisateur
- Parts du vault détenues

## Configuration requise

1. **Connecter un wallet** : Toutes les pages nécessitent une connexion wallet
2. **Configurer les adresses** : Aller sur `/admin/vaults` et renseigner toutes les adresses et IDs requis
3. **Réseau** : L'application est configurée pour HyperEVM Testnet (chainId: 998)

## Architecture technique

### Hooks créés
- `useVaultConfig` : Gestion de la configuration (lecture/écriture localStorage)
- `useDashboardData` : Agrégation des données pour le dashboard

### Contrats wrapper
- `erc20.ts` : Wrapper pour les tokens ERC-20
- `vault.ts` : Wrapper pour le vault HYPE50 Defensive
- `l1read.ts` : Wrapper pour la lecture des balances Core
- `coreInteractionHandler.ts` : Wrapper pour le handler

### Utilitaires
- `vaultConfig.ts` : Gestion de la configuration
- `format.ts` : Formatage des nombres et adresses

## Utilisation

### 1. Configuration initiale

1. Naviguer vers `/admin/vaults`
2. Renseigner toutes les adresses de contrats
3. Renseigner les Token IDs pour USDC, HYPE et BTC
4. Cliquer sur "Enregistrer"

### 2. Consultation du dashboard

1. Naviguer vers `/dashboard`
2. Les données se chargent automatiquement si la configuration est valide
3. Les balances sont mises à jour en temps réel

### 3. Opérations sur le vault

1. Naviguer vers `/vault`
2. Pour déposer :
   - Entrer le montant HYPE à déposer et cliquer "Déposer"
3. Pour retirer :
   - Entrer le nombre de parts à retirer
   - Cliquer "Retirer"

## Notes importantes

- Les transactions nécessitent des frais de gas sur HyperEVM
- Les dépôts de la page Vault sont en HYPE natif (1e18); les parts du vault ont 18 décimales
- Les montants USDC sont en 8 décimales (1e8) sur HyperEVM (Core et EVM)
- PPS/NAV sont exprimés en USD 1e18; les oracles (BTC/HYPE) exposent des prix en 1e8
- Garde UI: le dashboard applique une normalisation visuelle (anti double‑scaling) pour `pps1e18` et `equitySpotUsd1e18`. Les valeurs brutes on‑chain sont lues (bigint), formatées en 1e18 puis, si une sur‑échelle évidente est détectée (ex: PPS >> 1e9), l’affichage est automatiquement re‑normalisé (division 1e18) sans affecter les calculs on‑chain.
- Le formatage numérique de l'application utilise la locale fr-FR
- La configuration est persistée localement dans le navigateur

## Adresse USDC par défaut

Si aucune adresse n'est configurée, l'adresse USDC par défaut est :
`0xd9CBEC81df392A88AEff575E962d149d57F4d6bc`