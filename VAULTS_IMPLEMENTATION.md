# Implémentation des Vaults - Dashboard & Administration

## 🎯 Vue d'ensemble

L'implémentation des vaults comprend deux pages principales :
- **Dashboard des Vaults** (`/vaults`) : Interface utilisateur pour consulter et filtrer les vaults
- **Administration** (`/admin/vaults`) : Interface d'administration pour gérer les vaults

## 📁 Structure des fichiers

### Types et données
- `src/lib/vaultTypes.ts` - Interfaces TypeScript pour les vaults
- `src/lib/vaultMock.ts` - Données de démonstration

### Composants UI
- `src/components/ui/button.tsx` - Composant Button (Shadcn/ui convention)
- `src/components/ui/RiskBadge.tsx` - Badge de niveau de risque
- `src/components/ui/StatusIndicator.tsx` - Indicateur de statut
- `src/components/ui/TokenIcon.tsx` - Icônes des tokens
- `src/components/ui/input.tsx` - Champ de saisie
- `src/components/ui/label.tsx` - Étiquette de formulaire
- `src/components/ui/select.tsx` - Menu déroulant
- `src/components/ui/checkbox.tsx` - Case à cocher
- `src/components/ui/index.ts` - Exports centralisés

### Composants Vaults
- `src/components/vaults/VaultTable.tsx` - Tableau des vaults avec graphiques
- `src/components/vaults/VaultFilters.tsx` - Filtres et tri
- `src/components/vaults/VaultForm.tsx` - Formulaire d'administration

### Pages
- `src/app/vaults/page.tsx` - Dashboard principal
- `src/app/admin/vaults/page.tsx` - Interface d'administration

## 🎨 Fonctionnalités

### Dashboard des Vaults
- **Affichage en tableau** avec colonnes : Nom, TVL, Composition, Dépôt utilisateur, Performance, Statut, Risque, Actions
- **Graphiques intégrés** :
  - Camemberts Recharts pour la composition des tokens
  - Sparklines pour la performance 30j
- **Système de filtres** :
  - Tri par TVL (croissant/décroissant)
  - Filtre par tokens
  - Filtre par statut (ouvert/fermé/en pause)
  - Filtre "Mes vaults" (dépôts utilisateur > 0)
- **Indicateurs visuels** :
  - Badges colorés pour le risque (Bas/Moyen/Élevé)
  - Indicateurs de statut
  - Icônes de tokens avec couleurs

### Administration
- **Gestion complète** des vaults (CRUD)
- **Formulaire dynamique** avec validation
- **Composition des tokens** avec pourcentage total = 100%
- **Persistance locale** via localStorage
- **Interface intuitive** avec prévisualisation

## 🛠️ Technologies utilisées

- **React 19** avec TypeScript
- **Next.js 15** (App Router)
- **Tailwind CSS** avec couleurs Axone personnalisées
- **Recharts** pour les graphiques
- **Radix UI** pour les composants d'interface
- **Lucide React** pour les icônes

## 🎨 Couleurs Axone

```typescript
axone: {
  "sandy-brown": "#fab062",
  "stellar-green": "#011f26", 
  "flounce": "#4a8c8c",
  risk: {
    low: "#4ade80",
    medium: "#f59e0b", 
    high: "#ef4444"
  }
}
```

## 📊 Données Mock

4 vaults de démonstration inclus :
- **UnusVault** : Vault équilibré (BTC, AXN, UETH, USOL, HYPE)
- **StableYield** : Vault stable (USDC, DAI)
- **DeFi Growth** : Vault DeFi (ETH, UNI, AAVE, COMP)
- **Conservative** : Vault conservateur (USDC, USDT, DAI)

## 🔧 Configuration requise

### Dépendances installées
```bash
pnpm add recharts lucide-react @radix-ui/react-select @radix-ui/react-label @radix-ui/react-checkbox class-variance-authority
```

### Variables CSS personnalisées
Les composants utilisent les variables CSS de Tailwind pour l'apparence cohérente.

## 🚀 Utilisation

### Accès aux pages
- Dashboard : `http://localhost:3000/vaults`
- Administration : `http://localhost:3000/admin/vaults`

### Fonctionnalités clés
1. **Filtrage en temps réel** des vaults
2. **Tri dynamique** par TVL
3. **Gestion complète** via l'interface admin
4. **Validation** des pourcentages de tokens
5. **Persistance** des modifications

## 🔮 Prochaines étapes

### Intégration Wallet
```typescript
// Dans vaults/page.tsx
import { useAccount } from 'wagmi'
const { address } = useAccount()
```

### Backend Integration
- Remplacer localStorage par des appels API
- Ajouter authentification admin
- Implémenter validation côté serveur

### Améliorations UX
- Animations de transition
- Notifications de succès/erreur
- Mode sombre optimisé
- Responsive design amélioré

## 📝 Notes techniques

- **Persistance** : localStorage pour le prototypage
- **Validation** : Pourcentages totaux = 100%
- **Performance** : Graphiques optimisés avec Recharts
- **Accessibilité** : Composants Radix UI conformes WCAG
- **Type Safety** : TypeScript strict pour tous les composants

## 🐛 Dépannage

### Erreurs courantes
1. **Graphiques non affichés** : Vérifier l'installation de Recharts
2. **Styles manquants** : Vérifier la configuration Tailwind
3. **Composants non trouvés** : Vérifier les imports Radix UI
4. **Erreurs d'import Button** : Utiliser la convention Shadcn/ui

### Convention d'import Shadcn/ui
```typescript
// ✅ Correct
import { Button } from '@/components/ui/button'

// ❌ Incorrect
import Button from '@/components/ui/Button'
```

### Solutions
- Redémarrer le serveur de développement
- Vérifier les dépendances avec `pnpm install`
- Consulter la console du navigateur pour les erreurs
- Respecter la convention de nommage en minuscules pour les chemins
