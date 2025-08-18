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
