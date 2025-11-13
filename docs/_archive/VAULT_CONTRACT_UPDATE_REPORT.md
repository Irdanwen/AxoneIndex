# 🔍 Rapport de Mise à Jour - VaultContract.sol

**Date** : 2025-08-29
**Agent** : Axone Docs Agent

## 📌 Résumé des Modifications

Mise à jour complète de la documentation technique pour refléter les évolutions récentes du contrat `VaultContract.sol`, notamment :
- Ajout de l'implémentation ERC20 complète (transferts, approvals)
- Clarification de la logique de déploiement automatique vers Core
- Documentation détaillée du calcul NAV/PPS
- Correction des incohérences avec la version précédente

> ℹ️ *Aucune documentation officielle Hyperliquid trouvée pour ce contrat spécifique - documentation basée sur l'analyse du code source.*

## 📦 Impact Projet

| Composant | Impact |
|-----------|--------|
| `contracts/src/HYPE50 Defensive/VaultContract.sol` | Ajout de 8 fonctions ERC20 (lignes 235-262) et mise à jour des événements |
| `lib/abi/VaultContract.json` | Nécessite régénération après déploiement |
| `src/lib/vaultTypes.ts` | À vérifier pour compatibilité ERC20 |

**Fonctions critiques modifiées** :
- `deposit()` : Ajout de la logique auto-deploy avec validation d'allowance
- `withdraw()` : Calcul des frais basé sur `deposits` et `autoDeployBps`
- `_transfer()` : Implémentation sécurisée avec vérification adresse zéro

## 📚 Mises à Jour DocsAgent

✅ **Nouveau document** : [`docs/contracts/VaultContract.md`](/docs/contracts/VaultContract.md)
- Structure technique organisée par fonctionnalité
- Exemples concrets de calculs (dépôt de 1000 USDC)
- Formules mathématiques pour NAV/PPS
- Bonnes pratiques de sécurité et audit

## 🔄 Changements Récents (2025-09-05)

### CoreInteractionHandler.sol
- Ajout d'un rôle `rebalancer` défini par l'owner via `setRebalancer(address)`.
- Restriction d'accès à `rebalancePortfolio` avec le modificateur `onlyRebalancer`.
- Refactor interne avec `_rebalance(...)` pour permettre les appels internes (ex. depuis `executeDeposit`) sans contourner l'authentification externe.

### VaultContract.sol
- Introduction de paliers de frais de retrait: `WithdrawFeeTier[] withdrawFeeTiers` et setter `setWithdrawFeeTiers(WithdrawFeeTier[])`.
- Les frais de retrait sont désormais calculés sur le montant brut retiré (USDC 1e8) via `getWithdrawFeeBpsForAmount(amount1e8)`.
- Dans `withdraw`, le BPS applicable est déterminé à la demande; si retrait différé, ce BPS est figé dans `feeBpsSnapshot` de la file.
- Dans `settleWithdraw`, le paiement net requis est calculé à partir du montant brut (PPS courant) et du BPS figé.

### Impacts et Considérations
- Les intégrations off-chain qui appellent `rebalancePortfolio` doivent utiliser l'adresse `rebalancer` configurée.
- Les frontends doivent exposer la configuration des paliers de frais (lecture) pour une meilleure transparence utilisateur.
- Les scripts de déploiement doivent prévoir la configuration initiale de `setRebalancer` et des `setWithdrawFeeTiers`.

### Extrait de configuration (exemple)
```solidity
// Rebalancer
handler.setRebalancer(0x1234...);

// Paliers (USDC 1e8)
VaultContract.WithdrawFeeTier[] memory tiers = new VaultContract.WithdrawFeeTier[](2);
tiers[0] = VaultContract.WithdrawFeeTier({amount1e8: 500_000_000, feeBps: 40}); // 5 USDC → 0.40%
tiers[1] = VaultContract.WithdrawFeeTier({amount1e8: 5_000_000_000, feeBps: 20}); // 50 USDC → 0.20%
vault.setWithdrawFeeTiers(tiers);
```

## ⚠️ Points d'Attention

1. **Consistance terminologique** :
   - Vérifier l'usage de `autoDeployBps` (à la fois pour déploiement Core ET frais de retrait)
   - Confirmer avec l'équipe CoreWriter la signification exacte de `equitySpotUsd1e18`

2. **Documentation manquante** :
   - Mécanisme de `settleWithdraw()` nécessite un exemple détaillé
   - Clarifier le rôle de `feeBpsSnapshot` dans les retraits différés

## 📅 Prochaines Étapes

1. [ ] Valider la documentation avec l'équipe smart contracts
2. [ ] Mettre à jour `REFERRAL_GUIDE.md` si impact sur les mécanismes de récompenses
3. [ ] Planifier une revue de sécurité pour les nouvelles fonctions ERC20

---
*Ce rapport a été généré automatiquement par l'Axone Docs Agent. Dernière vérification : 2025-08-29 20:03:58 UTC*
