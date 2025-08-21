// Export de l'ancien composant Button (avec majuscule) pour la compatibilité
export { default as Button } from './Button'

// Export du nouveau composant button (avec minuscule) pour les nouveaux composants
export { Button as ModernButton } from './button'
export { ButtonProps } from './button'
export { buttonVariants } from './button'

// Autres exports
export { Input } from './input'
export { Label } from './label'
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
export { Checkbox } from './checkbox'
export { RiskBadge } from './RiskBadge'
export { StatusIndicator } from './StatusIndicator'
export { TokenIcon } from './TokenIcon'
