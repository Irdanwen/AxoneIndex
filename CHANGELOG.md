# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🔴 CRITIQUE - Fixed (2025-10-01)
- **CoreInteractionHandler.sol** : Correction critique de la fonction `_toSz1e8`
  - Remplacement de la division par `1e10` par division par `100`
  - Formule correcte : `size1e8 = usd1e18 / price1e8 / 100`
  - **Impact** : Les quantités d'ordres sont maintenant 100x correctes
  - **Fonctions affectées** :
    - `executeDeposit` : Ordres d'achat BTC/HYPE lors des dépôts
    - `_placeRebalanceOrders` : Ordres de rebalancement du portefeuille
    - `_sellAssetForUsd` : Ventes d'actifs pour les retraits
  - Documentation mise à jour : `docs/AUDIT_CORRECTION_TOSZE8.md`
  - Référence : AUDIT_TOSZE8_FIX_001

### 📝 Documentation - Fixed (2025-10-01)
- **epochLength Documentation** : Clarification CRITIQUE du paramètre `epochLength`
  - ⚠️ **Correction majeure** : `epochLength` est exprimé en **nombre de blocs**, PAS en secondes
  - Le contrat utilise `block.number` pour le rate limiting (résistant à la manipulation des validateurs)
  - **Erreur documentée évitée** : Utiliser `86400` (secondes) créerait une epoch de 86400 blocs ≈ 12-20 jours au lieu de 1 jour
  - **Fichiers mis à jour** :
    - `docsAgent/BTC50_Defensive_Deployment_Guide.md` : Ajout d'exemples de calcul pour différentes chaînes (HyperEVM, Ethereum, Polygon)
    - `docs/contracts/CoreInteractionHandler.md` : Nouvelle section "Rate Limiting et Epochs" avec avertissements
  - **Exemples ajoutés** :
    - HyperEVM (≈2 sec/bloc) : 1 jour = 43200 blocs
    - Ethereum (≈12 sec/bloc) : 1 jour = 7200 blocs
  - Référence : AUDIT_TOSZE8_DOC_001
  - Suite à une recommandation d'audit pour éviter une confusion dangereuse

### Changed
- **Documentation** : Mise à jour de `docs/contracts/CoreInteractionHandler.md`
- **Documentation** : Mise à jour de `docsAgent/Smart_Contracts_Functions_Documentation.md`

---

## [0.9.0] - 2025-09-XX

### Added
- Initial smart contracts implementation
- VaultContract with ERC20 shares
- CoreInteractionHandler for HyperCore integration
- Rebalancer50Lib for 50/50 portfolio management
- ReferralRegistry system
- AxoneToken and AxoneSale contracts

### Security
- Implemented Pausable mechanism
- Rate limiting with block.number instead of timestamp
- Oracle deviation protection
- ReentrancyGuard on critical functions

---

## Notes de Version

### Migration depuis v0.8.x
Si vous avez déployé une version antérieure du CoreInteractionHandler :
1. ⚠️ **NE PAS utiliser** les anciennes versions avec le bug _toSz1e8
2. Redéployer le CoreInteractionHandler avec la version corrigée
3. Mettre à jour l'adresse du handler dans le VaultContract
4. Tester exhaustivement avec les nouveaux calculs de quantités

### Tests Recommandés Avant Production
- Test de dépôt avec vérification des ordres BTC/HYPE (doivent être ~50% chacun)
- Test de rebalancement avec portefeuille déséquilibré
- Test de retrait avec vente d'actifs suffisante
- Validation des quantités d'ordres en format 1e8

### Contact Support
Pour toute question concernant cette mise à jour critique, contactez l'équipe de développement.
