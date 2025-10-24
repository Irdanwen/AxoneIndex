# Checklist de Déploiement — Axone Contracts

## Ordre d’Initialisation

1. Déployer `CoreInteractionHandler`
   - Renseigner le constructeur: `L1Read`, `CoreWriter`, `USDC`, `maxOutboundPerEpoch`, `epochLength`, `feeVault`, `feeBps` (≤ 10000)
   - Appeler:
     - `setSpotIds(btcSpot, hypeSpot)`
     - `setSpotTokenIds(usdcToken, btcToken, hypeToken)` (⚠️ n’écrase pas un `usdcCoreTokenId` existant)
     - `setUsdcCoreLink(systemAddress, usdcTokenId)`
     - (HYPE50) `setHypeCoreLink(systemAddress, hypeTokenId)`
     - `setParams(maxSlippageBps, marketEpsilonBps, deadbandBps ≤ 50)`
     - `setMaxOracleDeviationBps(bps)` (ex: 500 = 5%)
     - `setRebalancer(rebalancerAddress)`
     - `setLimits(maxOutboundPerEpoch, epochLength)`

2. Déployer `VaultContract`
   - (BTC50) Constructeur: `IERC20 usdc`
   - (HYPE50) Aucun paramètre; dépôts en natif
   - Lier Vault ↔ Handler:
     - `vault.setHandler(handler)` (approval USDC illimitée côté BTC50)
     - `handler.setVault(vault)`
   - Configurer:
     - `vault.setFees(depositFeeBps, withdrawFeeBps, autoDeployBps)` (ex: 9000 pour 90%)
     - (Optionnel) `vault.setWithdrawFeeTiers(tiers)` (≤ 10 paliers, triés)

3. Déployer `AxoneToken` et `AxoneSale` (si applicable)
   - `AxoneToken`:
     - Constructeur: `initialRecipient`, `inflationRecipient`, `initialOwner`
     - `setExcludedFromCirculating(addr, true)` pour trésorerie/vesting/burn si nécessaire
     - Configurer `inflationInterval` (min 1h), `mintInflation()` selon la politique
   - `AxoneSale`:
     - Définir `setTreasury(address)`
     - Ajuster `updatePrice(newPrice)` et `setMaxSlippageBps(bps ≤ 1000)`
     - Approvisionner le contrat en AXN (>= `saleCap` si souhaité)

## Points de Vigilance

- USDC en 1e8 (EVM et Core). Ne pas utiliser 1e6.
- `deadbandBps ≤ 50` sinon revert dans `setParams`.
- `epochLength` est en nombre de blocs (rate limiting par blocs).
- `setSpotTokenIds` n’écrase pas un `usdcCoreTokenId` déjà défini (revert si conflit).
- `settleWithdraw` doit payer exactement le net dû calculé avec le BPS figé.
- `VaultContract.pps1e18()` vaut `1e18` à `totalSupply == 0`.
- `CoreInteractionHandler.sweepToVault` applique des frais si `feeBps > 0` et `feeVault` non nul.
- (HYPE50) Dépôts natifs `deposit()` et sweeps `sweepHypeToVault(amount1e18)`.

## Tests Rapides Post‑Déploiement

- Dépôt test:
  - (BTC50) `USDC.approve(vault, amount1e8)` puis `vault.deposit(amount1e8)`
  - (HYPE50) `vault.deposit()` avec `msg.value`
- Vérifier auto‑déploiement (`autoDeployBps`) et logs `SpotOrderPlaced` (HYPE50) ou envois IOC (BTC50).
- Retrait test immédiat (petite somme) puis retrait en file (grande somme) et `settleWithdraw`.
- Rappel `handler.pullFromCoreToEvm` + `handler.sweepToVault` ou `sweepHypeToVault`.

## Rôles et Accès

- Owner handler: paramétrage Core, limites, rebalancer, frais, pause.
- Owner vault: handler, frais, paliers, pause; règlement/cancel des retraits.
- Rebalancer: `rebalancePortfolio`.


