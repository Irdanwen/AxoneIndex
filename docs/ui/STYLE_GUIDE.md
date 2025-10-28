## Charte Graphique Axone

Ce guide décrit la charte graphique, les classes utilitaires et les conventions UI du projet Axone Finance.

### Couleurs principales

- Sandy Brown `#fab062` — couleur d'accent principal
- Flounce `#4a8c8c` — couleur secondaire
- Stellar Green `#011f26` — couleur de fond sombre

### Couleurs fonctionnelles

- Succès `#3CD88C`
- Alerte `#FFB020`
- Erreur `#FF5C5C`
- Info `#4D9FFF`

### Typographie

- Titres (H1/H2/H3): Inter Bold avec léger tracking négatif (≈ −0.5px)
- Texte: Inter Regular/Medium
- Boutons CTA: uppercase, SemiBold

### Style UI

- Effet glassmorphism: `rgba(255,255,255,0.05)` + `blur(20px)`
- Boutons CTA: gradient violet/bleu, arrondi XL, glow au hover
- Footer: fond noir nuit, texte gris clair
- Background: dégradés de Sandy Brown à Stellar Green + formes géométriques animées

### Animations (classes utilitaires)

```css
.animate-fade-in
.animate-fade-in-up
.animate-scale-in
.animate-float
.animate-pulse-glow
.animate-gradient-shift
.animate-shimmer
```

### Classes utilitaires (couleurs/effets)

```css
/* Couleurs */
.text-axone-accent      /* Sandy Brown */
.text-axone-flounce     /* Flounce */
.text-axone-dark        /* Stellar Green */
.bg-gradient-primary    /* Dégradé principal */
.bg-gradient-secondary  /* Dégradé secondaire */

/* Effets */
.glass-card             /* Effet glassmorphism */
.glass-card-strong      /* Glassmorphism plus prononcé */
.shadow-glow            /* Ombre avec glow */
.shadow-glow-flounce    /* Glow flounce */
```

### Composants réutilisables (exemples)

```tsx
<Button variant="primary" size="lg">Launch App</Button>
<AnimatedCounter value="125K+" duration={2} />
<div className="glass-card p-8 rounded-3xl">Contenu</div>
```

### Responsive design

- Mobile First, breakpoints: `sm`, `md`, `lg`, `xl`, `2xl`
- Navigation: menu hamburger mobile
- Grilles: adaptatives selon la taille d’écran

### Conventions et préférences UI

- Espacement vertical: remplacer `space-y-*` par des marges explicites `mt-*`/`mb-*` au niveau des enfants, ou utiliser l’utilitaire `[&>*+*]:mt-*` pour appliquer un rythme vertical cohérent par conteneur.
- Couleurs et surfaces: utiliser `bg-axone-dark`, les classes `axone-accent`/`axone-flounce` et les surfaces `GlassCard` (`glass-cosmic[-*]`).
- Boutons: standardiser sur `GlowButton` (aussi exporté comme `Button`) avec variantes `primary`, `secondary`, `outline`, `destructive`.
- Conteneur: utiliser `container-custom` et un `max-w-7xl` selon les pages.
- Transactions: entourer `writeContract` d’un `try...catch` et afficher des toasts en cas d’échec (rejet, fonds insuffisants, réseau incorrect).
- Réseau: vérifier `useChainId()` et avertir l’utilisateur si le chainId ≠ 998 (HyperEVM Testnet).
- Conversions décimales: prix oracles en 1e8 (USD 1e8). `usd1e18 = (hype1e18 * px1e8) / 1e8`, `hype1e18 = (usd1e18 * 1e8) / px1e8`.
- Éviter la surcharge d’animations; préférer des transitions subtiles et performantes.
- Respecter la lisibilité: contrastes suffisants, tailles et interlignages cohérents.

### Personnalisation

- Couleurs et design: éditer `tailwind.config.ts`
- Ajouter/étendre des animations: via Tailwind CSS v4 et utilitaires locaux
- Contenus: éditer les composants dans `src/components` et les sections dans `src/app`


