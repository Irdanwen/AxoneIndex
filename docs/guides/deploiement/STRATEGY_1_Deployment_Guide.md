### Guide de déploiement – STRATEGY_1 (VaultContract + CoreInteractionHandler)

<!--
title: "Déploiement STRATEGY_1"
lang: fr
updated: 2025-10-24
owner: Axone Team
-->

Ce document décrit l'architecture, les paramètres, et les étapes de déploiement des contrats STRATEGY_1: `VaultContract` (parts du coffre) et `CoreInteractionHandler` (passerelle EVM/Core pour gestion spot et rééquilibrage 50/50 BTC/HYPE).

---

### Vue d'ensemble

- **VaultContract**: émet des parts (type ERC20 light, `sAXN1`), reçoit des dépôts en HYPE natif, calcule la NAV et gère les retraits (cash immédiat si trésorerie suffisante sinon file d'attente). Peut auto-déployer une fraction des dépôts vers Core via le `handler`.
- **CoreInteractionHandler**: reçoit le HYPE natif du coffre, crédite le solde spot côté Core, place des ordres IOC pour acheter/vendre BTC/HYPE afin de viser **50/50** avec bande morte (deadband), rapatrie le HYPE depuis Core vers EVM quand requis, applique des limites de débit (rate limit) et des frais de sweep.

---

### Constructeurs et dépendances

- CoreInteractionHandler
  - `constructor(L1Read _l1read, IERC20 _usdc, uint64 _maxOutboundPerEpoch, uint64 _epochLength, address _feeVault, uint64 _feeBps)`
  - Dépend de `L1Read` et de l'adresse système `CoreWriter` (constante `0x3333…3333`)

- VaultContract
  - `constructor()` (aucun paramètre)
  - Dépôts en HYPE natif (payable), pas d'USDC

---

### Variables à renseigner et quoi mettre dedans

Toutes les unités sont précisées entre parenthèses.

- Pour CoreInteractionHandler (au déploiement)
  - **L1READ_ADDRESS**: adresse du contrat `L1Read` sur votre EVM (wrapper de lectures Core precompile).
  - **USDC_TOKEN_EVM**: adresse ERC-20 USDC sur l’EVM (8 décimales).
  - **MAX_OUTBOUND_PER_EPOCH_1e8 (uint64)**: plafond d'équivalent USD émis EVM→Core par epoch, en unités 1e8. Ex: 100k USD → `100000 * 1e8`.
  - **EPOCH_LENGTH_BLOCKS (uint64)**: ⚠️ **IMPORTANT** : durée d'une epoch **EN NOMBRE DE BLOCS** (pas en secondes). Le contrat utilise `block.number` pour éviter la manipulation des timestamps par les validateurs. Exemples de calcul :
    - Sur HyperEVM (~2 sec/bloc) : 1 jour = 43200 blocs (86400 sec ÷ 2)
    - Sur Ethereum mainnet (~12 sec/bloc) : 1 jour = 7200 blocs (86400 sec ÷ 12)
    - Sur Polygon (~2 sec/bloc) : 1 jour = 43200 blocs
    - ⚠️ **Erreur courante** : Ne PAS utiliser `86400` directement (valeur en secondes), cela créerait une epoch de 86400 blocs ≈ 12-20 jours selon la chaîne !
  - **FEE_VAULT_ADDRESS**: adresse (multisig) recevant les frais de sweep.
  - **FEE_BPS (uint64)**: frais en bps (0–10000), appliqués dans `sweepHypeToVault`.

-- CoreInteractionHandler (post-déploiement, owner)
  - `setVault(VAULT_ADDRESS)`: définir l'adresse du coffre (`VaultContract`).
  - `setHypeCoreLink(HYPE_CORE_SYSTEM_ADDRESS, HYPE_CORE_TOKEN_ID)`:
    - `HYPE_CORE_SYSTEM_ADDRESS`: adresse système Core pour créditer le HYPE spot.
    - `HYPE_CORE_TOKEN_ID (uint64)`: ID du token HYPE côté Core. `0` est désormais accepté.
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
  - `setWithdrawFeeTiers([{amount1e18, feeBps}, ...])`: paliers de frais selon montant brut (HYPE 1e18), triés par `amount1e18` croissant.
  - `pause()` / `unpause()`: gel/dégel des opérations.

Où trouver les IDs Core

- Via `L1Read` (si déployé):
  - `spotInfo(spotId)` → tokens du marché.
  - `tokenInfo(tokenId)` → infos d'un token.
- Dans la documentation/portail Core: IDs de marchés (BTC/USDC, HYPE/USDC), IDs tokens (USDC, BTC, HYPE) et `HYPE_CORE_SYSTEM_ADDRESS`.

---

### Ordre de déploiement recommandé

> ℹ️ **CoreWriter** : aucune adresse n’est passée au constructeur. Le handler utilise directement l’adresse système `0x3333…3333`. Assurez-vous que le compte HyperCore du handler est initialisé (micro-transfert Core) avant tout envoi d’action, sinon les appels revertent avec `CoreAccountMissing()`.

1. `L1Read`
   - Déployer le contrat utilitaire de lectures Core (precompile wrappers).
2. `CoreInteractionHandler`
   - Paramètres du constructeur:
     - `l1read = L1READ_ADDRESS`
     - `usdc = USDC_TOKEN_EVM`
     - `maxOutboundPerEpoch = MAX_OUTBOUND_PER_EPOCH_1e8`
     - `epochLength = EPOCH_LENGTH_BLOCKS` ⚠️ **EN BLOCS, PAS EN SECONDES**
     - `feeVault = FEE_VAULT_ADDRESS`
     - `feeBps = FEE_BPS`
3. `VaultContract`
   - Aucun paramètre du constructeur (HYPE natif)
5. Configuration (owner)
   - Handler:
     - `setVault(VAULT_ADDRESS)`
     - `setHypeCoreLink(HYPE_CORE_SYSTEM_ADDRESS, HYPE_CORE_TOKEN_ID)`
     - `setSpotIds(SPOT_BTC_ID, SPOT_HYPE_ID)`
     - `setSpotTokenIds(USDC_TOKEN_ID, BTC_TOKEN_ID, HYPE_TOKEN_ID)`
     - Optionnel: `setLimits(...)`, `setParams(...)`, `setMaxOracleDeviationBps(...)`, `setFeeConfig(...)`, `setRebalancer(...)`
   - Vault:
     - `setHandler(HANDLER_ADDRESS)`
     - `setFees(DEPOSIT_FEE_BPS, WITHDRAW_FEE_BPS, AUTO_DEPLOY_BPS)`
     - `setWithdrawFeeTiers([...])`
     - `unpause()`
6. Vérifications rapides
   - `handler.vault()` == adresse du vault.
   - `vault.handler()` == adresse du handler.
  - `handler.hypeCoreSystemAddress` est défini (non `address(0)`). `hypeCoreTokenId` peut valoir `0` selon le réseau. `spotBTC`, `spotHYPE`, `spotTokenBTC`, `spotTokenHYPE` sont définis.
   - `vault.pps1e18()` == `1e18` quand `totalSupply==0`.

---

### Recommandations de valeurs initiales (exemples)

- `MAX_OUTBOUND_PER_EPOCH_1e8`: 100k USD ⇒ `100000 * 1e8`.
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
- Le vault n'a pas besoin d'allowance (dépôts natifs payable).
- Tester sur testnet:
  - Dépôt faible (ex. 0.1 HYPE), observer achats IOC (`executeDepositHype`).
  - Vérifier `nav1e18`, `pps1e18`.
  - Tester retrait cash et mise en file, puis `settleWithdraw` et `cancelWithdrawRequest`.

---

### Annexes – Fonctions clés (référence)

-- Handler
  - `executeDepositHype(bool forceRebalance)` (payable)
  - `pullHypeFromCoreToEvm(uint256 hype1e8)`
  - `sweepHypeToVault(uint256 amount1e18)`
  - `rebalancePortfolio(uint128 cloidBtc, uint128 cloidHype)`
  - Admin: `setVault`, `setHypeCoreLink`, `setSpotIds`, `setSpotTokenIds`, `setLimits`, `setParams`, `setMaxOracleDeviationBps`, `setFeeConfig`, `setRebalancer`

-- Vault
  - `deposit()` (payable)
  - `withdraw(uint256 shares)` / `settleWithdraw(...)` / `cancelWithdrawRequest(...)`
  - Admin: `setHandler`, `setFees`, `setWithdrawFeeTiers`, `pause`/`unpause`, `recallFromCoreAndSweep`



