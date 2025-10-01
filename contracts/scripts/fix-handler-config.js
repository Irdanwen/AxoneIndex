const { ethers } = require("hardhat");

async function main() {
    console.log("🔧 Correction de la configuration du Handler...\n");

    // Configuration pour HyperEVM Testnet
    const HYPER_EVM_RPC_URL = process.env.HL_TESTNET_RPC || "https://rpc.hyperliquid-testnet.xyz/evm";
    const provider = new ethers.JsonRpcProvider(HYPER_EVM_RPC_URL);
    
    // Adresses des contrats
    const VAULT_ADDRESS = "0x926b98ffd13a80ed0637b268c8f499cc7b782928";
    const HANDLER_ADDRESS = "0xDd9CA2Ace9b827A6cAf43c2ae63cF1aB62d87A84";
    
    // Configuration Core correcte pour HyperEVM Testnet
    const USDC_CORE_SYSTEM_ADDRESS = "0x2222222222222222222222222222222222222222";
    const USDC_CORE_TOKEN_ID = 1; // ID typique pour USDC sur testnet
    const SPOT_BTC_ID = 0; // ID du marché BTC/USDC
    const SPOT_HYPE_ID = 1; // ID du marché HYPE/USDC
    const SPOT_TOKEN_BTC = 0; // ID du token BTC
    const SPOT_TOKEN_HYPE = 2; // ID du token HYPE
    
    const handler = new ethers.Contract(HANDLER_ADDRESS, [
        "function usdcCoreSystemAddress() view returns (address)",
        "function usdcCoreTokenId() view returns (uint64)",
        "function spotBTC() view returns (uint32)",
        "function spotHYPE() view returns (uint32)",
        "function spotTokenBTC() view returns (uint64)",
        "function spotTokenHYPE() view returns (uint64)",
        "function setUsdcCoreLink(address systemAddr, uint64 tokenId) external",
        "function setSpotIds(uint32 btcSpot, uint32 hypeSpot) external",
        "function setSpotTokenIds(uint64 usdcToken, uint64 btcToken, uint64 hypeToken) external",
        "function owner() view returns (address)"
    ], provider);

    console.log("📊 Configuration actuelle:");
    console.log("==========================");
    
    try {
        const currentSystemAddr = await handler.usdcCoreSystemAddress();
        const currentTokenId = await handler.usdcCoreTokenId();
        const currentSpotBTC = await handler.spotBTC();
        const currentSpotHYPE = await handler.spotHYPE();
        const currentTokenBTC = await handler.spotTokenBTC();
        const currentTokenHYPE = await handler.spotTokenHYPE();
        const owner = await handler.owner();
        
        console.log(`🔗 USDC Core System: ${currentSystemAddr}`);
        console.log(`🪙 USDC Token ID: ${currentTokenId}`);
        console.log(`📊 Spot BTC ID: ${currentSpotBTC}`);
        console.log(`📊 Spot HYPE ID: ${currentSpotHYPE}`);
        console.log(`🪙 Token BTC ID: ${currentTokenBTC}`);
        console.log(`🪙 Token HYPE ID: ${currentTokenHYPE}`);
        console.log(`👤 Owner: ${owner}`);
        
        console.log("\n🎯 Configuration recommandée:");
        console.log("=============================");
        console.log(`🔗 USDC Core System: ${USDC_CORE_SYSTEM_ADDRESS}`);
        console.log(`🪙 USDC Token ID: ${USDC_CORE_TOKEN_ID}`);
        console.log(`📊 Spot BTC ID: ${SPOT_BTC_ID}`);
        console.log(`📊 Spot HYPE ID: ${SPOT_HYPE_ID}`);
        console.log(`🪙 Token BTC ID: ${SPOT_TOKEN_BTC}`);
        console.log(`🪙 Token HYPE ID: ${SPOT_TOKEN_HYPE}`);
        
        // Vérifier si la configuration est correcte
        const needsConfig = 
            currentSystemAddr.toLowerCase() !== USDC_CORE_SYSTEM_ADDRESS.toLowerCase() ||
            currentTokenId.toString() !== USDC_CORE_TOKEN_ID.toString() ||
            currentSpotBTC.toString() !== SPOT_BTC_ID.toString() ||
            currentSpotHYPE.toString() !== SPOT_HYPE_ID.toString();
            
        if (needsConfig) {
            console.log("\n⚠️  Configuration incorrecte détectée !");
            console.log("=====================================");
            console.log("Le handler n'est pas configuré pour communiquer avec HyperCore.");
            console.log("C'est pourquoi les balances Core sont à 0.");
            
            console.log("\n🔧 Commandes de configuration (à exécuter par le owner):");
            console.log("======================================================");
            console.log(`// 1. Configurer le lien USDC Core`);
            console.log(`await handler.setUsdcCoreLink("${USDC_CORE_SYSTEM_ADDRESS}", ${USDC_CORE_TOKEN_ID});`);
            console.log(`// 2. Configurer les IDs des marchés spot`);
            console.log(`await handler.setSpotIds(${SPOT_BTC_ID}, ${SPOT_HYPE_ID});`);
            console.log(`// 3. Configurer les IDs des tokens spot`);
            console.log(`await handler.setSpotTokenIds(${USDC_CORE_TOKEN_ID}, ${SPOT_TOKEN_BTC}, ${SPOT_TOKEN_HYPE});`);
            
            console.log("\n📝 Instructions:");
            console.log("================");
            console.log("1. Connectez-vous avec le wallet owner");
            console.log("2. Exécutez ces commandes dans une console Hardhat");
            console.log("3. Relancez le script de vérification");
            
        } else {
            console.log("\n✅ Configuration correcte !");
            console.log("Le problème vient peut-être d'ailleurs...");
        }
        
    } catch (error) {
        console.log("❌ Erreur lors de la vérification:", error.message);
    }
    
    console.log("\n🔍 Diagnostic supplémentaire:");
    console.log("=============================");
    console.log("Si la configuration est correcte mais les balances sont toujours à 0:");
    console.log("1. Vérifiez que les ordres d'achat BTC/HYPE ont été exécutés");
    console.log("2. Consultez l'historique des ordres sur HyperCore");
    console.log("3. Vérifiez les prix oracle et le slippage");
    console.log("4. Relancez un dépôt avec forceRebalance=true");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Erreur:", error);
        process.exit(1);
    });

