'use client'

import { WagmiProvider as WagmiProviderBase } from 'wagmi'
import { config } from '@/lib/wagmi'

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProviderBase config={config}>
      {children}
    </WagmiProviderBase>
  )
}
