# Résumé - Bouton de Basculement de Thème

## Fonctionnalité ajoutée
✅ Bouton de basculement mode sombre/clair dans le header

## Composants créés/modifiés

### 1. ThemeToggle (`src/components/ui/ThemeToggle.tsx`)
- Icônes dynamiques : 🌙/☀️
- Animation de rotation
- Persistance localStorage
- Accessibilité (aria-label)

### 2. ThemeProvider (`src/components/providers/ThemeProvider.tsx`)
- Initialisation automatique
- Détection préférences système
- Écoute des changements

### 3. Header (`src/components/layout/Header.tsx`)
- Intégration du ThemeToggle
- Styles adaptatifs

### 4. Layout (`src/app/layout.tsx`)
- Intégration du ThemeProvider

### 5. CSS (`src/app/globals.css`)
- Variables CSS clair/sombre
- Overrides `.dark`

### 6. Tailwind (`tailwind.config.ts`)
- `darkMode: 'class'`

## Utilisation
- Icône 🌙 en mode clair → clic pour sombre
- Icône ☀️ en mode sombre → clic pour clair

## Variables CSS
- `--color-axone-light`, `--color-axone-dark`, etc.
