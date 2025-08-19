# Guide d'utilisation - Page de Parrainage Web3

## Vue d'ensemble

La page de parrainage (`/referral`) permet aux utilisateurs de s'authentifier via leur wallet et d'utiliser un code de parrainage pour accéder à l'application.

## Fonctionnalités

### 1. Connexion Wallet
- Support de MetaMask et autres wallets compatibles
- Vérification automatique du réseau Sepolia
- Affichage de l'adresse connectée

### 2. Vérification Whitelist
- Appel automatique à `isWhitelisted(address)` sur le contrat
- Redirection automatique si déjà whitelisté

### 3. Utilisation de Code de Parrainage
- Saisie du code de parrainage
- Hashage automatique avec `ethers.utils.keccak256`
- Appel à la fonction `useCode(codeHash)` du contrat

### 4. Gestion d'Erreurs
- Vérification du réseau (Sepolia requis)
- Validation des codes de parrainage
- Messages d'erreur explicites

## Configuration Technique

### Contrat
- **Adresse**: `0xE77b9AB620c90eeFC761Afd5C8e60F9913A3CA4f`
- **Réseau**: Sepolia (Chain ID: 11155111)
- **ABI**: `src/lib/abi/ReferralRegistry.json`

### Dépendances
- `wagmi` - Gestion des wallets et interactions blockchain
- `viem` - Client Ethereum
- `ethers@5` - Utilitaires pour le hashage

## Tests

### Test du Hashage
```typescript
import { testCodeHash } from '@/lib/testReferral'

// Test du code "TEST123"
const hash = testCodeHash()
console.log(hash)
```

### Codes de Test
- `TEST123` - Code de test standard
- `WELCOME` - Code de bienvenue
- `AXONE2024` - Code promotionnel
- `DEFI` - Code DeFi

## Flux Utilisateur

1. **Non connecté** → Page de connexion wallet
2. **Mauvais réseau** → Demande de changement vers Sepolia
3. **Déjà whitelisté** → Bouton "Go App" vers google.com
4. **Non whitelisté** → Formulaire de saisie de code

## Sécurité

- Vérification du chainId avant les appels contractuels
- Hashage sécurisé des codes avec Keccak256
- Gestion des erreurs de transaction
- Validation côté client et contrat

## Navigation

Tous les boutons "Launch App" pointent maintenant vers `/referral` :
- Header (`src/components/layout/Header.tsx`)
- Hero (`src/components/sections/Hero.tsx`)
- Footer (`src/components/layout/Footer.tsx`)

## Design

- Style inspiré d'Aave/Compound
- Gradient bleu clair en fond
- Cartes en verre avec backdrop-blur-sm
- Animations de validation
- Responsive design
