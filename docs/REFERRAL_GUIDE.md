# Guide d'utilisation - Referral (Pages protégées)

## 🔐 Configuration centralisée des pages protégées
> Pour la gestion détaillée des métriques, quotas et fonctionnalités avancées, voir également `./REFERRAL_MANAGEMENT_GUIDE.md`.
Depuis la version 0.1.0, les pages nécessitant une whitelist via le système de referral sont gérées via un fichier de configuration unique.

### Fichier de référence
`src/lib/referralRoutesConfig.ts`

### Fonctionnement
- Ce fichier liste toutes les routes nécessitant une protection (ex: `/referral-management`).
- Pour activer/désactiver la protection d'une page, modifiez simplement ce tableau.
- Une fonction utilitaire `isReferralProtectedRoute(path)` est fournie pour vérifier proprement si une route est protégée.

### Exemple de configuration
```ts
export const REFERRAL_PROTECTED_ROUTES = [
  '/referral-management',  // Page de gestion des parrainages
  // Exemple futur : '/admin/vaults', '/dashboard'
] as const;

export type ProtectedRoute = typeof REFERRAL_PROTECTED_ROUTES[number];

export function isReferralProtectedRoute(path: string): path is ProtectedRoute {
  return (REFERRAL_PROTECTED_ROUTES as readonly string[]).includes(path);
}
```

### Règles à respecter
- ✅ Ajouter une route: insérez le chemin complet dans le tableau (ex: `'/nouvelle-page'`).  
- ❌ Ne pas modifier les vérifications métier (connexion, réseau, whitelist, parrain) dans les pages.
- ⚠️ Ne pas supprimer `/referral-management` sans validation métier.

> ⚠️ Attention: Supprimer accidentellement `/referral-management` du tableau exposera la gestion des parrainages à tous les utilisateurs.

### Intégration dans une page
Exemple minimal pour une nouvelle page protégée `src/app/nouvelle-page/page.tsx`:
```tsx
'use client'
import { usePathname } from 'next/navigation'
import { isReferralProtectedRoute } from '@/lib/referralRoutesConfig'

export default function NouvellePage() {
  const pathname = usePathname()
  const isProtectedRoute = isReferralProtectedRoute(pathname || '')

  if (isProtectedRoute) {
    // Copiez ici le bloc de protection existant (connexion, réseau, whitelist, parrain)
    // if (!isConnected) { /* ... */ }
    // if (chainId !== HYPEREVM_CHAIN_ID) { /* ... */ }
    // if (!isWhitelisted || !hasReferrer) { /* ... */ }
  }

  return (
    <div className="MB-[20rem]">Contenu</div>
  )
}
```

### Notes
- Cette configuration n'affecte pas la page `/referral`, qui reste le point d'entrée pour obtenir la whitelist.
- Utilisez `MB-[20rem]` pour les espacements verticaux lorsque pertinent.

### Liens croisés
- Connexion wallet et réseau: `./WALLET_CONNECTION_GUIDE.md`
- Implémentation des vaults (si des pages vaults sont protégées): `./contracts/STRATEGY_1_VaultContract.md`

## Notes sur la transférabilité du token sAXN1

- **Transférable**: Les parts du vault `sAXN1` sont des tokens ERC20 (18 décimales) pleinement transférables entre adresses.
- **Aucun frais sur transfert**: Les frais ne s’appliquent qu’au dépôt (`depositFeeBps`) et au retrait (`withdrawFeeBps`). Les transferts ne déclenchent aucun frais.
- **Pause & sécurité**: Les transferts sont bloqués si le vault est en pause et sont protégés contre la réentrance.
- **Compatibilité**: Les fonctions ERC20 standard sont disponibles: `transfer`, `approve`, `transferFrom`, `allowance`, `balanceOf`.

## Transferts de parts de vault
- Les parts `sAXN1` sont transférables via les fonctions ERC20 standard.
- **Restrictions** :
  - Les transferts vers `0x0` sont interdits (`zero address`).
  - Les transferts de montant `0` sont interdits (`zero value`).
  - Les autorisations (`approve`) doivent être réinitialisées à `0` avant modification.

### Annulation des demandes de retrait
- **🚨 CORRECTION CRITIQUE** : Les demandes de retrait en file d'attente peuvent maintenant être annulées correctement
- **Problème résolu** : Les parts ne sont plus brûlées immédiatement lors de la demande de retrait
- **Nouvelle logique** : Les parts sont conservées jusqu'au règlement final, permettant l'annulation
- **Fonction** : `cancelWithdrawRequest(uint256 id)` fonctionne maintenant correctement

<div class="MB-[20rem]"></div>

## Guide d'utilisation - Page de Parrainage Web3

### Vue d'ensemble

La page de parrainage (`/referral`) permet aux utilisateurs de s'authentifier via leur wallet et d'utiliser un code de parrainage pour accéder à l'application.

### Fonctionnalités

#### 1. Connexion Wallet
- Support de MetaMask et autres wallets compatibles
- Vérification automatique du réseau HyperEVM Testnet
- Affichage de l'adresse connectée

#### 2. Vérification Whitelist
- Appel automatique à `isWhitelisted(address)` sur le contrat
- Redirection automatique si déjà whitelisté

#### 3. Utilisation de Code de Parrainage
- Saisie du code de parrainage
- Hashage automatique avec `ethers.utils.keccak256`
- Appel à la fonction `useCode(codeHash)` du contrat

#### 4. Gestion d'Erreurs
- Vérification du réseau (HyperEVM Testnet requis)
- Validation des codes de parrainage
- Messages d'erreur explicites

### Configuration Technique

#### Contrat
- Adresse: `0xd9145CCE52D386f254917e481eB44e9943F39138`
- Réseau: HyperEVM Testnet (Chain ID: 998)
- ABI: `src/lib/abi/ReferralRegistry.json`

#### Dépendances
- `wagmi` - Gestion des wallets et interactions blockchain
- `viem` - Client Ethereum
- `ethers@5` - Utilitaires pour le hashage

### Tests

#### Test du Hashage
```typescript
import { testCodeHash } from '@/lib/testReferral'

// Test du code "TEST123"
const hash = testCodeHash()
console.log(hash)
```

#### Codes de Test
- `TEST123` - Code de test standard
- `WELCOME` - Code de bienvenue
- `AXONE2024` - Code promotionnel
- `DEFI` - Code DeFi

### Flux Utilisateur

1. Non connecté → Page de connexion wallet
2. Mauvais réseau → Demande de changement vers HyperEVM Testnet
3. Déjà whitelisté → Bouton "Gérer mes parrainages" vers `/referral-management`
4. Non whitelisté → Formulaire de saisie de code

### Sécurité

- Vérification du chainId avant les appels contractuels
- Hashage sécurisé des codes avec Keccak256
- Gestion des erreurs de transaction
- Validation côté client et contrat
- **🔒 SÉCURITÉ RENFORCÉE** : Utilisation de `block.number` au lieu de `block.timestamp` pour les expirations (résistance à la manipulation temporelle)
- **⏰ PRÉCISION** : Codes de parrainage expirés après 30 jours en blocs (environ 216,000 blocs)
- **🛡️ PROTECTION** : Résistance à la manipulation des validateurs sur les délais critiques

### Navigation

Tous les boutons "Launch App" pointent vers `/referral` :
- Header (`src/components/layout/Header.tsx`)
- Hero (`src/components/sections/Hero.tsx`)
- Footer (`src/components/layout/Footer.tsx`)

### Design

- Style inspiré d'Aave/Compound
- Gradient bleu clair en fond
- Cartes en verre avec backdrop-blur-sm
- Animations de validation
- Responsive design
