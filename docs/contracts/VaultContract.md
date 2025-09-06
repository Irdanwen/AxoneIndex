# VaultContract — Frais de Retrait par Paliers et Flux

## Résumé
`VaultContract.sol` émet des parts (18 décimales) contre des dépôts en USDC (1e8), gère la NAV/PPS, des retraits immédiats ou différés, et l’auto-déploiement partiel vers Core. Les frais de retrait dépendent désormais du montant retiré (brut), via des paliers configurables.

## Frais de Retrait
- `setFees(depositFeeBps, withdrawFeeBps, autoDeployBps)` fixe les valeurs par défaut.
- `setWithdrawFeeTiers(WithdrawFeeTier[])` permet d’ajouter des paliers:
  - `WithdrawFeeTier { uint256 amount1e8; uint16 feeBps; }`
  - Les paliers sont interprétés dans l’ordre: le premier `amount1e8` supérieur ou égal au montant brut détermine `feeBps`.
  - Si aucun palier ne correspond, fallback sur `withdrawFeeBps`.
- `getWithdrawFeeBpsForAmount(uint256 amount1e8)` retourne le BPS applicable.

## Retraits
- `withdraw(uint256 shares)`:
  - Calcule le montant brut en USDC à partir du PPS courant.
  - Applique `feeBps` déterminé par `getWithdrawFeeBpsForAmount(gross1e8)`.
  - Si la trésorerie EVM couvre le montant net → paiement immédiat et événement `WithdrawPaid`.
  - Sinon → mise en file avec snapshot du `feeBps` calculé à la demande.
- `settleWithdraw(uint256 id, uint256 pay1e8, address to)`:
  - Recalcule le montant brut d’après le PPS courant.
  - Utilise le `feeBpsSnapshot` stocké dans la file pour exiger un paiement net exact.

## Événements
- `WithdrawRequested(id, user, shares)`
- `WithdrawPaid(id, to, amount1e8)`
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
