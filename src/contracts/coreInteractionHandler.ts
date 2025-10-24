import { type Address } from 'viem'
import { coreInteractionHandlerAbi } from '@/lib/abi/coreInteractionHandler'

export const coreInteractionHandlerContract = (address: Address) => ({
  address,
  abi: coreInteractionHandlerAbi,
} as const)

export type CoreInteractionHandlerContract = ReturnType<typeof coreInteractionHandlerContract>