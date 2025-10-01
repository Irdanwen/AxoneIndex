const { ethers } = require("ethers");

async function main() {
    console.log("🔍 Vérification des balances HyperCore Testnet...\n");

    // Configuration pour HyperEVM Testnet
    const HYPER_EVM_RPC_URL = "https://rpc.hyperliquid-testnet.xyz/evm";
    
    // Adresses des contrats sur HyperEVM Testnet
    const VAULT_ADDRESS = "0x926b98ffd13a80ed0637b268c8f499cc7b782928";
    const HANDLER_ADDRESS = "0xd9cbec81df392a88aeff575e962d149d57f4d6bc";
    const USDC_ADDRESS = "0xd9cbec81df392a88aeff575e962d149d57f4d6bc"; // Même que handler sur testnet
    
    const provider = new ethers.providers.JsonRpcProvider(HYPER_EVM_RPC_URL);
    
    // ABI simplifié pour les contrats
    const vaultABI = [
        "function nav1e18() view returns (uint256)",
        "function pps1e18() view returns (uint256)",
        "function totalSupply() view returns (uint256)",
        "function autoDeployBps() view returns (uint16)",
        "function depositFeeBps() view returns (uint16)",
        "function withdrawFeeBps() view returns (uint16)",
        "function balanceOf(address account) view returns (uint256)"
    ];
    
    const handlerABI = [
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
    ];
    
    const usdcABI = [
        "function balanceOf(address account) view returns (uint256)"
    ];
    
    // Récupération des contrats
    const vault = new ethers.Contract(VAULT_ADDRESS, vaultABI, provider);
    const handler = new ethers.Contract(HANDLER_ADDRESS, handlerABI, provider);
    const usdc = new ethers.Contract(USDC_ADDRESS, usdcABI, provider);

    console.log("📊 État du Vault sur HyperEVM Testnet:");
    console.log("=====================================");
    
    try {
        // 1. Vérifier la NAV (Net Asset Value) du vault
        const nav = await vault.nav1e18();
        const pps = await vault.pps1e18();
        const totalSupply = await vault.totalSupply();
        
        console.log(`💰 NAV: ${ethers.utils.formatEther(nav)} USD`);
        console.log(`📈 Prix par part (PPS): ${ethers.utils.formatEther(pps)} USD`);
        console.log(`🪙 Total Supply: ${ethers.utils.formatEther(totalSupply)} c50USD`);
        
        // 2. Vérifier les balances USDC du vault
        const vaultUsdcBalance = await usdc.balanceOf(VAULT_ADDRESS);
        console.log(`💵 USDC dans le vault: ${ethers.utils.formatUnits(vaultUsdcBalance, 6)} USDC`);
        
        // 3. Vérifier les balances USDC du handler
        const handlerUsdcBalance = await usdc.balanceOf(HANDLER_ADDRESS);
        console.log(`🔄 USDC dans le handler: ${ethers.utils.formatUnits(handlerUsdcBalance, 6)} USDC`);

        console.log("\n🌐 État sur HyperCore Testnet:");
        console.log("=============================");
        
        // 4. Vérifier l'équité spot sur Core
        const coreEquity = await handler.equitySpotUsd1e18();
        console.log(`💎 Équité Core: ${ethers.utils.formatEther(coreEquity)} USD`);
        
        // 5. Vérifier la configuration Core
        const usdcCoreSystemAddress = await handler.usdcCoreSystemAddress();
        const usdcCoreTokenId = await handler.usdcCoreTokenId();
        const spotTokenBTC = await handler.spotTokenBTC();
        const spotTokenHYPE = await handler.spotTokenHYPE();
        
        console.log(`\n🔍 Configuration Core:`);
        console.log(`   USDC Core System: ${usdcCoreSystemAddress}`);
        console.log(`   USDC Token ID: ${usdcCoreTokenId}`);
        console.log(`   BTC Token ID: ${spotTokenBTC}`);
        console.log(`   HYPE Token ID: ${spotTokenHYPE}`);
        
        // 6. Vérifier les balances spot sur Core
        const usdcBalance = await handler.spotBalance(HANDLER_ADDRESS, usdcCoreTokenId);
        const btcBalance = await handler.spotBalance(HANDLER_ADDRESS, spotTokenBTC);
        const hypeBalance = await handler.spotBalance(HANDLER_ADDRESS, spotTokenHYPE);
        
        console.log(`\n💼 Balances sur HyperCore Testnet:`);
        console.log(`   USDC: ${ethers.utils.formatUnits(usdcBalance, 8)} USDC`);
        console.log(`   BTC: ${btcBalance.toString()} BTC`);
        console.log(`   HYPE: ${hypeBalance.toString()} HYPE`);
        
        // 7. Vérifier les prix oracle
        const spotBTC = await handler.spotBTC();
        const spotHYPE = await handler.spotHYPE();
        
        try {
            const btcPrice = await handler.spotOraclePx1e8(spotBTC);
            const hypePrice = await handler.spotOraclePx1e8(spotHYPE);
            
            console.log(`\n📊 Prix Oracle sur HyperCore:`);
            console.log(`   BTC: $${ethers.utils.formatUnits(btcPrice, 8)}`);
            console.log(`   HYPE: $${ethers.utils.formatUnits(hypePrice, 8)}`);
            
            // 8. Calculer la valeur des positions
            const btcValue = btcBalance * btcPrice / BigInt(10**8);
            const hypeValue = hypeBalance * hypePrice / BigInt(10**8);
            
            console.log(`\n💎 Valeur des positions:`);
            console.log(`   BTC: $${ethers.utils.formatUnits(btcValue, 8)}`);
            console.log(`   HYPE: $${ethers.utils.formatUnits(hypeValue, 8)}`);
            console.log(`   Total: $${ethers.utils.formatUnits(btcValue + hypeValue, 8)}`);
            
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
        
        console.log(`📈 Auto-deploy: ${autoDeployBps / 100}%`);
        console.log(`💸 Frais de dépôt: ${depositFeeBps / 100}%`);
        console.log(`💸 Frais de retrait: ${withdrawFeeBps / 100}%`);
        
        const maxOutboundPerEpoch = await handler.maxOutboundPerEpoch();
        const epochLength = await handler.epochLength();
        const sentThisEpoch = await handler.sentThisEpoch();
        
        console.log(`\n⚡ Limites de taux:`);
        console.log(`   Max par époque: ${ethers.utils.formatUnits(maxOutboundPerEpoch, 8)} USDC`);
        console.log(`   Longueur époque: ${epochLength} blocs`);
        console.log(`   Envoyé cette époque: ${ethers.utils.formatUnits(sentThisEpoch, 8)} USDC`);
        
    } catch (error) {
        console.log("⚠️  Impossible de récupérer la configuration:", error.message);
    }

    console.log("\n🔗 Liens utiles pour HyperCore Testnet:");
    console.log("=====================================");
    console.log("🌐 Interface HyperCore: https://app.hyperliquid-testnet.xyz/");
    console.log("📊 Explorer HyperEVM: https://explorer.hyperliquid-testnet.xyz/");
    console.log("📋 Documentation: https://hyperliquid.gitbook.io/");
    
    console.log("\n✅ Vérification terminée!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Erreur:", error);
        process.exit(1);
    });
