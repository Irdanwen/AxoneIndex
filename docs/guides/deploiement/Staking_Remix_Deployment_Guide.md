### Guide Remix — Déploiement et Utilisation des contrats de Staking (AXN, EmissionController, Vault)

<!--
title: "Déploiement Staking — Remix"
lang: fr
updated: 2025-10-24
owner: Axone Team
-->

Ce guide explique comment déployer et utiliser les smart contracts suivants dans Remix IDE:
- `AXN.sol` (ERC20 avec inflation continue et frappe contrôlée)
- `EmissionController.sol` (distribution des récompenses en mode mint ou drip)
- `Vault.sol` (parts ERC20 sur dépôts USDC, auto-déploiement, file de retrait)

Ce guide est adapté à Remix: étapes concrètes, paramètres exacts, unités et cas d’usage.

---

## 1) Pré-requis

- Navigateur avec Metamask connecté au réseau cible (testnet recommandé pour essais)
- Remix IDE: `https://remix.ethereum.org`
- Adresse du token USDC sur le réseau (8 décimales) si vous déployez le Vault
- Éventuels rôles: `owner`, `rewardsHub` (bénéficiaire des récompenses), `handler` (connecteur Core)

### Configuration Remix
- Onglet Solidity Compiler:
  - Version: 0.8.26 (compatible avec `^0.8.20`, `^0.8.24`, `^0.8.26`)
  - Enable Optimization: ON (runs: 200)
- Résolution des imports OpenZeppelin (choisir une option):
  - Option A (recommandée): utiliser remixd pour monter votre dossier local `contracts/` (avec `node_modules`) dans Remix.
    - Installer: `npm i -g @remix-project/remixd`
    - Lancer: `remixd -s /Users/morganmagalhaes/Documents/Codage/Cursor/AxoneIndex/contracts --remix-ide https://remix.ethereum.org`
    - Dans Remix: “Connect to Localhost” → utilisez ce workspace. Les imports `@openzeppelin/...` seront résolus.
  - Option B: copier manuellement les contrats dans Remix et remplacer/ajuster les imports par des chemins/URLs compatibles.

### Fichiers à importer dans Remix
- `contracts/src/Staking/AXN.sol`
- `contracts/src/Staking/EmissionController.sol`
- `contracts/src/Staking/Vault.sol`
- `contracts/src/Staking/interfaces/IMintable.sol`

Compilez pour vérifier que tout passe.

---

## 2) Déployer AXN (token ERC20 avec inflation)

### Constructor (AXN)
- `_initialRecipient`: reçoit `INITIAL_SUPPLY` (100M AXN, 18 décimales)
- `_inflationRecipient`: adresse recevant les frappes d’inflation
- `_initialOwner`: owner initial (peut configurer/pause/mint)

### Étapes Remix
1. Onglet “Deploy & Run Transactions” → Environment: Injected Provider (Metamask)
2. Sélectionnez `AxoneToken` (fichier `AXN.sol`)
3. Renseignez les paramètres:
   - `_initialRecipient`: ex `0xVotreAdresse`
   - `_inflationRecipient`: ex `0xTresorerie`
   - `_initialOwner`: ex `0xVotreAdresse` (ou multi-sig)
4. Cliquez “Deploy” → conservez l’adresse du contrat `AXN`.

### Utilisation AXN (dans Remix)
- Frapper l’inflation (après `inflationInterval`):
  - `mintInflation()`
- Mettre à jour l’intervalle d’inflation (min 1h):
  - `setInflationInterval(86400)` pour 1 jour
- Changer le destinataire des frappes:
  - `setInflationRecipient(0x...)`
- Frappe directe par l’owner (compatibilité EmissionController en mode mint):
  - `mint(0xBeneficiaire, 10000e18)` (valeur en wei, ex: `10000000000000000000000`)
- Pause / Unpause:
  - `pause()` / `unpause()`
- Info:
  - `nextMintTimestamp()` (timestamp de la prochaine frappe autorisée)
  - `circulatingSupply()` (attention: potentiellement coûteux si beaucoup d’adresses exclues)

Astuce unités: AXN a 18 décimales (1 AXN = 1e18).

---

## 3) Déployer EmissionController (distribution des récompenses)

### Constructor
- `rewardToken_`: adresse du token de récompense (ex: AXN)
- `rewardPerSecond_`: tokens par seconde, en décimales du token (AXN: 18)
- `isMintMode_`: `true` (frappe) ou `false` (drip depuis réserve)

### Étapes Remix
1. Sélectionnez `EmissionController` (fichier `EmissionController.sol`)
2. Paramètres d’exemple:
   - `rewardToken_`: adresse d’AXN déployé
   - `rewardPerSecond_`: ex `500000000000000000` (0.5 AXN/s)
   - `isMintMode_`: `true`
3. “Deploy” → notez l’adresse du contrôleur.

### Configuration post-déploiement
- Définir le hub autorisé à tirer les récompenses:
  - `setRewardsHub(0xHub)`
- Mode mint (`isMintMode = true`) avec AXN:
  - Le contrôleur doit être `owner` d’AXN pour appeler `mint()`.
  - Dans `AXN`, exécutez `transferOwnership(EmissionController.address)` depuis l’owner courant.
- Mode drip (`isMintMode = false`):
  - Transférez un stock de tokens (AXN) vers l’adresse du contrôleur pour couvrir les `pull()`.

### Utilisation (par le hub)
- Connectez Metamask avec le compte `rewardsHub`.
- Appelez `pull()` sur le contrôleur depuis Remix:
  - En mint: frappe de `amount` AXN vers `rewardsHub`
  - En drip: transfert depuis la réserve du contrôleur vers `rewardsHub`
- Ajuster le débit:
  - `setRewardPerSecond(250000000000000000)` (0.25 AXN/s)
- Basculer de mode:
  - `toggleMintMode(true|false)` (attention aux prérequis ownership/stock)

---

## 4) Déployer Vault (parts ERC20 adossées à USDC)

### Constructor
- `_usdc`: adresse du token USDC (8 décimales) sur le réseau cible

### Étapes Remix
1. Sélectionnez `VaultContract` (fichier `Vault.sol`)
2. Paramètre: `_usdc` (adresse USDC)
3. “Deploy” → notez l’adresse du `Vault`.

### Configuration post-déploiement
- `setHandler(0xHandlerOuZero)`:
  - Si non connecté à Core: `0x0000000000000000000000000000000000000000`
  - Sinon, adresse du handler (le Vault fera un `forceApprove` illimité sur USDC vers ce handler)
- `setFees(depositFeeBps, withdrawFeeBps, autoDeployBps)`:
  - BPS base 10000 (ex: `50, 100, 9000` → 0.5% dépôt, 1% retrait, 90% auto-deploy)
- `setWithdrawFeeTiers(tiers)`:
  - Tableau de structures trié par `amount1e8` (USDC en 1e8) croissant.
  - Remix n’encode pas facilement un tableau de structs dans l’UI simple. Options:
    - Utiliser l’onglet “Low level interactions” pour encoder l’ABI manuellement
    - Déployer temporairement un contrat helper pour pousser les paliers
    - Démarrer sans paliers (appel avec `[]`) puis mettre à jour hors Remix si besoin

### Unités et conversions
- USDC (ERC20): 8 décimales (approve en 1e8)
- Vault.deposit/withdraw queue: USDC en 1e8
- Parts du Vault: 18 décimales; PPS/NAV en 1e18

---

## 5) Interactions types (pas-à-pas Remix)

### A) Dépôt dans le Vault
1. Dans l’ERC20 USDC (via “At Address” + ABI ERC20 standard), `approve(Vault.address, allowance)`
   - Ex: 1,000 USDC → `100000000000` (1e3 × 1e8)
2. Dans `Vault`, `deposit(amount1e8)`
   - Ex: 1,000 USDC → `100000000000` (1e3 × 1e8)

Effets:
- Mint de parts au PPS courant (frais dépôt appliqués en parts si configurés)
- Auto-déploiement vers handler si `handler != 0` et `autoDeployBps > 0`

### B) Retrait
- `withdraw(shares)` (montant de parts, 18 décimales)
  - Si trésorerie USDC suffisante: paiement immédiat
  - Sinon: création d’une demande en file (`WithdrawRequested` avec `id`)

- Annuler (initiateur uniquement): `cancelWithdrawRequest(id)` → restaure les parts
- Régler (owner/handler): `settleWithdraw(id, to)`
  - Le montant est calculé automatiquement par le smart contract

### C) Calcul des frais de retrait
- `getWithdrawFeeBpsForAmount(amount1e8)` renvoie le BPS qui s’applique à un brut en 1e8
- Les paliers doivent être triés par `amount1e8` croissant, sinon `setWithdrawFeeTiers` revert

### D) Auto-deploy et recall Core
- À chaque dépôt, une fraction `autoDeployBps` est envoyée au Core via `handler.executeDeposit(...)` (montants strictement en 1e8)
- Rappel: `recallFromCoreAndSweep(amount1e8)` → `pullFromCoreToEvm` puis `sweepToVault`

---

## 6) Scénarios d’exemple

### Scénario 1 — Emission en mode mint
1. Déployer AXN (owner = vous)
2. Déployer EmissionController avec `rewardToken = AXN`, `rewardPerSecond = 5e17` (0.5), `isMintMode = true`
3. Dans AXN: `transferOwnership(EmissionController.address)` depuis l’owner
4. Dans EmissionController: `setRewardsHub(0xVotreEOA)`
5. Connectez Metamask avec `0xVotreEOA` (hub) → `pull()` → le hub reçoit l’AXN frappé

### Scénario 2 — Emission en mode drip
1. Déployer AXN (owner = vous)
2. Déployer EmissionController avec `isMintMode = false`
3. Transférer un stock d’AXN au contrôleur
4. `setRewardsHub(0xVotreEOA)`
5. Hub → `pull()` → transfert depuis la réserve vers le hub

### Scénario 3 — Dépôt et retrait via Vault
1. Déployer `VaultContract` avec l’adresse USDC
2. `setFees(50, 100, 9000)` (0.5% dépôt, 1% retrait, 90% auto-deploy)
3. USDC ERC20 (At Address) → `approve(Vault, 1000000000)` pour 1,000 USDC
4. Vault → `deposit(100000000000)` (1,000 en 1e8)
5. `withdraw(“10e18”)` (ex: `10000000000000000000`)
   - Si insuffisant en USDC: file créée; noter `id`
6. Owner/handler → `settleWithdraw(id, user)` (montant calculé automatiquement)

---

## 7) Bonnes pratiques et dépannage

- Permissions
  - AXN: owner pour `mint()` et paramètres d’inflation
  - EmissionController: `rewardsHub` seul peut `pull()`
  - Vault: owner/handler seuls peuvent `settleWithdraw()`

- Mode mint du contrôleur
  - Assurez-vous que le contrôleur est owner d’AXN avant `pull()`
  - Sinon, utilisez le mode drip et approvisionnez le contrôleur

- Unités
  - AXN: 18 décimales
  - USDC: 8 décimales
  - Vault: `deposit(amount1e8)` en 1e8; parts en 18 décimales

- Paliers de frais (Vault)
  - Toujours triés par `amount1e8` croissant
  - Sinon revert: `tiers not sorted`

- Erreurs fréquentes
  - Revert `auth`: fonction appelée par une mauvaise adresse (ex: `pull()` sans être `rewardsHub`)
  - Revert en `pull()` drip: réserve insuffisante → approvisionner le contrôleur
  - Les montants sont maintenant calculés automatiquement dans `settleWithdraw`, plus besoin de calculer off-chain

---

## 8) Récapitulatif des paramètres

- AXN: `_initialRecipient`, `_inflationRecipient`, `_initialOwner`
- EmissionController: `rewardToken`, `rewardPerSecond` (wei), `isMintMode`, puis `setRewardsHub(hub)`
  - Mode mint: le contrôleur doit posséder AXN (ownership)
- Vault: `USDC`, puis `setHandler`, `setFees`, `setWithdrawFeeTiers` (triés)

---

## 9) Annexes — Valeurs d’exemple (à copier dans Remix)

- `rewardPerSecond` (AXN 18 décimales):
  - 0.25 AXN/s → `250000000000000000`
  - 0.50 AXN/s → `500000000000000000`
  - 1.00 AXN/s → `1000000000000000000`

- `deposit(amount1e8)` (USDC):
  - 100 USDC → `10000000000`
  - 1,000 USDC → `100000000000`
  - 10,000 USDC → `1000000000000`

- Parts (18 décimales):
  - 1 part → `1000000000000000000`
  - 10 parts → `10000000000000000000`
  - 100 parts → `100000000000000000000`

Si vous me fournissez vos adresses (USDC, handler, hub) et le réseau, je peux pré-remplir une liste de paramètres prête à coller dans les champs Remix.



