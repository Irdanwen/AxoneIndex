import { type Address } from 'viem'
import { vaultContractAbiExtended } from '@/lib/abi/VaultContract'

export const vaultContract = (address: Address) => ({
  address,
  abi: vaultContractAbiExtended,
} as const)

export type VaultContract = ReturnType<typeof vaultContract>