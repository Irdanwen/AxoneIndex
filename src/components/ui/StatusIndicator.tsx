import { cn } from '@/lib/utils'

interface StatusIndicatorProps {
  status: 'open' | 'closed' | 'paused'
  className?: string
}

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  const styles = {
    open: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    closed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
  }

  const labels = {
    open: 'Ouvert',
    closed: 'Fermé',
    paused: 'En pause'
  }

  return (
    <span className={cn(
      "px-2 py-1 rounded-full text-xs font-medium",
      styles[status],
      className
    )}>
      {labels[status]}
    </span>
  )
}
