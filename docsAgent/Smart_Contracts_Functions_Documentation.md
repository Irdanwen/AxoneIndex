# Documentation Complète des Fonctions des Smart Contracts

## Table des Matières

1. [AxoneToken.sol](#axonetokensol)
2. [AxoneSale.sol](#axonesalesol)
3. [ReferralRegistry.sol](#referralregistrysol)
4. [CoreInteractionHandler.sol](#coreinteractionhandlersol)
5. [VaultContract.sol](#vaultcontractsol)
6. [EmissionController.sol](#emissioncontrollersol)
7. [RewardsHub.sol](#rewardshubsol)
8. [MockUSDC.sol](#mockusdcsol)

---

## AxoneToken.sol

### Description
Token ERC20 principal du projet Axone avec fonctionnalités d'inflation contrôlée, de burn, et de gestion de la supply circulante.

### Fonctions Principales

#### `constructor(address _initialRecipient, address _inflationRecipient, address _initialOwner)`
**Description**: Initialise le token avec les paramètres de base.
**Paramètres**:
- `_initialRecipient`: Adresse qui recevra l'offre initiale
- `_inflationRecipient`: Adresse qui recevra les tokens d'inflation
- `_initialOwner`: Propriétaire initial du contrat

**Exemple d'utilisation**:
```solidity
AxoneToken token = new AxoneToken(
    0x123..., // initialRecipient
    0x456..., // inflationRecipient  
    0x789...  // initialOwner
);
```

#### `mint(address to, uint256 amount)`
**Description**: Frappe de nouveaux tokens (réservé au propriétaire).
**Paramètres**:
- `to`: Adresse destinataire
- `amount`: Montant à frapper

**Exemple d'utilisation**:
```solidity
// Frapper 1000 tokens pour un utilisateur
token.mint(0x123..., 1000 * 1e18);
```

#### `mintInflation()`
**Description**: Frappe automatique des tokens d'inflation basée sur le temps écoulé.
**Fonctionnement**: Calcule l'inflation basée sur la supply circulante et le temps écoulé depuis le dernier mint.

**Exemple d'utilisation**:
```solidity
// Appelé par un bot ou un utilisateur autorisé
token.mintInflation();
```

#### `setInflationRecipient(address newRecipient)`
**Description**: Change l'adresse qui reçoit les tokens d'inflation.
**Paramètres**:
- `newRecipient`: Nouvelle adresse destinataire

**Exemple d'utilisation**:
```solidity
token.setInflationRecipient(0xNewAddress...);
```

#### `setInflationInterval(uint256 newInterval)`
**Description**: Modifie l'intervalle entre les mints d'inflation.
**Paramètres**:
- `newInterval`: Nouvel intervalle en secondes

**Exemple d'utilisation**:
```solidity
// Changer l'intervalle à 2 jours
token.setInflationInterval(2 days);
```

#### `circulatingSupply()`
**Description**: Retourne la supply circulante (total - soldes exclus).
**Retour**: `uint256` - Supply circulante

**Exemple d'utilisation**:
```solidity
uint256 circulating = token.circulatingSupply();
```

#### `setExcludedFromCirculating(address account, bool excluded)`
**Description**: Exclut ou inclut une adresse du calcul de la supply circulante.
**Paramètres**:
- `account`: Adresse à modifier
- `excluded`: true pour exclure, false pour inclure

**Exemple d'utilisation**:
```solidity
// Exclure une adresse de trésorerie
token.setExcludedFromCirculating(treasuryAddress, true);
```

#### `pause()` / `unpause()`
**Description**: Met en pause ou reprend les opérations du token.
**Exemple d'utilisation**:
```solidity
// En cas d'urgence
token.pause();
// Reprendre les opérations
token.unpause();
```

---

## AxoneSale.sol

### Description
Contrat de vente de tokens AXN contre USDC avec protection contre le slippage et gestion des prix.

### Fonctions Principales

#### `constructor(address _axnToken, address _usdcToken)`
**Description**: Initialise le contrat de vente.
**Paramètres**:
- `_axnToken`: Adresse du token AXN
- `_usdcToken`: Adresse du token USDC

**Exemple d'utilisation**:
```solidity
AxoneSale sale = new AxoneSale(axnTokenAddress, usdcTokenAddress);
```

#### `buyWithUSDC(uint256 axnAmount)`
**Description**: Achat de tokens AXN avec USDC.
**Paramètres**:
- `axnAmount`: Montant de tokens AXN à acheter

**Exemple d'utilisation**:
```solidity
// Acheter 1000 AXN
sale.buyWithUSDC(1000 * 1e18);
```

#### `setTreasury(address _treasury)`
**Description**: Définit l'adresse de la trésorerie qui recevra les USDC.
**Paramètres**:
- `_treasury`: Adresse de la trésorerie

**Exemple d'utilisation**:
```solidity
sale.setTreasury(treasuryAddress);
```

#### `updatePrice(uint256 newPricePerAxn)`
**Description**: Met à jour le prix d'un token AXN en USDC.
**Paramètres**:
- `newPricePerAxn`: Nouveau prix en USDC (8 décimales)

**Exemple d'utilisation**:
```solidity
// Prix de 0.1 USDC par AXN
sale.updatePrice(0.1 * 1e8);
```

#### `setMaxSlippageBps(uint256 _maxSlippageBps)`
**Description**: Définit la tolérance maximale au slippage.
**Paramètres**:
- `_maxSlippageBps`: Slippage en basis points (100 = 1%)

**Exemple d'utilisation**:
```solidity
// Tolérance de 2%
sale.setMaxSlippageBps(200);
```

#### `endSale()`
**Description**: Termine la vente de tokens.
**Exemple d'utilisation**:
```solidity
sale.endSale();
```

#### `withdrawUnsoldTokens(address to)`
**Description**: Retire les tokens non vendus après la fin de la vente.
**Paramètres**:
- `to`: Adresse destinataire

**Exemple d'utilisation**:
```solidity
sale.withdrawUnsoldTokens(ownerAddress);
```

#### `getCurrentPrice()`
**Description**: Retourne le prix actuel avec protection contre le slippage.
**Retour**: `uint256` - Prix actuel

**Exemple d'utilisation**:
```solidity
uint256 currentPrice = sale.getCurrentPrice();
```

---

## ReferralRegistry.sol

### Description
Système de whitelist basé sur des codes de parrainage avec expiration et quota par créateur.

### Fonctions Principales

#### `createCode()`
**Description**: Crée un nouveau code de parrainage généré automatiquement.
**Retour**: `string` - Code de parrainage généré

**Exemple d'utilisation**:
```solidity
string memory code = referralRegistry.createCode();
// Retourne un code comme "ABC123XYZ9"
```

#### `createCode(bytes32 codeHash)`
**Description**: Crée un code de parrainage avec un hash spécifique.
**Paramètres**:
- `codeHash`: Hash du code de parrainage

**Exemple d'utilisation**:
```solidity
bytes32 codeHash = keccak256(abi.encodePacked("MYCODE123"));
referralRegistry.createCode(codeHash);
```

#### `useCode(bytes32 codeHash)`
**Description**: Utilise un code de parrainage pour être whitelisté.
**Paramètres**:
- `codeHash`: Hash du code à utiliser

**Exemple d'utilisation**:
```solidity
bytes32 codeHash = keccak256(abi.encodePacked("ABC123XYZ9"));
referralRegistry.useCode(codeHash);
```

#### `setQuota(uint256 newQuota)`
**Description**: Modifie le quota de codes par créateur.
**Paramètres**:
- `newQuota`: Nouveau quota

**Exemple d'utilisation**:
```solidity
// Permettre 10 codes par créateur
referralRegistry.setQuota(10);
```

#### `whitelistDirect(address user)`
**Description**: Whiteliste directement un utilisateur (réservé au propriétaire).
**Paramètres**:
- `user`: Adresse à whitelister

**Exemple d'utilisation**:
```solidity
referralRegistry.whitelistDirect(0x123...);
```

#### `getUnusedCodes(address creator)`
**Description**: Retourne les codes non utilisés et non expirés d'un créateur.
**Paramètres**:
- `creator`: Adresse du créateur
**Retour**: `string[]` - Liste des codes disponibles

**Exemple d'utilisation**:
```solidity
string[] memory codes = referralRegistry.getUnusedCodes(creatorAddress);
```

#### `revokeCode(bytes32 codeHash)`
**Description**: Révoque un code et récupère le quota (réservé au propriétaire).
**Paramètres**:
- `codeHash`: Hash du code à révoquer

**Exemple d'utilisation**:
```solidity
referralRegistry.revokeCode(codeHash);
```

---

## CoreInteractionHandler.sol

### Description
Gestionnaire d'interactions avec le système Core pour les opérations de trading et de rééquilibrage.

### Fonctions Principales

#### `constructor(L1Read _l1read, ICoreWriter _coreWriter, IERC20 _usdc, uint64 _maxOutboundPerEpoch, uint64 _epochLength, address _feeVault, uint64 _feeBps)`
**Description**: Initialise le gestionnaire avec les paramètres de base.
**Paramètres**:
- `_l1read`: Interface de lecture L1
- `_coreWriter`: Interface d'écriture Core
- `_usdc`: Token USDC
- `_maxOutboundPerEpoch`: Maximum de sortie par époque
- `_epochLength`: Longueur d'une époque
- `_feeVault`: Vault des frais
- `_feeBps`: Frais en basis points

**Exemple d'utilisation**:
```solidity
CoreInteractionHandler handler = new CoreInteractionHandler(
    l1readAddress,
    coreWriterAddress,
    usdcAddress,
    1000000, // maxOutboundPerEpoch
    100,     // epochLength
    feeVaultAddress,
    50       // 0.5% fee
);
```

#### `setVault(address _vault)`
**Description**: Définit l'adresse du vault associé.
**Paramètres**:
- `_vault`: Adresse du vault

**Exemple d'utilisation**:
```solidity
handler.setVault(vaultAddress);
```

#### `setUsdcCoreLink(address systemAddr, uint64 tokenId)`
**Description**: Configure le lien USDC avec le système Core.
**Paramètres**:
- `systemAddr`: Adresse du système Core
- `tokenId`: ID du token USDC

**Exemple d'utilisation**:
```solidity
handler.setUsdcCoreLink(coreSystemAddress, 12345);
```

#### `setSpotIds(uint32 btcSpot, uint32 hypeSpot)`
**Description**: Définit les IDs des marchés spot BTC et HYPE.
**Paramètres**:
- `btcSpot`: ID du marché BTC
- `hypeSpot`: ID du marché HYPE

**Exemple d'utilisation**:
```solidity
handler.setSpotIds(1, 2);
```

#### `executeDeposit(uint64 usdc1e6, bool forceRebalance)`
**Description**: Exécute un dépôt USDC et place des ordres de trading.
**Paramètres**:
- `usdc1e6`: Montant USDC à déposer (6 décimales)
- `forceRebalance`: Forcer le rééquilibrage

**Exemple d'utilisation**:
```solidity
// Dépôt de 1000 USDC avec rééquilibrage forcé
handler.executeDeposit(1000 * 1e6, true);
```

#### `pullFromCoreToEvm(uint64 usdc1e6)`
**Description**: Retire des USDC du système Core vers l'EVM.
**Paramètres**:
- `usdc1e6`: Montant à retirer
**Retour**: `uint64` - Montant effectivement retiré

**Exemple d'utilisation**:
```solidity
uint64 withdrawn = handler.pullFromCoreToEvm(500 * 1e6);
```

#### `sweepToVault(uint64 amount1e6)`
**Description**: Transfère des USDC vers le vault avec frais.
**Paramètres**:
- `amount1e6`: Montant à transférer

**Exemple d'utilisation**:
```solidity
handler.sweepToVault(1000 * 1e6);
```

#### `rebalancePortfolio(uint128 cloidBtc, uint128 cloidHype)`
**Description**: Rééquilibre le portefeuille entre BTC et HYPE.
**Paramètres**:
- `cloidBtc`: ID d'ordre BTC
- `cloidHype`: ID d'ordre HYPE

**Exemple d'utilisation**:
```solidity
handler.rebalancePortfolio(12345, 67890);
```

#### `equitySpotUsd1e18()`
**Description**: Calcule l'équité totale en USD du portefeuille spot.
**Retour**: `uint256` - Équité en USD (18 décimales)

**Exemple d'utilisation**:
```solidity
uint256 equity = handler.equitySpotUsd1e18();
```

#### `setLimits(uint64 _maxOutboundPerEpoch, uint64 _epochLength)`
**Description**: Modifie les limites de sortie et la longueur d'époque.
**Paramètres**:
- `_maxOutboundPerEpoch`: Nouveau maximum par époque
- `_epochLength`: Nouvelle longueur d'époque

**Exemple d'utilisation**:
```solidity
handler.setLimits(2000000, 200);
```

#### `setParams(uint64 _maxSlippageBps, uint64 _marketEpsilonBps, uint64 _deadbandBps)`
**Description**: Configure les paramètres de trading.
**Paramètres**:
- `_maxSlippageBps`: Slippage maximum
- `_marketEpsilonBps`: Epsilon de marché
- `_deadbandBps`: Bande morte

**Exemple d'utilisation**:
```solidity
handler.setParams(100, 20, 50);
```

---

## VaultContract.sol

### Description
Contrat de vault ERC20 pour la gestion des parts d'investissement avec système de frais et de retraits différés.

### Fonctions Principales

#### `constructor(IERC20 _usdc)`
**Description**: Initialise le vault avec le token USDC.
**Paramètres**:
- `_usdc`: Adresse du token USDC

**Exemple d'utilisation**:
```solidity
VaultContract vault = new VaultContract(usdcAddress);
```

#### `setHandler(IHandler _handler)`
**Description**: Définit le gestionnaire d'interactions.
**Paramètres**:
- `_handler`: Adresse du gestionnaire

**Exemple d'utilisation**:
```solidity
vault.setHandler(handlerAddress);
```

#### `setFees(uint16 _depositFeeBps, uint16 _withdrawFeeBps, uint16 _autoDeployBps)`
**Description**: Configure les frais du vault.
**Paramètres**:
- `_depositFeeBps`: Frais de dépôt en basis points
- `_withdrawFeeBps`: Frais de retrait en basis points
- `_autoDeployBps`: Pourcentage d'auto-déploiement

**Exemple d'utilisation**:
```solidity
// 1% frais de dépôt, 0.5% frais de retrait, 90% auto-déploiement
vault.setFees(100, 50, 9000);
```

#### `setWithdrawFeeTiers(WithdrawFeeTier[] memory tiers)`
**Description**: Définit des tranches de frais de retrait.
**Paramètres**:
- `tiers`: Tableau des tranches de frais

**Exemple d'utilisation**:
```solidity
WithdrawFeeTier[] memory tiers = new WithdrawFeeTier[](2);
tiers[0] = WithdrawFeeTier(1000 * 1e8, 100); // 1% pour < 1000 USDC
tiers[1] = WithdrawFeeTier(10000 * 1e8, 50); // 0.5% pour < 10000 USDC
vault.setWithdrawFeeTiers(tiers);
```

#### `deposit(uint256 amount1e8)`
**Description**: Dépôt de USDC dans le vault.
**Paramètres**:
- `amount1e8`: Montant en USDC (8 décimales)

**Exemple d'utilisation**:
```solidity
// Dépôt de 1000 USDC
vault.deposit(1000 * 1e8);
```

#### `withdraw(uint256 shares)`
**Description**: Retrait de parts du vault.
**Paramètres**:
- `shares`: Nombre de parts à retirer

**Exemple d'utilisation**:
```solidity
// Retirer 100 parts
vault.withdraw(100 * 1e18);
```

#### `settleWithdraw(uint256 id, uint256 pay1e8, address to)`
**Description**: Règle un retrait en attente.
**Paramètres**:
- `id`: ID du retrait
- `pay1e8`: Montant à payer
- `to`: Adresse destinataire

**Exemple d'utilisation**:
```solidity
vault.settleWithdraw(0, 1000 * 1e8, userAddress);
```

#### `cancelWithdrawRequest(uint256 id)`
**Description**: Annule une demande de retrait.
**Paramètres**:
- `id`: ID du retrait à annuler

**Exemple d'utilisation**:
```solidity
vault.cancelWithdrawRequest(0);
```

#### `recallFromCoreAndSweep(uint256 amount1e8)`
**Description**: Rappelle des fonds du Core et les transfère au vault.
**Paramètres**:
- `amount1e8`: Montant à rappeler

**Exemple d'utilisation**:
```solidity
vault.recallFromCoreAndSweep(5000 * 1e8);
```

#### `nav1e18()`
**Description**: Calcule la valeur nette d'actifs du vault.
**Retour**: `uint256` - NAV en USD (18 décimales)

**Exemple d'utilisation**:
```solidity
uint256 nav = vault.nav1e18();
```

#### `pps1e18()`
**Description**: Calcule le prix par part.
**Retour**: `uint256` - Prix par part (18 décimales)

**Exemple d'utilisation**:
```solidity
uint256 pps = vault.pps1e18();
```

#### `transfer(address to, uint256 value)`
**Description**: Transfert de parts entre utilisateurs.
**Paramètres**:
- `to`: Adresse destinataire
- `value`: Montant à transférer
**Retour**: `bool` - Succès du transfert

**Exemple d'utilisation**:
```solidity
bool success = vault.transfer(recipientAddress, 100 * 1e18);
```

#### `approve(address spender, uint256 value)`
**Description**: Approuve un spender pour un montant de parts.
**Paramètres**:
- `spender`: Adresse autorisée
- `value`: Montant autorisé
**Retour**: `bool` - Succès de l'approbation

**Exemple d'utilisation**:
```solidity
vault.approve(spenderAddress, 1000 * 1e18);
```

#### `transferFrom(address from, address to, uint256 value)`
**Description**: Transfert de parts pour le compte d'un autre utilisateur.
**Paramètres**:
- `from`: Adresse expéditrice
- `to`: Adresse destinataire
- `value`: Montant à transférer
**Retour**: `bool` - Succès du transfert

**Exemple d'utilisation**:
```solidity
vault.transferFrom(fromAddress, toAddress, 100 * 1e18);
```

---

## EmissionController.sol

### Description
Contrôleur d'émission de tokens de récompense avec modes mint et drip.

### Fonctions Principales

#### `constructor(address rewardToken_, uint256 rewardPerSecond_, bool isMintMode_)`
**Description**: Initialise le contrôleur d'émission.
**Paramètres**:
- `rewardToken_`: Adresse du token de récompense
- `rewardPerSecond_`: Récompense par seconde
- `isMintMode_`: Mode de frappe (true) ou drip (false)

**Exemple d'utilisation**:
```solidity
EmissionController controller = new EmissionController(
    axnTokenAddress,
    1e18, // 1 token par seconde
    true  // mode mint
);
```

#### `setRewardsHub(address hub)`
**Description**: Configure le hub de récompenses (une seule fois).
**Paramètres**:
- `hub`: Adresse du hub

**Exemple d'utilisation**:
```solidity
controller.setRewardsHub(rewardsHubAddress);
```

#### `setRewardPerSecond(uint256 newR)`
**Description**: Modifie le taux de récompense par seconde.
**Paramètres**:
- `newR`: Nouveau taux

**Exemple d'utilisation**:
```solidity
// Changer à 2 tokens par seconde
controller.setRewardPerSecond(2e18);
```

#### `toggleMintMode(bool on)`
**Description**: Bascule entre les modes mint et drip.
**Paramètres**:
- `on`: true pour mint, false pour drip

**Exemple d'utilisation**:
```solidity
controller.toggleMintMode(false); // Passer en mode drip
```

#### `pull()`
**Description**: Extrait les récompenses accumulées (appelé par le hub).
**Retour**: `uint256` - Montant extrait

**Exemple d'utilisation**:
```solidity
uint256 amount = controller.pull();
```

#### `pendingEmission()`
**Description**: Calcule l'émission en attente depuis le dernier pull.
**Retour**: `uint256` - Montant en attente

**Exemple d'utilisation**:
```solidity
uint256 pending = controller.pendingEmission();
```

---

## RewardsHub.sol

### Description
Hub central de staking avec système de pools et distribution de récompenses.

### Fonctions Principales

#### `constructor(address controller_)`
**Description**: Initialise le hub avec le contrôleur d'émission.
**Paramètres**:
- `controller_`: Adresse du contrôleur

**Exemple d'utilisation**:
```solidity
RewardsHub hub = new RewardsHub(controllerAddress);
```

#### `addPool(IERC20 stakeToken, uint128 allocPoint)`
**Description**: Ajoute un nouveau pool de staking.
**Paramètres**:
- `stakeToken`: Token à staker
- `allocPoint`: Points d'allocation

**Exemple d'utilisation**:
```solidity
// Ajouter un pool avec 100 points d'allocation
hub.addPool(vaultTokenAddress, 100);
```

#### `setAllocPoint(uint256 pid, uint128 newAllocPoint)`
**Description**: Modifie les points d'allocation d'un pool.
**Paramètres**:
- `pid`: ID du pool
- `newAllocPoint`: Nouveaux points

**Exemple d'utilisation**:
```solidity
hub.setAllocPoint(0, 150);
```

#### `setPoolRewarder(uint256 pid, IRewarder rewarder)`
**Description**: Configure un rewarder optionnel pour un pool.
**Paramètres**:
- `pid`: ID du pool
- `rewarder`: Adresse du rewarder

**Exemple d'utilisation**:
```solidity
hub.setPoolRewarder(0, rewarderAddress);
```

#### `deposit(uint256 pid, uint256 amount)`
**Description**: Dépôt de tokens dans un pool.
**Paramètres**:
- `pid`: ID du pool
- `amount`: Montant à déposer

**Exemple d'utilisation**:
```solidity
// Dépôt de 100 parts dans le pool 0
hub.deposit(0, 100 * 1e18);
```

#### `withdraw(uint256 pid, uint256 amount)`
**Description**: Retrait de tokens d'un pool.
**Paramètres**:
- `pid`: ID du pool
- `amount`: Montant à retirer

**Exemple d'utilisation**:
```solidity
hub.withdraw(0, 50 * 1e18);
```

#### `harvest(uint256 pid, address to)`
**Description**: Récolte les récompenses sans retirer de tokens.
**Paramètres**:
- `pid`: ID du pool
- `to`: Adresse destinataire

**Exemple d'utilisation**:
```solidity
hub.harvest(0, msg.sender);
```

#### `emergencyWithdraw(uint256 pid)`
**Description**: Retrait d'urgence sans récolte de récompenses.
**Paramètres**:
- `pid`: ID du pool

**Exemple d'utilisation**:
```solidity
hub.emergencyWithdraw(0);
```

#### `pendingReward(uint256 pid, address user)`
**Description**: Calcule les récompenses en attente pour un utilisateur.
**Paramètres**:
- `pid`: ID du pool
- `user`: Adresse de l'utilisateur
**Retour**: `uint256` - Récompenses en attente

**Exemple d'utilisation**:
```solidity
uint256 pending = hub.pendingReward(0, userAddress);
```

#### `massUpdatePools()`
**Description**: Met à jour tous les pools.
**Exemple d'utilisation**:
```solidity
hub.massUpdatePools();
```

#### `updatePool(uint256 pid)`
**Description**: Met à jour un pool spécifique.
**Paramètres**:
- `pid`: ID du pool

**Exemple d'utilisation**:
```solidity
hub.updatePool(0);
```

#### `setController(IEmissionController newController)`
**Description**: Change le contrôleur d'émission.
**Paramètres**:
- `newController`: Nouveau contrôleur

**Exemple d'utilisation**:
```solidity
hub.setController(newControllerAddress);
```

---

## MockUSDC.sol

### Description
Token USDC de test avec 8 décimales pour les tests et le développement.

### Fonctions Principales

#### `constructor()`
**Description**: Initialise le token mock USDC.
**Exemple d'utilisation**:
```solidity
MockUSDC usdc = new MockUSDC();
```

#### `mint(address to, uint256 amount)`
**Description**: Frappe des tokens mock USDC.
**Paramètres**:
- `to`: Adresse destinataire
- `amount`: Montant à frapper

**Exemple d'utilisation**:
```solidity
// Frapper 1000 USDC pour un utilisateur
usdc.mint(userAddress, 1000 * 1e8);
```

#### `decimals()`
**Description**: Retourne le nombre de décimales (8).
**Retour**: `uint8` - Nombre de décimales

**Exemple d'utilisation**:
```solidity
uint8 decimals = usdc.decimals(); // Retourne 8
```

---

## Exemples d'Intégration

### Workflow Complet de Dépôt dans le Vault

```solidity
// 1. Dépôt dans le vault
vault.deposit(1000 * 1e8); // 1000 USDC

// 2. Le vault auto-déploie vers Core via le handler
// (automatique si autoDeployBps > 0)

// 3. Staking des parts dans le hub de récompenses
vault.approve(rewardsHubAddress, 100 * 1e18);
rewardsHub.deposit(0, 100 * 1e18); // Pool 0

// 4. Récolte des récompenses
rewardsHub.harvest(0, msg.sender);
```

### Workflow de Création et Utilisation de Code de Parrainage

```solidity
// 1. Créer un code de parrainage
string memory code = referralRegistry.createCode();

// 2. Utiliser le code pour être whitelisté
bytes32 codeHash = keccak256(abi.encodePacked(code));
referralRegistry.useCode(codeHash);

// 3. Maintenant whitelisté, peut participer à la vente
axoneSale.buyWithUSDC(1000 * 1e18);
```

### Workflow de Rééquilibrage du Portefeuille

```solidity
// 1. Vérifier l'équité actuelle
uint256 equity = handler.equitySpotUsd1e18();

// 2. Rééquilibrer le portefeuille
handler.rebalancePortfolio(12345, 67890);

// 3. Vérifier la nouvelle équité
uint256 newEquity = handler.equitySpotUsd1e18();
```

---

## Notes Importantes

### Sécurité
- Tous les contrats utilisent des modificateurs de sécurité (ReentrancyGuard, Pausable)
- Les transferts utilisent SafeERC20 pour éviter les tokens malveillants
- Les calculs de prix incluent des protections contre le slippage

### Gas Optimization
- Les calculs sont optimisés pour minimiser la consommation de gas
- Les boucles sont limitées pour éviter les timeouts
- Les variables sont packées pour réduire le coût de stockage

### Gestion des Erreurs
- Tous les contrats utilisent des erreurs personnalisées pour une meilleure UX
- Les vérifications sont effectuées avant les interactions externes
- Les événements sont émis pour le suivi des opérations

### Compatibilité
- Compatible avec les standards ERC20
- Utilise OpenZeppelin pour la sécurité
- Supporte les interfaces standard pour l'intégration

---

*Cette documentation est mise à jour régulièrement. Pour toute question ou clarification, consultez le code source ou contactez l'équipe de développement.*
