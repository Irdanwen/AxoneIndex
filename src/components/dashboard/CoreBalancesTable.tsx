import { Skeleton } from '@/components/ui'

interface CoreBalanceRow {
  token: string
  tokenId: string
  balance: string
}

interface CoreBalancesTableProps {
  balances: CoreBalanceRow[]
  isLoading?: boolean
}

export function CoreBalancesTable({ balances, isLoading }: CoreBalancesTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-muted)] bg-[var(--surface)]">
      <div className="max-h-72 overflow-y-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-[var(--surface)]">
            <tr className="border-b border-[var(--border-muted)] text-left text-xs uppercase tracking-wide text-[var(--text-secondary)]">
              <th className="px-5 py-3 font-semibold">Token</th>
              <th className="px-5 py-3 font-semibold">Token ID</th>
              <th className="px-5 py-3 text-right font-semibold">Balance</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <tr key={index} className="border-b border-[var(--border-muted)] last:border-0">
                    <td className="px-5 py-4">
                      <Skeleton className="h-5 w-20" />
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Skeleton className="ml-auto h-5 w-28" />
                    </td>
                  </tr>
                ))
              : balances.map((row) => (
                  <tr key={row.token} className="border-b border-[var(--border-muted)] last:border-0">
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-muted)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold uppercase text-[var(--text-secondary)]">
                        {row.token}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-sm text-[var(--text-secondary)]">{row.tokenId}</td>
                    <td className="px-5 py-4 text-right font-mono text-sm text-[var(--text-secondary)]">{row.balance}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

