const { ethers } = require("hardhat");

async function main() {
    console.log("🔄 Rapatriement des fonds depuis HyperCore...\n");

    // Configuration
    const VAULT_ADDRESS = "0x926b98ffd13a80ed0637b268c8f499cc7b782928";
    const HANDLER_ADDRESS = "0xDd9CA2Ace9b827A6cAf43c2ae63cF1aB62d87A84";
    
    // Récupération du provider et des signataires
    const [owner] = await ethers.getSigners();
    console.log(`👤 Compte connecté: ${owner.address}`);
    
    // Récupération des contrats
    const vault = new ethers.Contract(VAULT_ADDRESS, [
        "function recallFromCoreAndSweep(uint256 amount1e18) external",
        "function nav1e18() view returns (uint256)",
        "function usdc() view returns (address)",
        "function handler() view returns (address)",
        "function owner() view returns (address)"
    ], owner);
    
    const handler = new ethers.Contract(HANDLER_ADDRESS, [
        "function equitySpotUsd1e18() view returns (uint256)",
        "function spotBalance(address coreUser, uint64 tokenId) view returns (uint64)",
        "function usdcCoreTokenId() view returns (uint64)",
        "function spotTokenBTC() view returns (uint64)",
        "function spotTokenHYPE() view returns (uint64)",
        "function spotBTC() view returns (uint32)",
        "function spotHYPE() view returns (uint32)"
    ], owner);
    
    const usdc = new ethers.Contract(await vault.usdc(), [
        "function balanceOf(address account) view returns (uint256)",
        "function decimals() view returns (uint8)"
    ], owner);

    // Vérifications préliminaires
    console.log("🔍 Vérifications préliminaires:");
    console.log("===============================");
    
    const vaultOwner = await vault.owner();
    if (vaultOwner.toLowerCase() !== owner.address.toLowerCase()) {
        console.error(`❌ ERREUR: Vous n'êtes pas le propriétaire du vault!`);
        console.error(`   Propriétaire actuel: ${vaultOwner}`);
        console.error(`   Votre adresse: ${owner.address}`);
        return;
    }
    console.log(`✅ Vous êtes le propriétaire du vault`);
    
    // Vérifier l'équité sur Core
    try {
        const coreEquity = await handler.equitySpotUsd1e18();
        console.log(`💰 Équité sur HyperCore: ${ethers.formatEther(coreEquity)} USD`);
        
        if (coreEquity === 0n) {
            console.log("⚠️  Aucun fonds sur HyperCore à rapatrier");
            return;
        }
    } catch (error) {
        console.error(`❌ Erreur lors de la vérification de l'équité Core:`, error.message);
        return;
    }

    // Vérifier les balances individuelles sur Core
    try {
        const usdcCoreTokenId = await handler.usdcCoreTokenId();
        const spotTokenBTC = await handler.spotTokenBTC();
        const spotTokenHYPE = await handler.spotTokenHYPE();
        
        const usdcBalance = await handler.spotBalance(HANDLER_ADDRESS, usdcCoreTokenId);
        const btcBalance = await handler.spotBalance(HANDLER_ADDRESS, spotTokenBTC);
        const hypeBalance = await handler.spotBalance(HANDLER_ADDRESS, spotTokenHYPE);
        
        console.log(`\n💼 Balances sur HyperCore:`);
        console.log(`   USDC: ${ethers.formatUnits(usdcBalance, 8)} USDC`);
        console.log(`   BTC: ${btcBalance.toString()} BTC`);
        console.log(`   HYPE: ${hypeBalance.toString()} HYPE`);
        
        // Calculer le montant à rapatrier (équité totale en USDC)
        const equity1e8 = coreEquity / ethers.parseUnits("1", 10); // Conversion 1e18 -> 1e8
        
        console.log(`\n🎯 Montant recommandé à rapatrier: ${ethers.formatUnits(equity1e8, 8)} USDC`);
        
        // Demander confirmation
        console.log(`\n⚠️  ATTENTION: Cette opération va:`);
        console.log(`   1. Vendre les positions BTC et HYPE sur HyperCore`);
        console.log(`   2. Rapatrier les USDC vers le vault`);
        console.log(`   3. Appliquer les frais configurés du handler`);
        
        // Pour l'automatisation, on rapatrie tout l'équité
        const amountToRecall1e18 = equity1e8 * ethers.parseUnits("1", 10); // 1e8 -> 1e18
        
        console.log(`\n🚀 Lancement du rapatriement:`);
        console.log(`   - Montant (1e8): ${ethers.formatUnits(equity1e8, 8)} USDC`);
        console.log(`   - Montant (1e18): ${ethers.formatEther(amountToRecall1e18)} USDC`);
        
        // Exécuter le rapatriement (contrat exige un multiple de 1e10)
        const tx = await vault.recallFromCoreAndSweep(amountToRecall1e18);
        console.log(`📝 Transaction soumise: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmée dans le bloc ${receipt.blockNumber}`);
        console.log(`⛽ Gas utilisé: ${receipt.gasUsed.toString()}`);
        
        // Vérifier le nouvel état
        console.log(`\n📊 Nouvel état après rapatriement:`);
        const newVaultBalance = await usdc.balanceOf(VAULT_ADDRESS);
        console.log(`   USDC dans le vault: ${ethers.formatUnits(newVaultBalance, 8)} USDC`);
        
        const newCoreEquity = await handler.equitySpotUsd1e18();
        console.log(`   Équité sur HyperCore: ${ethers.formatEther(newCoreEquity)} USD`);
        
    } catch (error) {
        console.error(`❌ Erreur lors du rapatriement:`, error.message);
        if (error.message.includes("RateLimited")) {
            console.log(`💡 Suggestion: Attendez la fin de l'époque actuelle ou réduisez le montant`);
        }
    }

    console.log("\n✅ Script terminé!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Erreur:", error);
        process.exit(1);
    });
