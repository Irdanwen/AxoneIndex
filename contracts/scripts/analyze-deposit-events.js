const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Analyse des événements de dépôt...\n");

    // Hash de votre transaction
    const TX_HASH = "0xc7f20cf4fa8baf84c36708e91846af31e5138bec59d90f4ceae0ff96c79d8545";
    
    // Adresses des contrats
    const VAULT_ADDRESS = "0x926b98ffd13a80ed0637b268c8f499cc7b782928";
    const HANDLER_ADDRESS = "0xd9cbec81df392a88aeff575e962d149d57f4d6bc";
    const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    
    // Configuration pour Base Mainnet
    const BASE_RPC_URL = "https://mainnet.base.org";
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    
    try {
        // Récupérer la transaction
        const tx = await provider.getTransaction(TX_HASH);
        const receipt = await provider.getTransactionReceipt(TX_HASH);
        
        console.log("📋 Détails de la transaction:");
        console.log("============================");
        console.log(`Hash: ${TX_HASH}`);
        console.log(`Block: ${receipt.blockNumber}`);
        console.log(`Gas utilisé: ${receipt.gasUsed.toString()}`);
        console.log(`Status: ${receipt.status === 1 ? "✅ Succès" : "❌ Échec"}`);
        
        console.log("\n📊 Événements décodés:");
        console.log("======================");
        
        // Interface pour décoder les événements
        const vaultInterface = new ethers.utils.Interface([
            "event Deposit(address indexed user, uint256 amount1e8, uint256 sharesMinted)",
            "event NavUpdated(uint256 nav1e18)",
            "event Transfer(address indexed from, address indexed to, uint256 value)"
        ]);
        
        const usdcInterface = new ethers.utils.Interface([
            "event Transfer(address indexed from, address indexed to, uint256 value)"
        ]);
        
        // Analyser chaque log
        for (let i = 0; i < receipt.logs.length; i++) {
            const log = receipt.logs[i];
            console.log(`\n📝 Log ${i}:`);
            console.log(`   Adresse: ${log.address}`);
            console.log(`   Topics: ${log.topics.length}`);
            
            try {
                // Essayer de décoder avec l'interface du vault
                if (log.address.toLowerCase() === VAULT_ADDRESS.toLowerCase()) {
                    const decoded = vaultInterface.parseLog(log);
                    console.log(`   Événement: ${decoded.name}`);
                    
                    if (decoded.name === "Deposit") {
                        console.log(`   👤 Utilisateur: ${decoded.args.user}`);
                        console.log(`   💰 Montant déposé: ${ethers.utils.formatUnits(decoded.args.amount1e8, 8)} USDC`);
                        console.log(`   🪙 Parts créées: ${ethers.utils.formatEther(decoded.args.sharesMinted)} c50USD`);
                    } else if (decoded.name === "NavUpdated") {
                        console.log(`   📈 NAV mis à jour: ${ethers.utils.formatEther(decoded.args.nav1e18)} USD`);
                    } else if (decoded.name === "Transfer") {
                        console.log(`   🔄 Transfert: ${decoded.args.from} → ${decoded.args.to}`);
                        console.log(`   💵 Montant: ${ethers.utils.formatEther(decoded.args.value)} tokens`);
                    }
                }
                // Essayer de décoder avec l'interface USDC
                else if (log.address.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
                    const decoded = usdcInterface.parseLog(log);
                    console.log(`   Événement: ${decoded.name}`);
                    console.log(`   🔄 Transfert: ${decoded.args.from} → ${decoded.args.to}`);
                    console.log(`   💵 Montant: ${ethers.utils.formatUnits(decoded.args.value, 6)} USDC`);
                }
                // Logs du handler ou autres
                else {
                    console.log(`   📦 Log non décodé (probablement Core/HyperCore)`);
                    console.log(`   Data: ${log.data.substring(0, 50)}...`);
                }
                
            } catch (error) {
                console.log(`   ⚠️  Impossible de décoder ce log`);
            }
        }
        
        console.log("\n🔍 Analyse des données brutes:");
        console.log("=============================");
        
        // Analyser les données spécifiques des logs Core
        const coreLogs = receipt.logs.filter(log => 
            log.address === "0x3333333333333333333333333333333333333333" ||
            log.address === "0xdd9ca2ace9b827a6caf43c2ae63cf1ab62d87a84"
        );
        
        console.log(`📊 ${coreLogs.length} logs Core/HyperCore détectés`);
        
        for (let i = 0; i < coreLogs.length; i++) {
            const log = coreLogs[i];
            console.log(`\n🌐 Log Core ${i + 1}:`);
            console.log(`   Adresse: ${log.address}`);
            console.log(`   Topics[0]: ${log.topics[0]}`);
            
            // Essayer d'extraire des informations des données
            if (log.data.length > 2) {
                const data = log.data.substring(2); // Enlever 0x
                console.log(`   Data length: ${data.length} chars`);
                
                // Essayer de décoder comme des uint256
                try {
                    const chunks = data.match(/.{64}/g);
                    if (chunks && chunks.length > 0) {
                        console.log(`   Première valeur: ${ethers.BigNumber.from("0x" + chunks[0]).toString()}`);
                        if (chunks.length > 1) {
                            console.log(`   Deuxième valeur: ${ethers.BigNumber.from("0x" + chunks[1]).toString()}`);
                        }
                    }
                } catch (error) {
                    console.log(`   ⚠️  Impossible de décoder les données`);
                }
            }
        }
        
    } catch (error) {
        console.error("❌ Erreur lors de l'analyse:", error.message);
    }
    
    console.log("\n✅ Analyse terminée!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Erreur:", error);
        process.exit(1);
    });
