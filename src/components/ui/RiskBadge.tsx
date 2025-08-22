import { cn } from '@/lib/utils'

interface RiskBadgeProps {
  risk: 'low' | 'medium' | 'high'
  className?: string
}

export function RiskBadge({ risk, className }: RiskBadgeProps) {
  const styles = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }

  const labels = {
    low: 'Bas',
    medium: 'Moyen',
    high: 'Élevé'
  }

  return (
    <span className={cn(
      "px-2 py-1 rounded-full text-xs font-medium",
      styles[risk],
      className
    )}>
      {labels[risk]}
    </span>
  )
}
