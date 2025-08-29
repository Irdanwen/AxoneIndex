# Guide d'utilisation - Referral (Pages protégées)

## 🔐 Configuration centralisée des pages protégées
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
- Connexion wallet et réseau: `../WALLET_CONNECTION_GUIDE.md`
- Implémentation des vaults (si des pages vaults sont protégées): `../VAULTS_IMPLEMENTATION.md`

## Notes sur la transférabilité du token c50USD

- **Transférable**: Les parts du vault `c50USD` sont des tokens ERC20 (18 décimales) pleinement transférables entre adresses.
- **Aucun frais sur transfert**: Les frais ne s’appliquent qu’au dépôt (`depositFeeBps`) et au retrait (`withdrawFeeBps`). Les transferts ne déclenchent aucun frais.
- **Pause & sécurité**: Les transferts sont bloqués si le vault est en pause et sont protégés contre la réentrance.
- **Compatibilité**: Les fonctions ERC20 standard sont disponibles: `transfer`, `approve`, `transferFrom`, `allowance`, `balanceOf`.

## Transferts de parts de vault
- Les parts `c50USD` sont transférables via les fonctions ERC20 standard.
- **Restrictions** :
  - Les transferts vers `0x0` sont interdits (`zero address`).
  - Les transferts de montant `0` sont interdits (`zero value`).
  - Les autorisations (`approve`) doivent être réinitialisées à `0` avant modification.

### Annulation des demandes de retrait
- Les demandes de retrait en file d'attente peuvent être annulées si le solde courant de l'appelant couvre la quantité de parts en attente d'annulation.
- Cette logique n'est plus limitée à l'adresse d'origine de la demande.

<div class="MB-[20rem]"></div>
