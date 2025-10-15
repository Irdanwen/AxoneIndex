const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Vérification de la file d'attente des retraits...\n");

    // Adresses des contrats (HyperEVM Testnet)
    const VAULT_ADDRESS = "0x926b98ffd13a80ed0637b268c8f499cc7b782928";

    // Configuration pour HyperEVM Testnet
    const HYPER_EVM_RPC_URL = process.env.HL_TESTNET_RPC || "https://rpc.hyperliquid-testnet.xyz/evm";
    const provider = new ethers.JsonRpcProvider(HYPER_EVM_RPC_URL);
    
    // Récupération du contrat vault
    const vault = new ethers.Contract(VAULT_ADDRESS, [
        "function withdrawQueueLength() view returns (uint256)",
        "function withdrawQueue(uint256 index) view returns (address user, uint256 shares, uint16 feeBpsSnapshot, bool settled)",
        "function balanceOf(address account) view returns (uint256)",
        "function deposits(address account) view returns (uint256)",
        "function nav1e18() view returns (uint256)",
        "function pps1e18() view returns (uint256)",
        "function totalSupply() view returns (uint256)",
        "function withdrawFeeBps() view returns (uint16)",
        "function getWithdrawFeeBpsForAmount(uint256 amount1e8) view returns (uint16)"
    ], provider);

    // Vérifier la longueur de la file d'attente
    const queueLength = await vault.withdrawQueueLength();
    console.log(`📋 Longueur de la file d'attente: ${queueLength}`);

    if (queueLength > 0) {
        console.log("\n📝 Retraits en attente:");
        console.log("=======================");
        
        for (let i = 0; i < Number(queueLength); i++) {
            const request = await vault.withdrawQueue(i);
            console.log(`\n🔄 Retrait #${i}:`);
            console.log(`   Utilisateur: ${request.user}`);
            console.log(`   Parts: ${ethers.formatEther(request.shares)} c50USD`);
            console.log(`   Frais figés: ${Number(request.feeBpsSnapshot) / 100}%`);
            console.log(`   Statut: ${request.settled ? "Règlementé" : "En attente"}`);
            
            if (!request.settled) {
                // Calculer le montant dû
                const nav = await vault.nav1e18();
                const totalSupply = await vault.totalSupply();
                const pps = (nav * ethers.parseEther("1")) / totalSupply;
                const due1e18 = (request.shares * pps) / ethers.parseEther("1");
                const gross1e8 = due1e18 / ethers.parseUnits("1", 10);
                
                const fee1e8 = (Number(request.feeBpsSnapshot) > 0 && gross1e8 > 0)
                    ? (gross1e8 * Number(request.feeBpsSnapshot)) / 10000
                    : 0;
                const net1e8 = gross1e8 - fee1e8;
                
                console.log(`   Montant brut dû: ${ethers.formatUnits(gross1e8, 8)} USDC`);
                console.log(`   Frais: ${ethers.formatUnits(fee1e8, 8)} USDC`);
                console.log(`   Montant net dû: ${ethers.formatUnits(net1e8, 8)} USDC`);
            }
        }
    } else {
        console.log("✅ Aucun retrait en attente dans la file d'attente.");
    }

    // Vérifier les balances et dépôts
    console.log("\n💰 État du vault:");
    console.log("==================");
    
    const nav = await vault.nav1e18();
    const pps = await vault.pps1e18();
    const totalSupply = await vault.totalSupply();
    
    console.log(`📊 NAV: ${ethers.formatEther(nav)} USD`);
    console.log(`📈 PPS: ${ethers.formatEther(pps)} USD`);
    console.log(`🪙 Total Supply: ${ethers.formatEther(totalSupply)} c50USD`);
    
    // Vérifier les frais de retrait
    const withdrawFeeBps = await vault.withdrawFeeBps();
    console.log(`💸 Frais de retrait de base: ${Number(withdrawFeeBps) / 100}%`);
    
    // Test pour 50 USDC
    const feeFor50USDC = await vault.getWithdrawFeeBpsForAmount(ethers.parseUnits("50", 8));
    console.log(`💸 Frais pour 50 USDC: ${Number(feeFor50USDC) / 100}%`);

    console.log("\n✅ Vérification terminée!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Erreur:", error);
        process.exit(1);
    });
