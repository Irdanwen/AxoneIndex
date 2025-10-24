### Guide de déploiement – BTC50 Defensive (VaultContract + CoreInteractionHandler)

<!--
title: "Déploiement BTC50 Defensive"
lang: fr
updated: 2025-10-24
owner: Axone Team
-->

Ce document décrit l’architecture, les paramètres, et les étapes de déploiement des contrats BTC50 Defensive: `VaultContract` (parts du coffre) et `CoreInteractionHandler` (passerelle EVM/Core pour gestion spot et rééquilibrage 50/50 BTC/HYPE).

---

### Vue d’ensemble

- **VaultContract**: émet des parts (type ERC20 light, `c50USD`), reçoit des dépôts en USDC, calcule la NAV et gère les retraits (cash immédiat si trésorerie suffisante sinon file d’attente). Peut auto-déployer une fraction des dépôts vers Core via le `handler`.
- **CoreInteractionHandler**: reçoit l’USDC du coffre, crédite le solde spot côté Core, place des ordres IOC pour acheter/vendre BTC/HYPE afin de viser **50/50** avec bande morte (deadband), rapatrie l’USDC depuis Core vers EVM quand requis, applique des limites de débit (rate limit) et des frais de sweep.

---

### Constructeurs et dépendances

- CoreInteractionHandler
  - `constructor(L1Read _l1read, ICoreWriter _coreWriter, IERC20 _usdc, uint64 _maxOutboundPerEpoch, uint64 _epochLength, address _feeVault, uint64 _feeBps)`
  - Dépend de `L1Read`, `CoreWriter`, `USDC` (ERC20 8 décimales)

- VaultContract
  - `constructor(IERC20 _usdc)`
  - Dépend de `USDC` et d’un `handler` (le `CoreInteractionHandler`)

---

### Variables à renseigner et quoi mettre dedans

Toutes les unités sont précisées entre parenthèses.

- Pour CoreInteractionHandler (au déploiement)
  - **L1READ_ADDRESS**: adresse du contrat `L1Read` sur votre EVM (wrapper de lectures Core precompile).
  - **CORE_WRITER_ADDRESS**: adresse du contrat writer officiel pour envoyer des actions vers Core. À défaut, utiliser le stub `CoreWriter` pour tests.
  - **USDC_ADDRESS**: adresse ERC20 USDC (8 décimales) sur votre EVM.
  - **MAX_OUTBOUND_PER_EPOCH_1e8 (uint64)**: plafond d'USDC émis EVM→Core par epoch, en unités 1e8. Ex: 100k USDC → `100000 * 1e8`.
  - **EPOCH_LENGTH_BLOCKS (uint64)**: ⚠️ **IMPORTANT** : durée d'une epoch **EN NOMBRE DE BLOCS** (pas en secondes). Le contrat utilise `block.number` pour éviter la manipulation des timestamps par les validateurs. Exemples de calcul :
    - Sur HyperEVM (~2 sec/bloc) : 1 jour = 43200 blocs (86400 sec ÷ 2)
    - Sur Ethereum mainnet (~12 sec/bloc) : 1 jour = 7200 blocs (86400 sec ÷ 12)
    - Sur Polygon (~2 sec/bloc) : 1 jour = 43200 blocs
    - ⚠️ **Erreur courante** : Ne PAS utiliser `86400` directement (valeur en secondes), cela créerait une epoch de 86400 blocs ≈ 12-20 jours selon la chaîne !
  - **FEE_VAULT_ADDRESS**: adresse (multisig) recevant les frais de sweep.
  - **FEE_BPS (uint64)**: frais en bps (0–10000), appliqués dans `sweepToVault`.

-- CoreInteractionHandler (post-déploiement, owner)
  - `setVault(VAULT_ADDRESS)`: définir l'adresse du coffre (`VaultContract`).
  - `setUsdcCoreLink(USDC_CORE_SYSTEM_ADDRESS, USDC_CORE_TOKEN_ID)`:
    - `USDC_CORE_SYSTEM_ADDRESS`: adresse système Core pour créditer l'USDC spot.
    - `USDC_CORE_TOKEN_ID (uint64)`: ID du token USDC côté Core. `0` est désormais accepté.
  - `setSpotIds(SPOT_BTC_ID, SPOT_HYPE_ID)` (uint32/uint32): IDs marchés spot BTC/USDC et HYPE/USDC.
  - `setSpotTokenIds(USDC_TOKEN_ID, BTC_TOKEN_ID, HYPE_TOKEN_ID)` (uint64/uint64/uint64): IDs des tokens spot correspondants. `USDC_TOKEN_ID` doit égaler `usdcCoreTokenId`.
  - `setLimits(MAX_OUTBOUND_PER_EPOCH_1e8, EPOCH_LENGTH_BLOCKS)`: ajuste la rate limit. ⚠️ `EPOCH_LENGTH_BLOCKS` est exprimé **en nombre de blocs**, pas en secondes.
  - `setParams(MAX_SLIPPAGE_BPS, MARKET_EPSILON_BPS, DEADBAND_BPS)`:
    - `MAX_SLIPPAGE_BPS`: par ex. 50 (=0,5%).
    - `MARKET_EPSILON_BPS`: par ex. 10 (=0,1%) pour rendre les IOC "marketables".
    - `DEADBAND_BPS`: bande morte allocation (max 50 = 0,5%).
  - `setMaxOracleDeviationBps(MAX_ORACLE_DEV_BPS)`: ex. 500 (=5%).
  - `setFeeConfig(FEE_VAULT_ADDRESS, FEE_BPS)`: reconfigurer les frais au besoin.
  - `setRebalancer(REBALANCER_ADDRESS)`: opérateur autorisé à appeler `rebalancePortfolio`.

- Pour VaultContract (post-déploiement)
  - `setHandler(HANDLER_ADDRESS)`: lier le handler au coffre.
  - `setFees(DEPOSIT_FEE_BPS, WITHDRAW_FEE_BPS, AUTO_DEPLOY_BPS)`:
    - `DEPOSIT_FEE_BPS` (0–10000): frais sur parts mintées.
    - `WITHDRAW_FEE_BPS` (0–10000): frais par défaut sur retraits (si pas remplacé par palier).
    - `AUTO_DEPLOY_BPS` (0–10000): fraction auto-déployée des dépôts vers Core, ex. `9000` = 90%.
  - `setWithdrawFeeTiers([{amount1e8, feeBps}, ...])`: paliers de frais selon montant brut (USDC 1e8), triés par `amount1e8` croissant.
  - `pause()` / `unpause()`: gel/dégel des opérations.

Où trouver les IDs Core

- Via `L1Read` (si déployé):
  - `spotInfo(spotId)` → tokens du marché.
  - `tokenInfo(tokenId)` → infos d’un token.
- Dans la documentation/portail Core: IDs de marchés (BTC/USDC, HYPE/USDC), IDs tokens (USDC, BTC, HYPE) et `USDC_CORE_SYSTEM_ADDRESS`.

---

### Ordre de déploiement recommandé

1. USDC
   - Récupérer l’adresse USDC officielle de la chaîne ou déployer un mock pour test.
2. `L1Read`
   - Déployer le contrat utilitaire de lectures Core (precompile wrappers).
3. `CoreWriter`
   - Utiliser l’adresse writer officielle. À défaut, déployer le stub `CoreWriter` pour dev/test.
4. `CoreInteractionHandler`
   - Paramètres du constructeur:
     - `l1read = L1READ_ADDRESS`
     - `coreWriter = CORE_WRITER_ADDRESS`
     - `usdc = USDC_ADDRESS`
     - `maxOutboundPerEpoch = MAX_OUTBOUND_PER_EPOCH_1e8`
     - `epochLength = EPOCH_LENGTH_BLOCKS` ⚠️ **EN BLOCS, PAS EN SECONDES**
     - `feeVault = FEE_VAULT_ADDRESS`
     - `feeBps = FEE_BPS`
5. `VaultContract`
   - Paramètre du constructeur:
     - `usdc = USDC_ADDRESS`
6. Configuration (owner)
   - Handler:
     - `setVault(VAULT_ADDRESS)`
     - `setUsdcCoreLink(USDC_CORE_SYSTEM_ADDRESS, USDC_CORE_TOKEN_ID)`
     - `setSpotIds(SPOT_BTC_ID, SPOT_HYPE_ID)`
     - `setSpotTokenIds(USDC_TOKEN_ID, BTC_TOKEN_ID, HYPE_TOKEN_ID)`
     - Optionnel: `setLimits(...)`, `setParams(...)`, `setMaxOracleDeviationBps(...)`, `setFeeConfig(...)`, `setRebalancer(...)`
   - Vault:
     - `setHandler(HANDLER_ADDRESS)`
     - `setFees(DEPOSIT_FEE_BPS, WITHDRAW_FEE_BPS, AUTO_DEPLOY_BPS)`
     - `setWithdrawFeeTiers([...])`
     - `unpause()`
7. Vérifications rapides
   - `handler.vault()` == adresse du vault.
   - `vault.handler()` == adresse du handler.
  - `handler.usdcCoreSystemAddress` est défini (non `address(0)`). `usdcCoreTokenId` peut valoir `0` selon le réseau. `spotBTC`, `spotHYPE`, `spotTokenBTC`, `spotTokenHYPE` sont définis.
   - `vault.pps1e18()` == `1e18` quand `totalSupply==0`.

---

### Recommandations de valeurs initiales (exemples)

- `MAX_OUTBOUND_PER_EPOCH_1e8`: 100k USDC ⇒ `100000 * 1e8`.
- `EPOCH_LENGTH_BLOCKS`: ⚠️ **EXPRIMÉ EN BLOCS** :
  - **HyperEVM (≈2 sec/bloc)** :
    - 1 heure = `1800` blocs (3600 sec ÷ 2)
    - 1 jour = `43200` blocs (86400 sec ÷ 2)
    - 1 semaine = `302400` blocs
  - **Ethereum mainnet (≈12 sec/bloc)** :
    - 1 heure = `300` blocs (3600 sec ÷ 12)
    - 1 jour = `7200` blocs (86400 sec ÷ 12)
  - **Polygon (≈2 sec/bloc)** :
    - 1 heure = `1800` blocs
    - 1 jour = `43200` blocs
  - ⚠️ **NE JAMAIS utiliser des valeurs en secondes** (ex: 86400) directement !
- `MAX_SLIPPAGE_BPS`: `50` (0,5%).
- `MARKET_EPSILON_BPS`: `10` (0,1%).
- `DEADBAND_BPS`: `50` (0,5%).
- `MAX_ORACLE_DEV_BPS`: `500` (5%).
- `AUTO_DEPLOY_BPS`: `9000` (90%).
- Frais: démarrer bas (ex. dépôt 0–10 bps, retrait 10–50 bps) et affiner par paliers.

---

### Notes opérationnelles et sécurité

- Conserver `owner` des deux contrats sur un multisig.
- `rebalancer` peut être un bot/opérateur distinct.
- Le vault ajuste automatiquement l’allowance vers le handler avec `forceApprove`.
- Tester sur testnet:
  - Dépôt faible (ex. 10 USDC), observer achats IOC (`executeDeposit`).
  - Vérifier `nav1e18`, `pps1e18`.
  - Tester retrait cash et mise en file, puis `settleWithdraw` et `cancelWithdrawRequest`.

---

### Annexes – Fonctions clés (référence)

-- Handler
  - `executeDeposit(uint256 usdc1e8, bool forceRebalance)`
  - `pullFromCoreToEvm(uint256 usdc1e8)`
  - `sweepToVault(uint256 amount1e8)`
  - `rebalancePortfolio(uint128 cloidBtc, uint128 cloidHype)`
  - Admin: `setVault`, `setUsdcCoreLink`, `setSpotIds`, `setSpotTokenIds`, `setLimits`, `setParams`, `setMaxOracleDeviationBps`, `setFeeConfig`, `setRebalancer`

-- Vault
  - `deposit(uint256 amount1e8)`
  - `withdraw(uint256 shares)` / `settleWithdraw(...)` / `cancelWithdrawRequest(...)`
  - Admin: `setHandler`, `setFees`, `setWithdrawFeeTiers`, `pause`/`unpause`, `recallFromCoreAndSweep`



