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
- `src/components/ui/button.tsx`
- `src/components/ui/RiskBadge.tsx`
- `src/components/ui/StatusIndicator.tsx`
- `src/components/ui/TokenIcon.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/index.ts`

### Composants Vaults
- `src/components/vaults/VaultTable.tsx`
- `src/components/vaults/VaultFilters.tsx`
- `src/components/vaults/VaultForm.tsx`

### Pages
- `src/app/vaults/page.tsx`
- `src/app/admin/vaults/page.tsx`

## 🎨 Fonctionnalités

### Dashboard des Vaults
- Tableau avec colonnes : Nom, TVL, Composition, Dépôt utilisateur, Performance, Statut, Risque, Actions
- Graphiques Recharts (camemberts, sparklines)
- Filtres : TVL, tokens, statut, "Mes vaults"
- Indicateurs : badges de risque, statut, icônes de tokens

### Administration
- CRUD complet
- Formulaire dynamique avec validation
- Composition des tokens (total 100%)
- Persistance locale via localStorage

## 🛠️ Technologies
- React 19, Next.js 15, Tailwind CSS
- Recharts, Radix UI, Lucide React

## 📊 Données Mock
- UnusVault, StableYield, DeFi Growth, Conservative

## 🔧 Configuration requise
```bash
pnpm add recharts lucide-react @radix-ui/react-select @radix-ui/react-label @radix-ui/react-checkbox class-variance-authority
```

## 🚀 Accès
- Dashboard : `http://localhost:3000/vaults`
- Admin : `http://localhost:3000/admin/vaults`

## 🐛 Dépannage
- Vérifier installation Recharts et config Tailwind
- Respecter convention d'import Shadcn/ui

