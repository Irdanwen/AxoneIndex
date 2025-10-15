import { type Address } from 'viem'
import { erc20Abi } from '@/lib/abi/erc20'

export const erc20Contract = (address: Address) => ({
  address,
  abi: erc20Abi,
} as const)

export type Erc20Contract = ReturnType<typeof erc20Contract>