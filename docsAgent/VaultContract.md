# VaultContract.sol - Documentation Technique

## Vue d'ensemble
Contrat de vault gérant des parts tokenisées (ERC20) représentant une participation dans un portefeuille hybride EVM/Core. Intègre :
- Gestion de liquidités en USDC (1e6)
- Calcul de NAV combinant solde EVM et equity Core
- Mécanismes de dépôt/retrait avec frais paramétrables
- Déploiement automatique vers Core via CoreWriter

## Composants clés

### Interfaces critiques
```solidity
interface IHandler {
    function equitySpotUsd1e18() external view returns (uint256);
    function executeDeposit(uint64 usdc1e6, bool forceRebalance) external;
    function pullFromCoreToEvm(uint64 usdc1e6) external returns (uint64);
    function sweepToVault(uint64 amount1e6) external;
}
```

### Variables d'état
| Variable | Description |
|----------|-------------|
| `deposits` | Suivi des dépôts USDC bruts par utilisateur (1e6) |
| `autoDeployBps` | % des dépôts automatiquement déployés vers Core (défaut: 9000 = 90%) |
| `withdrawQueue` | File d'attente pour les retraits en cas de liquidité insuffisante |

## Fonctionnalités principales

### 💰 Dépôt
```solidity
function deposit(uint64 amount1e6) external
```
1. Calcule les parts à mint en fonction du NAV
2. Applique `depositFeeBps` sur les parts mintées
3. Déploie automatiquement `autoDeployBps`% vers Core
4. Met à jour le suivi des dépôts utilisateur

> **Exemple** : Dépôt de 1000 USDC avec autoDeployBps=9000 → 900 USDC envoyés vers Core

### 📤 Retrait
```solidity
function withdraw(uint256 shares) external
```
- **Cas immédiat** : Paiement si liquidité suffisante
- **Cas différé** : Ajout à `withdrawQueue` si liquidité insuffisante
- Calcul des frais basé sur `withdrawFeeBps` et la portion du retrait couverte par le dépôt restant enregistré (`deposits[user]`). Le BPS de frais est figé au moment de la mise en file si le retrait est différé.

### ⚙️ Gestion Core
```solidity
function recallFromCoreAndSweep(uint64 amount1e6) external onlyOwner
```
Permet de rapatrier des fonds depuis Core vers EVM en deux étapes :
1. `pullFromCoreToEvm()` : Récupère les fonds sur Core
2. `sweepToVault()` : Transfère vers la vault

## Nouvelles fonctionnalités (v2.1+)

### 🔗 Implémentation ERC20 complète
Ajout des fonctions standard :
- `transfer()`/`transferFrom()` avec gestion des allowances
- Événements `Transfer`/`Approval`
- Validation des adresses zéro

```solidity
function transfer(address to, uint256 value) external returns (bool) {
    require(value > 0, "zero value");
    _transfer(msg.sender, to, value);
    return true;
}
```

### 📊 Calcul du NAV
$$
NAV_{1e18 = (EVM_{balance \times 10^{12}) + Core_{equity}
$$

Où :
- $EVM_{balance}$ = Solde USDC du contrat
- $Core_{equity}$ = Valeur equity Core via `handler.equitySpotUsd1e18()`

## Bonnes pratiques d'implémentation

1. **Gestion des frais** :
   - `depositFeeBps` s'applique sur les parts mintées au dépôt
   - `withdrawFeeBps` s'applique à la portion du paiement en USDC (1e6) couverte par le dépôt enregistré de l'utilisateur (min du brut dû et du dépôt restant). En cas de retrait différé, le `feeBpsSnapshot` prend la valeur de `withdrawFeeBps` au moment de la demande

2. **Sécurité** :
   - Toutes les fonctions critiques utilisent `nonReentrant`
   - Vérification des adresses zéro dans `_transfer`

3. **Audit recommandé** :
   - Vérifier la cohérence entre `deposits` et calcul des frais de retrait
   - Tester les scénarios de liquidité insuffisante (mise en file et règlement via `settleWithdraw`)

## Événements

- `NavUpdated(uint256 nav1e18)` : Émis après chaque opération modifiant l'état économique (dépôt, retrait, règlement, rappel/sweep). Reflète le NAV courant en 1e18.
- `RecallAndSweep(uint64 amount1e6)` : Émis lorsque des fonds sont rappelés depuis Core puis transférés au vault.

## Approvals ERC20 vers le `handler`

- L'approbation USDC utilise `safeApprove` avec un reset préalable à 0 lorsque l'`allowance` actuelle est inférieure au montant requis. Ceci assure la compatibilité avec les tokens qui exigent de remettre l'allowance à 0 avant d'augmenter une nouvelle approval.

```solidity
uint256 currentAllowance = usdc.allowance(address(this), address(handler));
if (currentAllowance < deployAmt) {
    usdc.safeApprove(address(handler), 0);
    usdc.safeApprove(address(handler), deployAmt);
}
```

- Avertissement: certains tokens non-standard peuvent se comporter différemment vis-à-vis d'`approve`. La stratégie ci-dessus (reset à 0 puis nouvelle approval) est la recommandation d'OpenZeppelin via `SafeERC20` et couvre la majorité des cas.

## Références

- Code source : `