import { ethers } from 'ethers'

export const getCodeHash = (code: string) => 
  ethers.utils.keccak256(ethers.utils.toUtf8Bytes(code))

// Adresse du contrat ReferralRegistry sur HyperEVM Testnet
export const REFERRAL_REGISTRY_ADDRESS = '0xd9145CCE52D386f254917e481eB44e9943F39138'

// Chain ID pour HyperEVM Testnet
export const HYPEREVM_CHAIN_ID = 998

