#!/usr/bin/env node

/**
 * Script d'investigation des décimales des prix oracle Hyperliquid.
 * 
 * Vérifie si spotPx renvoie déjà du 1e8 (normalisé) ou des pxDecimals variables
 * par actif (BTC=1e3, HYPE=1e6 typiquement).
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
    'function oraclePxBtc1e8() view returns (uint64)',
    'function oraclePxHype1e8() view returns (uint64)',
    'function spotOraclePx1e8(uint32 spotAsset) view returns (uint64)',
    'function l1read() view returns (address)',
    'function usdcCoreTokenId() view returns (uint64)',
    'function spotTokenBTC() view returns (uint64)',
    'function spotTokenHYPE() view returns (uint64)'
  ]

  const l1readAbi = [
    'function spotPx(uint32 index) view returns (uint64)',
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

  console.log('🔍 Investigation des décimales des prix oracle Hyperliquid')
  console.log('RPC        :', rpcUrl)
  console.log('Handler    :', handlerAddress)
  console.log('L1Read     :', l1readAddress)
  console.log('Token IDs  :', tokenIds)
  console.log('')

  // Lire les prix via les getters du handler (qui supposent 1e8)
  const handlerPxBtc = await handler.oraclePxBtc1e8()
  const handlerPxHype = await handler.oraclePxHype1e8()

  console.log('📊 Prix via handler (supposés 1e8):')
  console.log(`  BTC  : ${ethers.utils.formatUnits(handlerPxBtc, 8)} USD`)
  console.log(`  HYPE : ${ethers.utils.formatUnits(handlerPxHype, 8)} USD`)
  console.log('')

  // Lire les prix bruts via L1Read
  const rawPxBtc = await l1read.spotPx(tokenIds.btc)
  const rawPxHype = await l1read.spotPx(tokenIds.hype)

  console.log('📊 Prix bruts via L1Read.spotPx():')
  console.log(`  BTC  : ${rawPxBtc.toString()} (raw uint64)`)
  console.log(`  HYPE : ${rawPxHype.toString()} (raw uint64)`)
  console.log('')

  // Vérifier si les prix bruts sont identiques aux prix du handler
  const btcIdentical = handlerPxBtc.eq(rawPxBtc)
  const hypeIdentical = handlerPxHype.eq(rawPxHype)

  console.log('🔍 Comparaison handler vs L1Read brut:')
  console.log(`  BTC  identique : ${btcIdentical}`)
  console.log(`  HYPE identique : ${hypeIdentical}`)
  console.log('')

  if (btcIdentical && hypeIdentical) {
    console.log('✅ Le handler renvoie exactement les valeurs brutes de L1Read.spotPx()')
    console.log('')
    
    // Analyser les valeurs brutes pour déterminer l'échelle
    console.log('🧮 Analyse des échelles possibles:')
    
    // BTC - valeurs typiques ~45,000 USD
    console.log('BTC (prix attendu ~45,000 USD):')
    console.log(`  Raw value: ${rawPxBtc.toString()}`)
    console.log(`  Si 1e8   : ${ethers.utils.formatUnits(rawPxBtc, 8)} USD`)
    console.log(`  Si 1e3   : ${ethers.utils.formatUnits(rawPxBtc, 3)} USD`)
    console.log(`  Si 1e6   : ${ethers.utils.formatUnits(rawPxBtc, 6)} USD`)
    console.log('')
    
    // HYPE - valeurs typiques ~50 USD
    console.log('HYPE (prix attendu ~50 USD):')
    console.log(`  Raw value: ${rawPxHype.toString()}`)
    console.log(`  Si 1e8   : ${ethers.utils.formatUnits(rawPxHype, 8)} USD`)
    console.log(`  Si 1e3   : ${ethers.utils.formatUnits(rawPxHype, 3)} USD`)
    console.log(`  Si 1e6   : ${ethers.utils.formatUnits(rawPxHype, 6)} USD`)
    console.log('')
    
    // Déterminer l'échelle la plus probable
    const btcPrice1e3 = parseFloat(ethers.utils.formatUnits(rawPxBtc, 3))
    const btcPrice1e6 = parseFloat(ethers.utils.formatUnits(rawPxBtc, 6))
    const btcPrice1e8 = parseFloat(ethers.utils.formatUnits(rawPxBtc, 8))
    
    const hypePrice1e3 = parseFloat(ethers.utils.formatUnits(rawPxHype, 3))
    const hypePrice1e6 = parseFloat(ethers.utils.formatUnits(rawPxHype, 6))
    const hypePrice1e8 = parseFloat(ethers.utils.formatUnits(rawPxHype, 8))
    
    console.log('🎯 Échelles les plus probables:')
    
    // BTC: chercher une valeur autour de 45,000
    if (btcPrice1e3 > 10000 && btcPrice1e3 < 100000) {
      console.log(`  BTC : 1e3 (${btcPrice1e3.toFixed(2)} USD) ✅`)
    } else if (btcPrice1e6 > 10000 && btcPrice1e6 < 100000) {
      console.log(`  BTC : 1e6 (${btcPrice1e6.toFixed(2)} USD) ✅`)
    } else if (btcPrice1e8 > 10000 && btcPrice1e8 < 100000) {
      console.log(`  BTC : 1e8 (${btcPrice1e8.toFixed(2)} USD) ✅`)
    } else {
      console.log(`  BTC : échelle indéterminée (${btcPrice1e3}/${btcPrice1e6}/${btcPrice1e8})`)
    }
    
    // HYPE: chercher une valeur autour de 50
    if (hypePrice1e3 > 10 && hypePrice1e3 < 200) {
      console.log(`  HYPE: 1e3 (${hypePrice1e3.toFixed(2)} USD) ✅`)
    } else if (hypePrice1e6 > 10 && hypePrice1e6 < 200) {
      console.log(`  HYPE: 1e6 (${hypePrice1e6.toFixed(2)} USD) ✅`)
    } else if (hypePrice1e8 > 10 && hypePrice1e8 < 200) {
      console.log(`  HYPE: 1e8 (${hypePrice1e8.toFixed(2)} USD) ✅`)
    } else {
      console.log(`  HYPE: échelle indéterminée (${hypePrice1e3}/${hypePrice1e6}/${hypePrice1e8})`)
    }
    
    console.log('')
    console.log('📋 CONCLUSION:')
    console.log('  - Les smart contracts supposent 1e8 mais spotPx() renvoie probablement des échelles variables')
    console.log('  - Le front-end doit être corrigé pour utiliser les bonnes échelles')
    console.log('  - Les smart contracts doivent aussi être corrigés pour normaliser à 1e8')
    
  } else {
    console.log('❌ Le handler transforme les prix bruts de L1Read.spotPx()')
    console.log('  - Le handler applique déjà une normalisation')
    console.log('  - Seul le front-end nécessite probablement une correction')
  }

  // Vérifier si L1Read expose pxDecimals
  console.log('')
  console.log('🔍 Vérification de l\'exposition pxDecimals dans L1Read:')
  try {
    const btcInfo = await l1read.tokenInfo(tokenIds.btc)
    const hypeInfo = await l1read.tokenInfo(tokenIds.hype)
    
    console.log('TokenInfo exposé:')
    console.log(`  BTC  : szDecimals=${btcInfo.szDecimals}, weiDecimals=${btcInfo.weiDecimals}`)
    console.log(`  HYPE : szDecimals=${hypeInfo.szDecimals}, weiDecimals=${hypeInfo.weiDecimals}`)
    
    // Note: pxDecimals n'est pas dans TokenInfo selon l'interface actuelle
    console.log('  ⚠️  pxDecimals n\'est pas exposé dans TokenInfo')
    
  } catch (error) {
    console.log(`  ❌ Erreur lors de la lecture TokenInfo: ${error.message}`)
  }
}

main().catch((err) => {
  const serverError = err?.error?.serverError || err?.serverError
  if (err?.code === 'NETWORK_ERROR' || serverError?.code === 'ENETUNREACH') {
    console.error('⚠️  Impossible de contacter le RPC HyperEVM. Vérifiez HL_RPC_URL ou votre connexion réseau.')
  } else {
    console.error('❌ Erreur pendant l\'investigation:', err)
  }
  process.exit(1)
})
