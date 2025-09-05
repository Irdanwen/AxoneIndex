# CoreInteractionHandler — Rôle Rebalancer et Sécurité

## Résumé
`CoreInteractionHandler.sol` gère les interactions avec Core (Hyperliquid): transferts USDC spot, ordres IOC BTC/HYPE, et rééquilibrage 50/50. Le rééquilibrage est désormais restreint à une adresse `rebalancer` définie par l’owner.

## API Clés
- `setRebalancer(address rebalancer)` (onlyOwner): définit l’adresse autorisée à appeler `rebalancePortfolio`.
- `rebalancePortfolio(uint128 cloidBtc, uint128 cloidHype)` (onlyRebalancer): calcule les deltas via l’oracle et place des ordres IOC pour revenir vers 50/50 (avec deadband).
- `executeDeposit(uint64 usdc1e6, bool forceRebalance)` (onlyVault): envoie l’USDC vers Core, achète BTC/HYPE, peut déclencher un `_rebalance` interne si `forceRebalance=true`.

## Événements
- `Rebalanced(int256 dBtc1e18, int256 dHype1e18)`
- `RebalancerSet(address rebalancer)`

## Paramètres et Contraintes
- `deadbandBps ≤ 50`.
- Garde oracle: `maxOracleDeviationBps` borne l’écart relatif par rapport au dernier prix.
- Limitation de débit par epoch via `maxOutboundPerEpoch` et `epochLength`.

## Exemple de Configuration
```solidity
// Définir l’adresse rebalancer
handler.setRebalancer(0x1234...ABCD);

// Appeler le rééquilibrage (depuis l’adresse rebalancer)
handler.rebalancePortfolio(0, 0);
```

## Sécurité
- `onlyVault` protège les flux de fonds (débits/credits USDC).
- `onlyRebalancer` protège `rebalancePortfolio`.
- `_rebalance` est interne pour les appels intra-contrat (ex. `executeDeposit`).
