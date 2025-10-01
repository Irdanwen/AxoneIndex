const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Vérification des balances HyperCore...\n");

    // Adresses des contrats (HyperEVM Testnet)
    const VAULT_ADDRESS = "0x926b98ffd13a80ed0637b268c8f499cc7b782928";

    // Configuration pour HyperEVM Testnet
    const HYPER_EVM_RPC_URL = process.env.HL_TESTNET_RPC || "https://rpc.hyperliquid-testnet.xyz/evm";
    const provider = new ethers.JsonRpcProvider(HYPER_EVM_RPC_URL);
    
    // Récupération des contrats
    const vault = new ethers.Contract(VAULT_ADDRESS, [
        "function nav1e18() view returns (uint256)",
        "function pps1e18() view returns (uint256)",
        "function totalSupply() view returns (uint256)",
        "function autoDeployBps() view returns (uint16)",
        "function depositFeeBps() view returns (uint16)",
        "function withdrawFeeBps() view returns (uint16)",
        "function handler() view returns (address)",
        "function usdc() view returns (address)"
    ], provider);
    
    // Découvrir dynamiquement les adresses réelles et forcer le handler fourni par l'utilisateur
    const handlerAddressFromVault = await vault.handler();
    const usdcAddressFromVault = await vault.usdc();
    const HANDLER_ADDRESS = "0xDd9CA2Ace9b827A6cAf43c2ae63cF1aB62d87A84"; // override demandé
    const USDC_ADDRESS = usdcAddressFromVault;

    if (handlerAddressFromVault.toLowerCase() !== HANDLER_ADDRESS.toLowerCase()) {
        console.log(`ℹ️  Handler (vault): ${handlerAddressFromVault} -> override: ${HANDLER_ADDRESS}`);
    }

    const handler = new ethers.Contract(HANDLER_ADDRESS, [
        "function equitySpotUsd1e18() view returns (uint256)",
        "function spotBalance(address coreUser, uint64 tokenId) view returns (uint64)",
        "function spotOraclePx1e8(uint32 spotAsset) view returns (uint64)",
        "function usdcCoreTokenId() view returns (uint64)",
        "function spotTokenBTC() view returns (uint64)",
        "function spotTokenHYPE() view returns (uint64)",
        "function spotBTC() view returns (uint32)",
        "function spotHYPE() view returns (uint32)",
        "function maxOutboundPerEpoch() view returns (uint64)",
        "function epochLength() view returns (uint64)",
        "function sentThisEpoch() view returns (uint64)",
        "function usdcCoreSystemAddress() view returns (address)"
    ], provider);
    
    const usdc = new ethers.Contract(USDC_ADDRESS, [
        "function balanceOf(address account) view returns (uint256)"
    ], provider);

    // HyperEVM / HyperCore: tous les tokens (dont USDC) ont 8 décimales
    const usdcDecimals = 8;

    console.log("📊 État du Vault:");
    console.log("==================");
    
    // 1. Vérifier la NAV (Net Asset Value) du vault
    const nav = await vault.nav1e18();
    const pps = await vault.pps1e18();
    const totalSupply = await vault.totalSupply();
    
    console.log(`💰 NAV: ${ethers.formatEther(nav)} USD`);
    console.log(`📈 Prix par part (PPS): ${ethers.formatEther(pps)} USD`);
    console.log(`🪙 Total Supply: ${ethers.formatEther(totalSupply)} c50USD`);
    
    // 2. Vérifier les balances USDC du vault
    const vaultUsdcBalance = await usdc.balanceOf(VAULT_ADDRESS);
    console.log(`💵 USDC dans le vault: ${ethers.formatUnits(vaultUsdcBalance, usdcDecimals)} USDC`);
    
    // 3. Vérifier les balances USDC du handler
    const handlerUsdcBalance = await usdc.balanceOf(HANDLER_ADDRESS);
    console.log(`🔄 USDC dans le handler: ${ethers.formatUnits(handlerUsdcBalance, usdcDecimals)} USDC`);

    console.log("\n🌐 État sur HyperCore:");
    console.log("=====================");
    
    try {
        // 4. Vérifier l'équité spot sur Core
        const coreEquity = await handler.equitySpotUsd1e18();
        console.log(`💎 Équité Core: ${ethers.formatEther(coreEquity)} USD`);
        
        // 5. Vérifier les balances individuelles sur Core
        const usdcCoreSystemAddress = await handler.usdcCoreSystemAddress();
        const usdcCoreTokenId = await handler.usdcCoreTokenId();
        const spotTokenBTC = await handler.spotTokenBTC();
        const spotTokenHYPE = await handler.spotTokenHYPE();
        
        console.log(`\n🔍 Token IDs configurés:`);
        console.log(`   USDC Core System: ${usdcCoreSystemAddress}`);
        console.log(`   USDC Token ID: ${usdcCoreTokenId}`);
        console.log(`   BTC Token ID: ${spotTokenBTC}`);
        console.log(`   HYPE Token ID: ${spotTokenHYPE}`);
        
        // 6. Vérifier les balances spot sur Core
        const usdcBalance = await handler.spotBalance(HANDLER_ADDRESS, usdcCoreTokenId);
        const btcBalance = await handler.spotBalance(HANDLER_ADDRESS, spotTokenBTC);
        const hypeBalance = await handler.spotBalance(HANDLER_ADDRESS, spotTokenHYPE);
        
        console.log(`\n💼 Balances sur HyperCore:`);
        console.log(`   USDC: ${ethers.formatUnits(usdcBalance, 8)} USDC`);
        console.log(`   BTC: ${btcBalance.toString()} BTC`);
        console.log(`   HYPE: ${hypeBalance.toString()} HYPE`);
        
        // 7. Vérifier les prix oracle
        const spotBTC = await handler.spotBTC();
        const spotHYPE = await handler.spotHYPE();
        
        try {
            const btcPrice = await handler.spotOraclePx1e8(spotBTC);
            const hypePrice = await handler.spotOraclePx1e8(spotHYPE);
            
            console.log(`\n📊 Prix Oracle:`);
            console.log(`   BTC: $${ethers.formatUnits(btcPrice, 8)}`);
            console.log(`   HYPE: $${ethers.formatUnits(hypePrice, 8)}`);
            
            // 8. Calculer la valeur des positions
            const btcValue = (btcBalance * btcPrice) / (10n ** 8n);
            const hypeValue = (hypeBalance * hypePrice) / (10n ** 8n);
            
            console.log(`\n💎 Valeur des positions:`);
            console.log(`   BTC: $${ethers.formatUnits(btcValue, 8)}`);
            console.log(`   HYPE: $${ethers.formatUnits(hypeValue, 8)}`);
            console.log(`   Total: $${ethers.formatUnits(btcValue + hypeValue, 8)}`);
            
        } catch (error) {
            console.log("⚠️  Impossible de récupérer les prix oracle:", error.message);
        }
        
    } catch (error) {
        console.log("❌ Erreur lors de la vérification Core:", error.message);
    }

    console.log("\n🔧 Configuration du Handler:");
    console.log("============================");
    
    try {
        const autoDeployBps = await vault.autoDeployBps();
        const depositFeeBps = await vault.depositFeeBps();
        const withdrawFeeBps = await vault.withdrawFeeBps();
        
        console.log(`📈 Auto-deploy: ${Number(autoDeployBps) / 100}%`);
        console.log(`💸 Frais de dépôt: ${Number(depositFeeBps) / 100}%`);
        console.log(`💸 Frais de retrait: ${Number(withdrawFeeBps) / 100}%`);
        
        const maxOutboundPerEpoch = await handler.maxOutboundPerEpoch();
        const epochLength = await handler.epochLength();
        const sentThisEpoch = await handler.sentThisEpoch();
        
        console.log(`\n⚡ Limites de taux:`);
        console.log(`   Max par époque: ${ethers.formatUnits(maxOutboundPerEpoch, 8)} USDC`);
        console.log(`   Longueur époque: ${epochLength} blocs`);
        console.log(`   Envoyé cette époque: ${ethers.formatUnits(sentThisEpoch, 8)} USDC`);
        
    } catch (error) {
        console.log("⚠️  Impossible de récupérer la configuration:", error.message);
    }

    console.log("\n✅ Vérification terminée!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Erreur:", error);
        process.exit(1);
    });
