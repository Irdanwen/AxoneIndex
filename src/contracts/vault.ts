import { type Address } from 'viem'
import { vaultContractAbi } from '@/lib/abi/VaultContract'

export const vaultContract = (address: Address) => ({
  address,
  abi: vaultContractAbi,
} as const)

export type VaultContract = ReturnType<typeof vaultContract>