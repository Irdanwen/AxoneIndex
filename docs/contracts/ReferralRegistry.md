# ReferralRegistry — Système de Parrainage avec Codes à Usage Unique

## Vue d'ensemble
Le `ReferralRegistry` est un contrat de whitelist basé sur un système de parrainage avec des codes à usage unique. Il permet aux créateurs de générer des codes de parrainage qui expirent après 30 jours et ne peuvent être utilisés qu'une seule fois.

## Fonctionnalités principales

### 1. Génération de codes de parrainage
- Codes à usage unique (one-time use)
- Expiration automatique après 30 jours
- Quota par créateur (limite le nombre de codes créés)
- Support pour codes générés on-chain ou off-chain

### 2. Système de whitelist
- Inscription d'adresses via codes de parrainage
- Suivi des relations parrain-parrainé
- Vérification du statut de whitelist

### 3. Gestion administrative
- Pause d'urgence du système
- Gestion des quotas par créateur
- Consultation des codes créés

## API Principale

### Pour les créateurs de codes

```solidity
// Créer un code de parrainage
function createCode(string calldata rawCode) external returns (bytes32);

// Créer un code avec hash pré-calculé (off-chain)
function createCodeWithHash(bytes32 codeHash) external returns (bytes32);

// Consulter les codes créés
function getCodesByCreator(address creator) external view returns (bytes32[]);
```

### Pour les utilisateurs

```solidity
// Utiliser un code de parrainage
function useCode(string calldata rawCode) external;

// Utiliser un code avec hash pré-calculé
function useCodeWithHash(bytes32 codeHash) external;

// Vérifier le statut de whitelist
function isWhitelisted(address user) external view returns (bool);

// Obtenir le parrain d'un utilisateur
function referrerOf(address user) external view returns (address);
```

### Pour les administrateurs

```solidity
// Pause d'urgence
function pause() external onlyOwner;
function unpause() external onlyOwner;

// Gérer les quotas
function setQuotaPerCreator(uint256 newQuota) external onlyOwner;

// Consultation
function getCodeInfo(bytes32 codeHash) external view returns (Code memory);
```

## Structures de données

```solidity
struct Code {
    address creator;           // Créateur du code
    bool used;                // Statut d'utilisation
    uint256 expiresAtBlock;   // Bloc d'expiration
}
```

## Gestion du temps

### Utilisation de block.number
Le contrat utilise `block.number` au lieu de `block.timestamp` pour éviter la manipulation par les validateurs :

```solidity
// Expiration après 30 jours (approximativement)
uint256 constant EXPIRATION_BLOCKS = 30 * 24 * 60 * 60 / 12; // 30 jours en blocs (≈12s/bloc)
uint256 expiresAtBlock = block.number + EXPIRATION_BLOCKS;
```

### Calcul approximatif
- **Ethereum mainnet** : ~12 secondes par bloc
- **30 jours** ≈ 216,000 blocs
- **HyperEVM** : ~2 secondes par bloc
- **30 jours** ≈ 1,296,000 blocs

## Sécurité

### Mesures implémentées
- **Pausable** : Arrêt d'urgence possible
- **ReentrancyGuard** : Protection contre les attaques de réentrance
- **Ownable** : Contrôle d'accès administratif
- **CEI Pattern** : Checks-Effects-Interactions respecté

### Validations
- Vérification de l'expiration des codes
- Prévention de la réutilisation des codes
- Limitation du quota par créateur
- Validation des adresses zéro

## Événements

```solidity
event CodeCreated(
    address indexed creator,
    bytes32 indexed codeHash,
    string rawCode,
    uint256 expiresAtBlock
);

event CodeUsed(
    address indexed user,
    bytes32 indexed codeHash,
    address indexed referrer
);

event QuotaPerCreatorUpdated(uint256 oldQuota, uint256 newQuota);
event Paused(address account);
event Unpaused(address account);
```

## Exemples d'utilisation

### 1. Création et utilisation d'un code

```solidity
// Créateur génère un code
string memory code = "AXONE2024";
bytes32 codeHash = referralRegistry.createCode(code);

// Utilisateur utilise le code
referralRegistry.useCode(code);

// Vérification
bool isWhitelisted = referralRegistry.isWhitelisted(user);
address referrer = referralRegistry.referrerOf(user);
```

### 2. Gestion des quotas

```solidity
// Vérifier le quota d'un créateur
uint256 quota = referralRegistry.quotaPerCreator();
uint256 codesCreated = referralRegistry.codesCreated(creator);

// Créer des codes jusqu'à la limite
for (uint256 i = 0; i < quota; i++) {
    string memory code = string(abi.encodePacked("CODE", i));
    referralRegistry.createCode(code);
}
```

### 3. Consultation des codes

```solidity
// Obtenir tous les codes d'un créateur
bytes32[] memory codes = referralRegistry.getCodesByCreator(creator);

// Consulter les détails d'un code
ReferralRegistry.Code memory codeInfo = referralRegistry.getCodeInfo(codeHash);
```

## Intégration avec l'écosystème

### Vaults et staking
Le système de parrainage peut être intégré avec les vaults pour :
- Accès privilégié aux nouveaux vaults
- Bonus de récompenses pour les parrainés
- Réduction de frais pour les parrains

### Interface utilisateur
L'interface doit permettre :
- Génération de codes par les créateurs
- Saisie de codes par les utilisateurs
- Consultation du statut de parrainage
- Gestion des quotas

## Tests recommandés

### Tests unitaires
```javascript
describe("ReferralRegistry", () => {
  it("should create and use codes correctly", async () => {
    const code = "TEST123";
    const codeHash = await referralRegistry.createCode(code);
    
    await referralRegistry.useCode(code);
    
    expect(await referralRegistry.isWhitelisted(user)).to.be.true;
    expect(await referralRegistry.referrerOf(user)).to.equal(creator);
  });

  it("should prevent code reuse", async () => {
    await referralRegistry.useCode(code);
    
    await expect(
      referralRegistry.useCode(code)
    ).to.be.revertedWith("Code already used");
  });

  it("should handle expired codes", async () => {
    // Avancer dans le temps pour expirer le code
    await time.advanceBlock(EXPIRATION_BLOCKS + 1);
    
    await expect(
      referralRegistry.useCode(code)
    ).to.be.revertedWith("Code expired");
  });
});
```

### Tests d'intégration
1. **Cycle complet** : Création → Utilisation → Vérification
2. **Gestion des quotas** : Limitation et dépassement
3. **Expiration** : Comportement avec codes expirés
4. **Pause** : Fonctionnement en mode pause

## Maintenance

### Surveillance
- Monitorer les codes créés et utilisés
- Vérifier les quotas par créateur
- Surveiller les tentatives d'utilisation de codes expirés

### Mises à jour
- Ajustement des quotas selon les besoins
- Modification des délais d'expiration si nécessaire
- Ajout de nouvelles fonctionnalités de parrainage

## Support

Pour toute question ou problème :
1. Vérifier les événements émis
2. Contrôler les quotas et l'expiration
3. Tester avec différents scénarios d'utilisation
4. Consulter la documentation des contrats liés
