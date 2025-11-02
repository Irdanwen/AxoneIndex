# VaultContract — Frais de Retrait par Paliers et Flux

> Note: Cette page décrit un ancien modèle USDC‑based. L’implémentation active utilisée en production est `contracts/src/STRATEGY_1/VaultContract.sol` (dépôts HYPE natifs). Voir `STRATEGY_1_VaultContract.md` pour la référence à jour.

## Résumé
`VaultContract.sol` émet des parts (18 décimales) contre des dépôts en HYPE natif (1e18 sur HyperEVM), gère la NAV/PPS, des retraits immédiats ou différés, et l'auto-déploiement partiel vers Core. Les frais de retrait dépendent du montant retiré (brut), via des paliers configurables. Le vault n'a pas besoin d'approval pour HYPE natif et transmet directement les montants en 1e18 au Handler.

## 🔒 Améliorations de Sécurité

### Corrections Critiques Implémentées
- **Validation de l'adresse zéro** : `setHandler()` vérifie que l'handler n'est pas `address(0)`
- **Approval sécurisé** : Remplacement de `forceApprove` par le pattern standard `approve(0)` + `approve(max)`
- **Respect du modèle CEI** : Mise à jour d'état avant les interactions externes dans `deposit()`
- **Validation des tranches** : Vérification que les paliers de frais sont triés par montant croissant
- **Limitation des paliers** : Maximum 10 paliers pour éviter les coûts de gas excessifs
- **🚨 CORRECTION CRITIQUE** : **Destruction des parts corrigée** - Les parts ne sont plus brûlées immédiatement dans `withdraw()`, permettant l'annulation des retraits
- **⚡ OPTIMISATION GAZ** : **Calculs redondants éliminés** - `nav1e18()` n'est plus appelé deux fois par transaction

## Frais de Retrait
- `setFees(depositFeeBps, withdrawFeeBps, autoDeployBps)` fixe les valeurs par défaut.
- `setWithdrawFeeTiers(WithdrawFeeTier[])` permet d'ajouter des paliers:
  - `WithdrawFeeTier { uint256 amount1e18; uint16 feeBps; }`
  - Les paliers sont interprétés dans l'ordre: le premier `amount1e18` supérieur ou égal au montant brut détermine `feeBps`.
  - Si aucun palier ne correspond, fallback sur `withdrawFeeBps`.
  - **Sécurité** : Maximum 10 paliers, validation de l'ordre croissant des montants
- `getWithdrawFeeBpsForAmount(uint256 amount1e18)` retourne le BPS applicable.

## Retraits
- `withdraw(uint256 shares)`:
  - **🚨 CORRECTION** : Calcule le NAV une seule fois et le réutilise pour optimiser le gaz
  - Calcule le montant brut en HYPE à partir du PPS courant.
  - Applique `feeBps` déterminé par `getWithdrawFeeBpsForAmount(gross1e18)`.
  - **🚨 CORRECTION** : Si paiement immédiat → brûle les parts maintenant, sinon les garde pour l'annulation
  - Si la trésorerie EVM couvre le montant net → paiement immédiat et événement `WithdrawPaid`.
  - Sinon → mise en file avec snapshot du `feeBps` calculé à la demande.
- `settleWithdraw(uint256 id, address to)`:
  - **✅ SIMPLIFICATION** : Le montant est calculé automatiquement dans le smart contract
  - Calcule le NAV une seule fois et le réutilise pour optimiser le gaz
  - Recalcule le montant brut d'après le PPS courant.
  - Brûle les parts au moment du règlement final
  - Utilise le `feeBpsSnapshot` stocké dans la file pour calculer le paiement net.
- `cancelWithdrawRequest(uint256 id)`:
  - **🚨 CORRECTION** : Fonctionne maintenant correctement car les parts ne sont plus brûlées prématurément
  - Permet d'annuler une demande de retrait en file d'attente

## Événements
- `WithdrawRequested(id, user, shares)`
- `WithdrawPaid(id, to, amount1e18)`
- `WithdrawCancelled(id, user, shares)`
- `FeesSet(depositFeeBps, withdrawFeeBps, autoDeployBps)`
- `WithdrawFeeTiersSet()`

## Exemple de Configuration
```solidity
// Paliers de frais sur montant brut (USDC 1e8)
VaultContract.WithdrawFeeTier[] memory tiers = new VaultContract.WithdrawFeeTier[](3);
tiers[0] = VaultContract.WithdrawFeeTier({amount1e8: 100_000_000, feeBps: 50});    // <= 1 USDC : 0,50%
tiers[1] = VaultContract.WithdrawFeeTier({amount1e8: 1_000_000_000, feeBps: 30});  // <= 10 USDC : 0,30%
tiers[2] = VaultContract.WithdrawFeeTier({amount1e8: 10_000_000_000, feeBps: 10}); // <= 100 USDC : 0,10%
vault.setWithdrawFeeTiers(tiers);
```

## Notes
- Les dépôts utilisateurs précédemment utilisés pour calculer des frais “sur base de dépôt” ne sont plus pris en compte pour la détermination des frais; la logique est désormais strictement basée sur le montant brut.
- Les paliers doivent être définis en USDC 1e8 (8 décimales).

## Approvals USDC et Unités (1e8 ↔ 1e6)

- À l'appel de `setHandler(address handler)`, le vault accorde une approval USDC illimitée (pattern standard `approve(0)` + `approve(max)`) à l'`handler` pour permettre l'appel interne `safeTransferFrom(vault, handler, ...)` lors des dépôts vers Core.
- **Sécurité** : Validation que l'handler n'est pas `address(0)` avant l'approval
- Lors d’un dépôt, si `autoDeployBps > 0`, le vault calcule la part à déployer (`deployAmt` en 1e8) et appelle `handler.executeDeposit(deployAmt, true)` directement en 1e8.
- `recallFromCoreAndSweep(amount1e8)` appelle `handler.pullFromCoreToEvm(amount1e8)` puis `handler.sweepToVault(amount1e8)`. Plus aucune conversion 1e8↔1e6.
- NAV: comme USDC a 8 décimales sur HyperEVM, on multiplie le solde EVM par 1e10 dans `nav1e18()`.

### Checklist d’Intégration

- Déployer `CoreInteractionHandler` puis `VaultContract`.
- Appeler `vault.setHandler(handler)` pour initialiser l’approval illimitée.
- Configurer les IDs Core (via l’handler) et, si besoin, les paliers de frais côté vault.

## FAQ (résumé)

- **Unités USDC**: utiliser strictement 1e8 pour tous les montants (EVM et Core).
- **Paliers de frais**: définis en USDC 1e8; maximum 10 paliers, triés croissants.
- **Retraits différés**: le montant est calculé automatiquement dans `settleWithdraw`; utiliser `cancelWithdrawRequest` pour annuler avant règlement.
- **PPS initiale**: `pps1e18()` retourne `1e18` si `totalSupply == 0`.
- **Auto-déploiement**: `autoDeployBps` en bps; 9000 = 90%.
\- **Unités du PPS (1e18)**: `pps1e18()` renvoie un prix par part en 1e18 (USD). Le dashboard applique une garde de normalisation purement visuelle pour éviter tout affichage sur‑échelle si une double conversion 1e18 survenait en amont. Cette garde n’affecte pas les calculs on‑chain.
