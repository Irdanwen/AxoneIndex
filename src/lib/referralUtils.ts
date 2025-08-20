import { ethers } from 'ethers'

export const getCodeHash = (code: string) => 
  ethers.utils.keccak256(ethers.utils.toUtf8Bytes(code))

// Adresse du contrat ReferralRegistry sur Sepolia
export const REFERRAL_REGISTRY_ADDRESS = '0xE77b9AB620c90eeFC761Afd5C8e60F9913A3CA4f'

// Chain ID pour Sepolia
export const SEPOLIA_CHAIN_ID = 11155111

