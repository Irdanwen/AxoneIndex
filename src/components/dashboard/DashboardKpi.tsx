import { ReactNode } from 'react'

import { Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils'

interface DashboardKpiProps {
  label: string
  value: ReactNode
  variation?: ReactNode
  isLoading?: boolean
  className?: string
}

export function DashboardKpi({
  label,
  value,
  variation,
  isLoading,
  className,
}: DashboardKpiProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--border-muted)] bg-[var(--surface)] p-5 shadow-sm transition-colors',
        className,
      )}
    >
      <div className="text-sm font-medium text-[var(--text-secondary)]">{label}</div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <div className="min-h-[2rem] text-2xl font-semibold text-[var(--text-secondary)]">
          {isLoading ? <Skeleton className="h-8 w-28" /> : value}
        </div>
        {variation && !isLoading ? (
          <span className="rounded-full border border-[var(--border-muted)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
            {variation}
          </span>
        ) : null}
      </div>
    </div>
  )
}

