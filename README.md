# Axone Finance - Landing Page

Une landing page moderne et futuriste pour Axone Finance, inspirée du design de Sky.money avec une ambiance cosmique et institutionnelle.

## 🎨 Charte Graphique

### Couleurs Principales
- **Sandy Brown** `#fab062` - Couleur d'accent principal
- **Flounce** `#4a8c8c` - Couleur secondaire
- **Stellar Green** `#011f26` - Couleur de fond sombre

### Couleurs Fonctionnelles
- **Succès** `#3CD88C`
- **Alerte** `#FFB020`
- **Erreur** `#FF5C5C`
- **Info** `#4D9FFF`

### Typographie
- **Titres (H1/H2/H3)** : Inter Bold, espacé négatif léger (-0.5px)
- **Texte** : Inter Regular/Medium
- **Boutons CTA** : uppercase, SemiBold

### Style UI
- **Effet glassmorphism** : `rgba(255,255,255,0.05)` + `blur(20px)`
- **Boutons CTA** : dégradé violet/bleu, arrondi XL, glow au hover
- **Footer** : fond noir nuit, texte gris clair
- **Background** : dégradés de sandy brown à Stellar Green + formes géométriques animées

## 📁 Structure du Projet

```
axone-finance/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Layout principal
│   │   ├── page.tsx            # Page d'accueil
│   │   └── globals.css         # Styles globaux
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx      # Header avec navigation
│   │   │   └── Footer.tsx      # Footer avec liens
│   │   ├── sections/
│   │   │   ├── Hero.tsx        # Section héro principale
│   │   │   ├── About.tsx       # Section Axone (2 colonnes)
│   │   │   └── HowItWorks.tsx  # Section Axone Stars
│   │   └── ui/
│   │       ├── Button.tsx      # Composant bouton
│   │       ├── AnimatedCounter.tsx # Compteur animé
│   │       ├── GlassCard.tsx   # Carte avec effet glassmorphism
│   │       └── SectionTitle.tsx # Titre de section
│   └── lib/
│       └── utils.ts            # Utilitaires shadcn/ui
├── tailwind.config.ts          # Configuration Tailwind
└── package.json
```

## 🚀 Sections du Site

### 1. Header (Sticky, Semi-transparent)
- Logo futuriste Axone à gauche
- Navigation : Explore, Participate, Build, Docs
- CTA bouton "Launch App"

### 2. Hero Section (Plein écran)
- Fond dégradé avec formes géométriques animées
- Titre : "Get rewarded for saving, without giving up control"
- CTA principal "Launch App"
- Statistiques : Users (125K+), TVL ($45.2M), Performance (+18.5%)

### 3. Section Axone (2 colonnes)
- Texte explicatif à gauche
- Illustration du token Axone à droite
- Bouton "Access Axone"

### 4. Section Axone Stars (Ciel étoilé)
- Fond sombre avec étoiles animées
- 8 étoiles représentant les fonctionnalités clés
- Layout en constellation

### 5. Footer (Fond noir nuit)
- 2 colonnes : branding + liens organisés
- Liens : Explore, Ecosystem, Participate, Build
- Mentions légales en bas

## ✨ Animations

### Effets Principaux
- **Fade-in progressif** des sections au scroll
- **Hover sur CTA** : glow cosmique
- **Hover sur cartes** : `translateY(-5px)` + shadow douce
- **Formes géométriques** animées lentement
- **Particules flottantes** en arrière-plan

### Animations CSS
```css
/* Exemples d'animations disponibles */
.animate-fade-in
.animate-fade-in-up
.animate-scale-in
.animate-float
.animate-pulse-glow
.animate-gradient-shift
.animate-shimmer
```

## 🛠️ Technologies Utilisées

- **Next.js 15** - Framework React
- **TypeScript** - Typage statique
- **Tailwind CSS 4** - Framework CSS
- **Framer Motion** - Animations
- **Lucide React** - Icônes
- **shadcn/ui** - Composants UI

## 🎯 Composants Réutilisables

### Button
```tsx
<Button variant="primary" size="lg">
  Launch App
</Button>
```

### AnimatedCounter
```tsx
<AnimatedCounter value="125K+" duration={2} />
```

### GlassCard
```tsx
<div className="glass-card p-8 rounded-3xl">
  Contenu avec effet glassmorphism
</div>
```

## 🎨 Classes CSS Utilitaires

### Couleurs
```css
.text-axone-accent      /* Sandy Brown */
.text-axone-flounce     /* Flounce */
.text-axone-dark        /* Stellar Green */
.bg-gradient-primary    /* Dégradé principal */
.bg-gradient-secondary  /* Dégradé secondaire */
```

### Effets
```css
.glass-card             /* Effet glassmorphism */
.glass-card-strong      /* Glassmorphism plus prononcé */
.shadow-glow            /* Ombre avec glow */
.shadow-glow-flounce    /* Glow flounce */
```

### Animations
```css
.animate-float          /* Flottement */
.animate-pulse-glow     /* Pulse avec glow */
.animate-gradient-shift /* Dégradé animé */
.animate-shimmer        /* Effet brillance */
```

## 📱 Responsive Design

- **Mobile First** : Design optimisé pour mobile
- **Breakpoints** : sm, md, lg, xl, 2xl
- **Navigation** : Menu hamburger sur mobile
- **Grilles** : Adaptatives selon la taille d'écran

## 🚀 Installation et Démarrage

```bash
# Installation des dépendances
npm install

# Démarrage en mode développement
npm run dev

# Build de production
npm run build

# Démarrage en production
npm start
```

## 📊 Performance

- **Lazy Loading** des composants
- **Optimisation des images** avec Next.js
- **Animations CSS** pour les performances
- **Code splitting** automatique

## 🎨 Personnalisation

### Modifier les couleurs
Éditez `tailwind.config.ts` pour changer la palette de couleurs.

### Ajouter des animations
Utilisez les classes d'animation existantes ou créez-en de nouvelles dans la config Tailwind.

### Modifier le contenu
Les textes et données sont facilement modifiables dans les composants correspondants.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

---

**Axone Finance** - Le futur de la finance décentralisée 🌟

---

## Système de Vaults ERC-4626 + Staking (RewardsHub)

Ce repo contient une base modulaire pour gérer N vaults ERC‑4626 émettant des shares (18 décimales) et un RewardsHub central distribuant un token de récompense (ex: AXN) via un EmissionController.

### Contrats clés

- `contracts/src/Staking/Vault.sol` (fourni) : Vault compatible HyperEVM. Les shares sont à 18 décimales.
- `contracts/src/Staking/RewardsHub.sol` : Staking multi‑pools, mono‑reward. Compatible tokens shares 18d.
- `contracts/src/Staking/EmissionController.sol` : Contrôle le débit (`rewardPerSecond`) et alimente le hub en mint ou drip.
- `contracts/src/Staking/RewarderExample.sol` : Exemple de rewarder secondaire (bonus token).
- `contracts/src/Staking/Router.sol` : Utilitaire `multicall` non‑custodial pour front.

Interfaces:

- `IEmissionController`, `IMintable`, `IRewarder`.

### Sécurité et contraintes

- ReentrancyGuard sur `RewardsHub` et `Router`.
- Ownable2Step + Pausable sur tous les contrats admin‑critiques.
- SafeERC20 pour tous les transferts.
- Événements concis, indexés.
- Décimales: assets 6/8/18 gérées dans les vaults 4626 (shares toujours 18). Le hub opère uniquement avec des shares 18.

### Flux (ASCII)

```
Utilisateur ---deposit shares---> RewardsHub ---pull()---> EmissionController ---mint/drip---> RewardsHub
          <--- harvest reward ---             (rewardPerSecond, lastPullTime)

Vault (ERC‑4626) <--- shares 18d ---> Utilisateur
```

### Guide d’intégration front

- Lecture pending:
  - `RewardsHub.pendingReward(pid, user) -> uint256`
  - APR approx: `APR ~ rewardPerSecond * 365j / TVL_reward_units`
- Actions:
  - Approver `stakeToken` (share ERC‑20) pour `RewardsHub`.
  - `deposit(pid, amount)` / `withdraw(pid, amount)`.
  - `harvest(pid, to)` ou `harvestAll(pids)`.

Exemple ajout d’un pool:

```solidity
// en admin
hub.addPool(IERC20(address(vaultShare)), 1000);
// changer l’allocation
hub.setAllocPoint(0, 1500);
// option bonus
hub.setPoolRewarder(0, rewarder);
```

### Notes décimales

- Les shares sont à 18 décimales pour uniformiser le staking et la distribution.
- Les assets natifs des vaults (6/8/18) sont abstraits par ERC‑4626 (`convertToAssets/convertToShares`).

### Consignes de sécurité & limites V1

- `EmissionController.setRewardsHub()` utilisable une seule fois.
- Admins devraient utiliser un timelock en prod.
- `pause()` sur Hub/Router coupe les actions utilisateurs (sauf `emergencyWithdraw`).
- Vérifier que le token de reward autorise le `mint` (rôle MINTER) ou précharger la réserve en mode drip.

### Tests recommandés

- Assets 6/8/18 décimales -> shares 18.
- Chemins heureux: deposit/withdraw/harvest/harvestAll.
- Pause/unpause, emergencyWithdraw.
- Controller en mint et drip, changement de `rewardPerSecond`.
