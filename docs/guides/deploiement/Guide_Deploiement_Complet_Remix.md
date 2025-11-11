# Guide de Déploiement Complet - Smart Contracts Axone sur Remix

<!--
title: "Guide de Déploiement Complet — Remix"
lang: fr
updated: 2025-10-24
owner: Axone Team
-->

## Table des Matières

1. [Prérequis et Configuration](#prérequis-et-configuration)
2. [Ordre de Déploiement](#ordre-de-déploiement)
3. [Déploiement des Contrats de Base](#déploiement-des-contrats-de-base)
4. [Déploiement des Contrats de Staking](#déploiement-des-contrats-de-staking)
5. [Déploiement des Contrats HYPE50 Defensive](#déploiement-des-contrats-hype50-defensive)
6. [Configuration Post-Déploiement](#configuration-post-déploiement)
7. [Exemples d'Interactions](#exemples-dinteractions)
8. [Dépannage](#dépannage)

---

## Prérequis et Configuration

### Configuration Remix IDE

1. **Accéder à Remix** : `https://remix.ethereum.org`
2. **Configuration du Compilateur** :
   - Version Solidity : `0.8.26` (compatible avec `^0.8.20`, `^0.8.24`, `^0.8.26`)
   - Enable Optimization : `ON` (runs: 200)
   - EVM Version : `default`

3. **Résolution des Imports OpenZeppelin** :
   
   **Option A (Recommandée)** - Utiliser remixd :
   ```bash
   npm i -g @remix-project/remixd
   remixd -s /Users/morganmagalhaes/Documents/Codage/Cursor/AxoneIndex/contracts --remix-ide https://remix.ethereum.org
   ```
   Dans Remix : "Connect to Localhost" → utiliser ce workspace

   **Option B** - Copier manuellement les contrats dans Remix

4. **Fichiers à Importer** :
   - `contracts/src/AxoneToken.sol`
   - `contracts/src/AxoneSale.sol`
   - `contracts/src/ReferralRegistry.sol`
   - `contracts/src/mocks/MockUSDC.sol`
   - `contracts/src/Staking/EmissionController.sol`
   - `contracts/src/Staking/RewardsHub.sol`
   - `contracts/src/Staking/interfaces/IMintable.sol`
   - `contracts/src/Staking/interfaces/IEmissionController.sol`
   - `contracts/src/Staking/interfaces/IRewarder.sol`
   - `contracts/src/HYPE50 Defensive/VaultContract.sol`
   - `contracts/src/HYPE50 Defensive/CoreInteractionHandler.sol`
   - `contracts/src/HYPE50 Defensive/interfaces/L1Read.sol`
   - `contracts/src/HYPE50 Defensive/interfaces/CoreWriter.sol`
   - `contracts/src/HYPE50 Defensive/Rebalancer50Lib.sol`
   - `contracts/src/HYPE50 Defensive/utils/HLConstants.sol`

5. **Configuration Metamask** :
   - Connecter au réseau cible (testnet recommandé)
   - S'assurer d'avoir suffisamment d'ETH pour les déploiements

---

## Ordre de Déploiement

### Phase 1 : Contrats de Base
1. **MockUSDC** (pour les tests)
2. **AxoneToken** (token principal)
3. **ReferralRegistry** (système de parrainage)
4. **AxoneSale** (vente de tokens)

### Phase 2 : Contrats de Staking
5. **EmissionController** (contrôleur d'émission)
6. **RewardsHub** (hub de staking)

### Phase 3 : Contrats HYPE50 Defensive (Optionnel)
7. **L1Read** (interface de lecture Core)
8. **CoreWriter** (interface d'écriture Core)
9. **CoreInteractionHandler** (gestionnaire d'interactions)
10. **VaultContract** (vault de parts)

---

## Déploiement des Contrats de Base

### 1. MockUSDC

**Objectif** : Token USDC de test pour les développements

**Constructor** :
```solidity
constructor() // Aucun paramètre
```

**Étapes Remix** :
1. Sélectionner `MockUSDC`
2. Cliquer "Deploy"
3. Noter l'adresse du contrat

**Exemple d'utilisation** :
```solidity
// Frapper 1000 USDC pour un utilisateur
mockUSDC.mint(userAddress, 1000 * 1e8);
```

### 2. AxoneToken

**Objectif** : Token ERC20 principal avec inflation contrôlée

**Constructor** :
```solidity
constructor(
    address _initialRecipient,    // Adresse recevant l'offre initiale
    address _inflationRecipient,  // Adresse recevant l'inflation
    address _initialOwner         // Propriétaire initial
)
```

**Paramètres d'exemple** :
- `_initialRecipient` : `0xVotreAdresse` (recevra 100M AXN)
- `_inflationRecipient` : `0xTresorerie` (recevra l'inflation)
- `_initialOwner` : `0xVotreAdresse` (peut mint, configurer, etc.)

**Étapes Remix** :
1. Sélectionner `AxoneToken`
2. Remplir les paramètres :
   - `_initialRecipient` : votre adresse
   - `_inflationRecipient` : adresse de trésorerie
   - `_initialOwner` : votre adresse
3. Cliquer "Deploy"
4. Noter l'adresse du contrat

**Configuration post-déploiement** :
```solidity
// Changer l'intervalle d'inflation à 1 jour
axoneToken.setInflationInterval(86400);

// Exclure une adresse de la supply circulante
axoneToken.setExcludedFromCirculating(treasuryAddress, true);
```

### 3. ReferralRegistry

**Objectif** : Système de whitelist basé sur des codes de parrainage

**Constructor** :
```solidity
constructor(address initialOwner) // Propriétaire initial
```

**Paramètres d'exemple** :
- `initialOwner` : `0xVotreAdresse`

**Étapes Remix** :
1. Sélectionner `ReferralRegistry`
2. Remplir le paramètre :
   - `initialOwner` : votre adresse
3. Cliquer "Deploy"
4. Noter l'adresse du contrat

**Configuration post-déploiement** :
```solidity
// Modifier le quota de codes par créateur
referralRegistry.setQuota(10);

// Whitelister directement un utilisateur (bootstrap)
referralRegistry.whitelistDirect(userAddress);
```

### 4. AxoneSale

**Objectif** : Contrat de vente AXN contre USDC

**Constructor** :
```solidity
constructor(
    address _axnToken,   // Adresse du token AXN
    address _usdcToken   // Adresse du token USDC
)
```

**Paramètres d'exemple** :
- `_axnToken` : adresse d'AxoneToken déployé
- `_usdcToken` : adresse de MockUSDC déployé

**Étapes Remix** :
1. Sélectionner `AxoneSale`
2. Remplir les paramètres :
   - `_axnToken` : adresse d'AxoneToken
   - `_usdcToken` : adresse de MockUSDC
3. Cliquer "Deploy"
4. Noter l'adresse du contrat

**Configuration post-déploiement** :
```solidity
// Définir la trésorerie qui recevra les USDC
axoneSale.setTreasury(treasuryAddress);

// Mettre à jour le prix (0.1 USDC par AXN)
axoneSale.updatePrice(0.1 * 1e8);

// Définir la tolérance au slippage (1%)
axoneSale.setMaxSlippageBps(100);
```

---

## Déploiement des Contrats de Staking

### 5. EmissionController

**Objectif** : Contrôleur d'émission de récompenses (mint ou drip)

**Constructor** :
```solidity
constructor(
    address rewardToken_,      // Adresse du token de récompense
    uint256 rewardPerSecond_,  // Récompense par seconde (en wei)
    bool isMintMode_          // Mode mint (true) ou drip (false)
)
```

**Paramètres d'exemple** :
- `rewardToken_` : adresse d'AxoneToken
- `rewardPerSecond_` : `500000000000000000` (0.5 AXN/s)
- `isMintMode_` : `true` (mode mint)

**Étapes Remix** :
1. Sélectionner `EmissionController`
2. Remplir les paramètres :
   - `rewardToken_` : adresse d'AxoneToken
   - `rewardPerSecond_` : `500000000000000000`
   - `isMintMode_` : `true`
3. Cliquer "Deploy"
4. Noter l'adresse du contrat

**Configuration post-déploiement** :
```solidity
// Définir le hub autorisé à tirer les récompenses
emissionController.setRewardsHub(rewardsHubAddress);

// Transférer l'ownership d'AxoneToken au contrôleur (mode mint)
axoneToken.transferOwnership(emissionControllerAddress);
```

### 6. RewardsHub

**Objectif** : Hub central de staking avec pools et distribution de récompenses

**Constructor** :
```solidity
constructor(address controller_) // Adresse de l'EmissionController
```

**Paramètres d'exemple** :
- `controller_` : adresse d'EmissionController

**Étapes Remix** :
1. Sélectionner `RewardsHub`
2. Remplir le paramètre :
   - `controller_` : adresse d'EmissionController
3. Cliquer "Deploy"
4. Noter l'adresse du contrat

**Configuration post-déploiement** :
```solidity
// Ajouter un pool de staking (ex: parts de vault)
rewardsHub.addPool(vaultTokenAddress, 100); // 100 points d'allocation

// Configurer un rewarder optionnel pour un pool
rewardsHub.setPoolRewarder(0, rewarderAddress);
```

---

## Déploiement des Contrats HYPE50 Defensive

### 7. L1Read (Interface de Lecture Core)

**Objectif** : Interface pour lire les données du système Core

**Note** : Ce contrat doit être déployé avec les interfaces appropriées du système Core. Pour les tests, vous pouvez utiliser un mock.

### 8. CoreWriter (adresse système)

**Objectif** : Adresse système `0x3333333333333333333333333333333333333333` utilisée par HyperCore pour recevoir les actions.

**Note** : Aucun déploiement n'est requis. Conservez l'adresse dans votre configuration/test; le handler y fait référence en dur. Pour les environnements de test, un stub reste disponible pour simuler les événements mais n'est plus injecté au constructeur.

### 9. CoreInteractionHandler

**Objectif** : Gestionnaire d'interactions avec le système Core

**Constructor** :
```solidity
constructor(
    L1Read _l1read,                    // Interface de lecture L1
    IERC20 _usdc,                      // Token USDC sur l’EVM (8 décimales)
    uint64 _maxOutboundPerEpoch,       // Maximum de sortie par époque (USD 1e8)
    uint64 _epochLength,               // Longueur d'une époque (en blocs)
    address _feeVault,                 // Vault des frais
    uint64 _feeBps                     // Frais en basis points
)
```

**Paramètres d'exemple** :
- `_l1read` : adresse de L1Read
- `_usdc` : adresse de l’USDC bridgé sur HyperEVM
- `_maxOutboundPerEpoch` : `100000000000` (100k USD équivalent en 1e8)
- `_epochLength` : `43200` (1 jour en blocs sur HyperEVM)
- `_feeVault` : adresse de trésorerie
- `_feeBps` : `50` (0.5%)

**Étapes Remix** :
1. Sélectionner `CoreInteractionHandler`
2. Remplir les paramètres avec les valeurs d'exemple
3. Cliquer "Deploy"
4. Noter l'adresse du contrat
5. ⚠️ Effectuer un micro-transfert Core → Handler afin d'initialiser le compte avant d'envoyer des actions, sous peine de revert `CoreAccountMissing()`.

### 10. VaultContract

**Objectif** : Vault ERC20 pour la gestion des parts d'investissement

**Constructor** :
```solidity
constructor() // Aucun paramètre (HYPE natif)
```

**Étapes Remix** :
1. Sélectionner `VaultContract`
2. Cliquer "Deploy"
3. Noter l'adresse du contrat

---

## Configuration Post-Déploiement

### Configuration du CoreInteractionHandler

```solidity
// Définir l'adresse du vault
coreHandler.setVault(vaultAddress);

// Configurer le lien HYPE avec Core
coreHandler.setHypeCoreLink(coreSystemAddress, hypeTokenId);

// Définir les IDs des marchés spot
coreHandler.setSpotIds(btcSpotId, hypeSpotId);

// Définir les IDs des tokens spot
coreHandler.setSpotTokenIds(usdcTokenId, btcTokenId, hypeTokenId);

// Configurer les paramètres de trading
coreHandler.setParams(50, 10, 50); // 0.5% slippage, 0.1% epsilon, 0.5% deadband

// Définir l'opérateur de rééquilibrage
coreHandler.setRebalancer(rebalancerAddress);
```

### Configuration du VaultContract

```solidity
// Définir le handler
vault.setHandler(handlerAddress);

// Configurer les frais (1% dépôt, 0.5% retrait, 90% auto-deploy)
vault.setFees(100, 50, 9000);

// Configurer les paliers de frais de retrait
// Note: Utiliser l'onglet "Low level interactions" pour encoder les structs
```

### Configuration du RewardsHub

```solidity
// Ajouter des pools de staking
rewardsHub.addPool(vaultTokenAddress, 100); // Pool 0
rewardsHub.addPool(axoneTokenAddress, 50);  // Pool 1

// Modifier les points d'allocation
rewardsHub.setAllocPoint(0, 150);
```

---

## Exemples d'Interactions

### Workflow Complet de Dépôt dans le Vault

```solidity
// 1. Approbation USDC
mockUSDC.approve(vaultAddress, 1000 * 1e8);

// 2. Dépôt dans le vault
vault.deposit(1000 * 1e8); // 1000 USDC

// 3. Staking des parts dans le hub
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

// 3. Acheter des tokens AXN
axoneSale.buyWithUSDC(1000 * 1e18);
```

### Workflow de Rééquilibrage du Portefeuille

```solidity
// 1. Vérifier l'équité actuelle
uint256 equity = coreHandler.equitySpotUsd1e18();

// 2. Rééquilibrer le portefeuille
coreHandler.rebalancePortfolio(12345, 67890);

// 3. Vérifier la nouvelle équité
uint256 newEquity = coreHandler.equitySpotUsd1e18();
```

---

## Dépannage

### Erreurs Fréquentes

1. **"Not whitelisted"** :
   - Solution : Utiliser un code de parrainage ou être whitelisté directement

2. **"Insufficient allowance"** :
   - Solution : Appeler `approve()` avant les transferts

3. **"Too early"** (mint inflation) :
   - Solution : Attendre que `inflationInterval` soit écoulé

4. **"auth"** (autorisation) :
   - Solution : Vérifier que l'appelant a les bonnes permissions

5. **"paused"** :
   - Solution : Appeler `unpause()` si vous êtes le propriétaire

### Vérifications Post-Déploiement

```solidity
// Vérifier les configurations
axoneToken.owner();
referralRegistry.owner();
axoneSale.treasury();
emissionController.rewardsHub();
rewardsHub.controller();
vault.handler();
coreHandler.vault();
```

### Unités et Conversions

- **AXN** : 18 décimales (1 AXN = 1e18)
- **USDC** : 8 décimales (1 USDC = 1e8)
- **Vault parts** : 18 décimales
- **Vault deposits** : 8 décimales (USDC)
- **Basis points** : 10000 = 100%

### Valeurs d'Exemple Prêtes à Copier

**rewardPerSecond (AXN 18 décimales)** :
- 0.25 AXN/s → `250000000000000000`
- 0.50 AXN/s → `500000000000000000`
- 1.00 AXN/s → `1000000000000000000`

**deposit(amount1e8) (USDC)** :
- 100 USDC → `10000000000`
- 1,000 USDC → `100000000000`
- 10,000 USDC → `1000000000000`

**Parts (18 décimales)** :
- 1 part → `1000000000000000000`
- 10 parts → `10000000000000000000`
- 100 parts → `100000000000000000000`

---

## Notes de Sécurité

1. **Multisig** : Utiliser un multisig pour les contrats en production
2. **Tests** : Toujours tester sur testnet avant mainnet
3. **Backup** : Sauvegarder les adresses et clés privées
4. **Monitoring** : Surveiller les événements et transactions
5. **Upgrades** : Planifier les mises à jour si nécessaire

---

## Support

Pour toute question ou problème :
1. Vérifier les événements émis par les contrats
2. Consulter la documentation des fonctions
3. Tester avec de petites quantités d'abord
4. Utiliser les fonctions de vue pour vérifier les états

---

*Ce guide est mis à jour régulièrement. Pour toute question ou clarification, consultez le code source ou contactez l'équipe de développement.*

