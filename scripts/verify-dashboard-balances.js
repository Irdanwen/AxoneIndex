#!/usr/bin/env node

/**
 * Script de vérification des soldes Core utilisés par le dashboard.
 *
 * Compare les valeurs retournées par `handler.spotBalance` avec les décimales
 * récupérées via `tokenInfo(uint32)` pour valider le formatage effectué côté UI.
 *
 * Variables d'environnement supportées :
 *  - HL_RPC_URL / HL_TESTNET_RPC : URL RPC HyperEVM (optionnel)
 *  - HANDLER_ADDRESS : adresse du CoreInteractionHandler (requis)
 *  - L1READ_ADDRESS : adresse du contrat L1Read (optionnel, récupérée via handler.l1read())
 *  - CORE_TOKEN_ID_USDC / CORE_TOKEN_ID_HYPE / CORE_TOKEN_ID_BTC : override optionnels
 */

const { ethers } = require('ethers')

async function main() {
  const rpcUrl = process.env.HL_RPC_URL || process.env.HL_TESTNET_RPC || 'https://rpc.hyperliquid-testnet.xyz/evm'
  const chainIdEnv = process.env.HYPERCHAIN_ID || process.env.CHAIN_ID
  const chainId = chainIdEnv ? Number(chainIdEnv) : 998
  const handlerAddress = process.env.HANDLER_ADDRESS

  if (!handlerAddress) {
    console.error('❌ HANDLER_ADDRESS manquante. Définissez HANDLER_ADDRESS dans les variables d\'environnement.')
    process.exit(1)
  }

  const provider = new ethers.providers.StaticJsonRpcProvider(
    rpcUrl,
    {
      chainId: Number.isFinite(chainId) ? chainId : 998,
      name: 'hyperliquid-testnet'
    }
  )

  const handlerAbi = [
    'function spotBalance(address coreUser, uint64 tokenId) view returns (uint64)',
    'function l1read() view returns (address)',
    'function usdcCoreTokenId() view returns (uint64)',
    'function spotTokenBTC() view returns (uint64)',
    'function spotTokenHYPE() view returns (uint64)'
  ]

  const l1readAbi = [
    'function tokenInfo(uint32 token) view returns (string name, uint64[] spots, uint64 deployerTradingFeeShare, address deployer, address evmContract, uint8 szDecimals, uint8 weiDecimals, int8 evmExtraWeiDecimals)'
  ]

  const handler = new ethers.Contract(handlerAddress, handlerAbi, provider)

  const l1readAddress = process.env.L1READ_ADDRESS || (await handler.l1read())
  const l1read = new ethers.Contract(l1readAddress, l1readAbi, provider)

  const tokenIdOverrides = {
    usdc: process.env.CORE_TOKEN_ID_USDC,
    hype: process.env.CORE_TOKEN_ID_HYPE,
    btc: process.env.CORE_TOKEN_ID_BTC,
  }

  const resolveTokenId = async (label, overrideValue, fallbackPromise) => {
    if (overrideValue !== undefined) {
      const parsed = Number(overrideValue)
      if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error(`Valeur invalide pour ${label}: ${overrideValue}`)
      }
      return parsed
    }

    const result = await fallbackPromise
    return Number(result)
  }

  const tokenIds = {
    usdc: await resolveTokenId('CORE_TOKEN_ID_USDC', tokenIdOverrides.usdc, handler.usdcCoreTokenId()),
    hype: await resolveTokenId('CORE_TOKEN_ID_HYPE', tokenIdOverrides.hype, handler.spotTokenHYPE()),
    btc: await resolveTokenId('CORE_TOKEN_ID_BTC', tokenIdOverrides.btc, handler.spotTokenBTC()),
  }

  const tokens = [
    { key: 'usdc', label: 'USDC' },
    { key: 'hype', label: 'HYPE' },
    { key: 'btc', label: 'BTC' },
  ]

  console.log('🔍 Vérification des soldes Core du dashboard')
  console.log('RPC        :', rpcUrl)
  console.log('Handler    :', handlerAddress)
  console.log('L1Read     :', l1readAddress)
  console.log('Token IDs  :', tokenIds)
  console.log('')

  const pow10 = (exp) => ethers.BigNumber.from(10).pow(exp)

  for (const token of tokens) {
    const tokenId = tokenIds[token.key]
    if (tokenId === undefined || Number.isNaN(tokenId)) {
      console.log(`⚠️  Token ${token.label}: ID introuvable, saut.`)
      continue
    }

    const rawBalance = await handler.spotBalance(handlerAddress, tokenId)
    const info = await l1read.tokenInfo(tokenId)
    const szDecimals = Number(info.szDecimals ?? info[5])
    const weiDecimals = Number(info.weiDecimals ?? info[6])

    const diff = weiDecimals - szDecimals
    let normalized = rawBalance
    if (diff > 0) {
      normalized = rawBalance.mul(pow10(diff))
    } else if (diff < 0) {
      normalized = rawBalance.div(pow10(Math.abs(diff)))
    }

    const formatted = ethers.utils.formatUnits(normalized, weiDecimals)

    console.log(`Token ${token.label} (#${tokenId})`)
    console.log(`  spotBalance (raw)     : ${ethers.utils.formatUnits(rawBalance, szDecimals)} (szDecimals=${szDecimals})`)
    console.log(`  tokenInfo decimals    : sz=${szDecimals}, wei=${weiDecimals}, diff=${diff}`)
    console.log(`  Balance normalisée    : ${normalized.toString()} (wei decimals)`)
    console.log(`  Affichage dashboard   : ${formatted}`)
    console.log('')
  }
}

main().catch((err) => {
  const serverError = err?.error?.serverError || err?.serverError
  if (err?.code === 'NETWORK_ERROR' || serverError?.code === 'ENETUNREACH') {
    console.error('⚠️  Impossible de contacter le RPC HyperEVM. Vérifiez HL_RPC_URL ou votre connexion réseau.')
  } else {
    console.error('❌ Erreur pendant la vérification:', err)
  }
  process.exit(1)
})
