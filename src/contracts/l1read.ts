import { type Address } from 'viem'
import { l1readAbi } from '@/lib/abi/l1read'

export const l1readContract = (address: Address) => ({
  address,
  abi: l1readAbi,
} as const)

export type L1ReadContract = ReturnType<typeof l1readContract>