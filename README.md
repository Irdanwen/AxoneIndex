# Axone Finance - Landing Page

Une landing page moderne et élégante pour Axone Finance, plateforme DeFi d'investissement par indices crypto.

## 🚀 Technologies utilisées

- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS utilitaire
- **Framer Motion** - Animations fluides
- **Lucide React** - Icônes modernes

## 🎨 Design System

### Palette de couleurs
- **Couleur principale** : Sandy Brown `#fab062`
- **Couleur secondaire** : Stellar Green `#011f26`
- **Textes** : Blanc avec différentes opacités (90%, 75%, 60%)

### Typographie
- **Police principale** : Inter (sans-serif moderne)
- **Hiérarchie** : H1 (4xl-6xl), H2 (3xl-4xl), H3 (xl-2xl)

### Composants réutilisables
- `Button` - Boutons avec variantes primaire/secondaire
- `GlassCard` - Cartes avec effet de verre
- `SectionTitle` - Titres de section avec animations
- `AnimatedCounter` - Compteurs animés
- `Stat` - Affichage de statistiques

## 📁 Structure du projet

```
src/
├── app/
│   ├── globals.css          # Styles globaux et design system
│   ├── layout.tsx           # Layout principal
│   └── page.tsx             # Page d'accueil
├── components/
│   ├── ui/                  # Composants réutilisables
│   │   ├── Button.tsx
│   │   ├── GlassCard.tsx
│   │   ├── AnimatedCounter.tsx
│   │   ├── Stat.tsx
│   │   └── SectionTitle.tsx
│   ├── layout/              # Composants de mise en page
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── sections/            # Sections de la landing page
│       ├── Hero.tsx
│       ├── About.tsx
│       ├── HowItWorks.tsx
│       └── TrustBar.tsx
```

## 🛠️ Installation et développement

1. **Cloner le projet**
   ```bash
   git clone [url-du-repo]
   cd axone-finance
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

4. **Ouvrir dans le navigateur**
   ```
   http://localhost:3000
   ```

## 📱 Fonctionnalités

### Sections principales
- **Hero** - Message principal avec CTA
- **À propos** - Mission et valeurs d'Axone
- **Comment ça marche** - Processus en 3 étapes
- **TrustBar** - Partenaires et crédibilité
- **Footer** - Liens et informations

### Animations
- Animations d'entrée au scroll
- Micro-interactions sur les boutons
- Effets de hover sur les cartes
- Compteurs animés pour les statistiques

### Responsive
- Design mobile-first
- Navigation adaptative
- Grilles flexibles
- Typographie responsive

## 🎯 Optimisations

- **Performance** : Images optimisées, lazy loading
- **SEO** : Métadonnées complètes, structure sémantique
- **Accessibilité** : Contrastes vérifiés, focus states
- **UX** : Navigation fluide, feedback visuel

## 🚀 Déploiement

Le projet est prêt pour le déploiement sur :
- Vercel (recommandé)
- Netlify
- AWS Amplify
- Tout autre plateforme supportant Next.js

## 📝 Scripts disponibles

- `npm run dev` - Serveur de développement
- `npm run build` - Build de production
- `npm run start` - Serveur de production
- `npm run lint` - Vérification ESLint

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Contact

Axone Finance - [contact@axone.finance](mailto:contact@axone.finance)

---

**Axone Finance** - The smart way to diversify 🚀
