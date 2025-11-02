# ReferralRegistry — Système de parrainage (codes à usage unique, whitelist)

## Présentation
`ReferralRegistry` gère une whitelist gated par des codes de parrainage à usage unique, expirant après ~30 jours (en blocs). Le contrat est `Ownable`, `Pausable`, et protège contre la réentrance.

## Éléments clés
- Héritage: `Ownable`, `Pausable`, `ReentrancyGuard`
- Gestion du temps: blocs (≈12s/bloc), pas de timestamps pour l’expiration
- Quota par créateur: `codesQuota` (défaut 5)

## Événements
- `CodeCreated(bytes32 indexed codeHash, address indexed creator, uint256 creatorCount, uint256 quota)` — après création d’un code
- `CodeUsed(bytes32 indexed codeHash, address indexed user, address indexed referrer)` — après utilisation d’un code
- `Whitelisted(address indexed user, bytes32 indexed codeHash, address indexed referrer)` — émission lors de la mise en whitelist
- `CodeRevoked(bytes32 indexed codeHash, address indexed revoker)` — révocation d’un code (owner)

## Erreurs
- `AlreadyWhitelisted()` — l’utilisateur est déjà en whitelist
- `InvalidCode()` — code invalide/inexistant
- `CodeAlreadyUsed()` — code déjà utilisé
- `SelfReferral()` — auto-parrainage interdit
- `QuotaReached()` — quota atteint (obsolète dans version actuelle, remplacée par validations dédiées)
- `CodeExpired()` — code expiré
- `UnauthorizedOverwrite()` — collision hash non autorisée (autre créateur)
- `ZeroAddress()` — adresse zéro interdite
- `CodeNotFound()` — code introuvable
- `CodeGenerationPaused()` — génération on-chain temporairement désactivée
- `MaxCodesExceeded()` — dépassement du quota

## Modifiers
- `onlyWhitelisted` — restreint certaines actions aux adresses whitelisted

## Fonctions (vue d’ensemble)
| Nom | Signature | Visibilité | Mutabilité | Accès | Emits/Reverts |
|-----|-----------|------------|-----------|-------|---------------|
| createCode | `createCode(bytes32 codeHash)` | external | nonReentrant whenNotPaused | onlyWhitelisted | emits CodeCreated; reverts UnauthorizedOverwrite/MaxCodesExceeded/InvalidCode |
| createCode | `createCode()` → `string` | external | nonReentrant whenNotPaused | onlyWhitelisted | emits CodeCreated; reverts CodeGenerationPaused/MaxCodesExceeded |
| useCode | `useCode(bytes32 codeHash)` | external | nonReentrant whenNotPaused | - | emits CodeUsed, Whitelisted; reverts AlreadyWhitelisted/InvalidCode/CodeAlreadyUsed/SelfReferral/CodeExpired |
| getUnusedCodes | `getUnusedCodes(address creator)` → `string[]` | external view | view | - | - |
| setQuota | `setQuota(uint256 newQuota)` | external | - | onlyOwner | - |
| setCodeGenerationPaused | `setCodeGenerationPaused(bool paused)` | external | - | onlyOwner | - |
| revokeCode | `revokeCode(bytes32 codeHash)` | external | - | onlyOwner | emits CodeRevoked; reverts CodeNotFound |
| whitelistDirect | `whitelistDirect(address user)` | external | - | onlyOwner | emits Whitelisted; reverts ZeroAddress |
| pause/unpause | `pause()` / `unpause()` | external | - | onlyOwner | - |
| Getters | `isWhitelisted(address)` → bool, `referrerOf(address)` → address, `codesCreated(address)` → uint256, `codes(bytes32)` → `Code` | view | view | - | getters mappings |

## Détails des fonctions
### createCode(bytes32 codeHash)
- Description: Enregistre un code (hash) fourni off-chain. Collision gérée: seul le créateur initial peut écraser son propre code.
- Paramètres: `codeHash` (bytes32) — hash unique non nul
- Retour: aucun
- Accès: external, `nonReentrant`, `whenNotPaused`, `onlyWhitelisted`
- Emits: `CodeCreated(codeHash, msg.sender, newCount, codesQuota)`
- Reverts: `InvalidCode`, `UnauthorizedOverwrite`, `MaxCodesExceeded`
- Exemple:
```ts
await registry.createCode(ethers.keccak256(ethers.toUtf8Bytes("AXONE-ABCD")));
```

### createCode() → string
- Description: Crée un code on-chain, stocke le hash et la chaîne brute, et renvoie la chaîne brute.
- Paramètres: aucun
- Retour: `string` — code brut utilisable côté client
- Accès: external, `nonReentrant`, `whenNotPaused`, `onlyWhitelisted`
- Emits: `CodeCreated`
- Reverts: `CodeGenerationPaused`, `MaxCodesExceeded`
- Exemple:
```ts
const raw = await registry.createCode();
// Le hash est keccak256(raw) et est stocké on-chain
```

### useCode(bytes32 codeHash)
- Description: Utilise un code (hash) pour se whitelister; usage unique; enregistre le parrain.
- Paramètres: `codeHash` (bytes32)
- Retour: aucun
- Accès: external, `nonReentrant`, `whenNotPaused`
- Emits: `CodeUsed`, `Whitelisted`
- Reverts: `AlreadyWhitelisted`, `InvalidCode`, `CodeAlreadyUsed`, `SelfReferral`, `CodeExpired`
- Exemple:
```ts
await registry.useCode(ethers.keccak256(ethers.toUtf8Bytes(raw)));
```

### getUnusedCodes(address creator) → string[]
- Description: Renvoie les codes bruts non utilisés et non expirés connus pour `creator`.
- Accès: external view
- Exemple:
```ts
const list = await registry.getUnusedCodes(creator);
```

### setQuota(uint256 newQuota)
- Description: Met à jour `codesQuota` (maximum de codes par créateur).
- Accès: onlyOwner

### setCodeGenerationPaused(bool paused)
- Description: Active/désactive la génération on-chain.
- Accès: onlyOwner

### revokeCode(bytes32 codeHash)
- Description: Révoque un code (récupère le quota) — owner uniquement.
- Emits: `CodeRevoked`

### whitelistDirect(address user)
- Description: Ajoute directement `user` à la whitelist (bootstrap).
- Reverts: `ZeroAddress`

### pause() / unpause()
- Description: Pause/relance le contrat.

## Structures
```solidity
struct Code {
    address creator;
    bool used;
    uint256 expiresAtBlock;
}
```

## Exemples (ethers.js)
```ts
import { ethers } from "ethers";
const registry = new ethers.Contract(addr, abi, signer);

// Création off-chain
const codeHash = ethers.keccak256(ethers.toUtf8Bytes("AXONE-2025"));
await registry.createCode(codeHash);

// Création on-chain (retourne la chaîne brute)
const raw = await registry.createCode();

// Utilisation
await registry.useCode(ethers.keccak256(ethers.toUtf8Bytes(raw)));

// Lecture
const ok = await registry.isWhitelisted(user);
const ref = await registry.referrerOf(user);
```

## Notes
- Expiration: ~30 jours en blocs (`30 * 24 * 60 * 60 / 12`).
- Les événements ne contiennent pas la chaîne brute pour éviter les fuites non nécessaires (stockée seulement pour les codes on-chain).
