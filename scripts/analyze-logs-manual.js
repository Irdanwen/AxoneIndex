const { ethers } = require("ethers");

// Vos logs de transaction
const logs = [
  {
    "address": "0xd9cbec81df392a88aeff575e962d149d57f4d6bc",
    "topics": [
      "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
      "0x0000000000000000000000001ee9c37e28d2db4d8c35a94bb05c3f189191d506",
      "0x000000000000000000000000926b98ffd13a80ed0637b268c8f499cc7b782928"
    ],
    "data": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "blockHash": "0xcbfe02098c3813a52807563312491347234fd2780d26d8b3609a58ae0a9f160c",
    "blockNumber": "0x1ff6e3f",
    "transactionHash": "0xc7f20cf4fa8baf84c36708e91846af31e5138bec59d90f4ceae0ff96c79d8545",
    "transactionIndex": "0x0",
    "logIndex": "0x0",
    "removed": false
  },
  {
    "address": "0xd9cbec81df392a88aeff575e962d149d57f4d6bc",
    "topics": [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x0000000000000000000000001ee9c37e28d2db4d8c35a94bb05c3f189191d506",
      "0x000000000000000000000000926b98ffd13a80ed0637b268c8f499cc7b782928"
    ],
    "data": "0x000000000000000000000000000000000000000000000000000000012a05f200",
    "blockHash": "0xcbfe02098c3813a52807563312491347234fd2780d26d8b3609a58ae0a9f160c",
    "blockNumber": "0x1ff6e3f",
    "transactionHash": "0xc7f20cf4fa8baf84c36708e91846af31e5138bec59d90f4ceae0ff96c79d8545",
    "transactionIndex": "0x0",
    "logIndex": "0x1",
    "removed": false
  },
  {
    "address": "0x926b98ffd13a80ed0637b268c8f499cc7b782928",
    "topics": [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      "0x0000000000000000000000001ee9c37e28d2db4d8c35a94bb05c3f189191d506"
    ],
    "data": "0x000000000000000000000000000000000000000000000002aef353bcddd60000",
    "blockHash": "0xcbfe02098c3813a52807563312491347234fd2780d26d8b3609a58ae0a9f160c",
    "blockNumber": "0x1ff6e3f",
    "transactionHash": "0xc7f20cf4fa8baf84c36708e91846af31e5138bec59d90f4ceae0ff96c79d8545",
    "transactionIndex": "0x0",
    "logIndex": "0x2",
    "removed": false
  },
  {
    "address": "0x926b98ffd13a80ed0637b268c8f499cc7b782928",
    "topics": [
      "0x90890809c654f11d6e72a28fa60149770a0d11ec6c92319d6ceb2bb0a4ea1a15",
      "0x0000000000000000000000001ee9c37e28d2db4d8c35a94bb05c3f189191d506"
    ],
    "data": "0x000000000000000000000000000000000000000000000000000000012a05f200000000000000000000000000000000000000000000000002aef353bcddd60000",
    "blockHash": "0xcbfe02098c3813a52807563312491347234fd2780d26d8b3609a58ae0a9f160c",
    "blockNumber": "0x1ff6e3f",
    "transactionHash": "0xc7f20cf4fa8baf84c36708e91846af31e5138bec59d90f4ceae0ff96c79d8545",
    "transactionIndex": "0x0",
    "logIndex": "0x3",
    "removed": false
  },
  {
    "address": "0xd9cbec81df392a88aeff575e962d149d57f4d6bc",
    "topics": [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x000000000000000000000000926b98ffd13a80ed0637b268c8f499cc7b782928",
      "0x000000000000000000000000dd9ca2ace9b827a6caf43c2ae63cf1ab62d87a84"
    ],
    "data": "0x000000000000000000000000000000000000000000000000000000010c388d00",
    "blockHash": "0xcbfe02098c3813a52807563312491347234fd2780d26d8b3609a58ae0a9f160c",
    "blockNumber": "0x1ff6e3f",
    "transactionHash": "0xc7f20cf4fa8baf84c36708e91846af31e5138bec59d90f4ceae0ff96c79d8545",
    "transactionIndex": "0x0",
    "logIndex": "0x4",
    "removed": false
  },
  {
    "address": "0xd9cbec81df392a88aeff575e962d149d57f4d6bc",
    "topics": [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x000000000000000000000000dd9ca2ace9b827a6caf43c2ae63cf1ab62d87a84",
      "0x0000000000000000000000002000000000000000000000000000000000000000"
    ],
    "data": "0x000000000000000000000000000000000000000000000000000000010c388d00",
    "blockHash": "0xcbfe02098c3813a52807563312491347234fd2780d26d8b3609a58ae0a9f160c",
    "blockNumber": "0x1ff6e3f",
    "transactionHash": "0xc7f20cf4fa8baf84c36708e91846af31e5138bec59d90f4ceae0ff96c79d8545",
    "transactionIndex": "0x0",
    "logIndex": "0x5",
    "removed": false
  },
  {
    "address": "0x3333333333333333333333333333333333333333",
    "topics": [
      "0x8c7f585fb295f7eb1e6aeb8fba61b23a4fe60beda405f0045073b185c74412e3",
      "0x000000000000000000000000dd9ca2ace9b827a6caf43c2ae63cf1ab62d87a84"
    ],
    "data": "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000e20101000000000000000000000000000000000000000000000000000000000000046900000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000024d740000000000000000000000000000000000000000000000000000000000003a98000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "blockHash": "0xcbfe02098c3813a52807563312491347234fd2780d26d8b3609a58ae0a9f160c",
    "blockNumber": "0x1ff6e3f",
    "transactionHash": "0xc7f20cf4fa8baf84c36708e91846af31e5138bec59d90f4ceae0ff96c79d8545",
    "transactionIndex": "0x0",
    "logIndex": "0x6",
    "removed": false
  },
  {
    "address": "0xdd9ca2ace9b827a6caf43c2ae63cf1ab62d87a84",
    "topics": [
      "0xcd2ec76f8998c98a46bc055c1175960f987f713067aa10eef80f3c26cfcd4292"
    ],
    "data": "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000e20101000000000000000000000000000000000000000000000000000000000000046900000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000024d740000000000000000000000000000000000000000000000000000000000003a98000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "blockHash": "0xcbfe02098c3813a52807563312491347234fd2780d26d8b3609a58ae0a9f160c",
    "blockNumber": "0x1ff6e3f",
    "transactionHash": "0xc7f20cf4fa8baf84c36708e91846af31e5138bec59d90f4ceae0ff96c79d8545",
    "transactionIndex": "0x0",
    "logIndex": "0x7",
    "removed": false
  },
  {
    "address": "0x3333333333333333333333333333333333333333",
    "topics": [
      "0x8c7f585fb295f7eb1e6aeb8fba61b23a4fe60beda405f0045073b185c74412e3",
      "0x000000000000000000000000dd9ca2ace9b827a6caf43c2ae63cf1ab62d87a84"
    ],
    "data": "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000e2010100000000000000000000000000000000000000000000000000000000000004510000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000022e00000000000000000000000000000000000000000000000000000000003ddc26000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "blockHash": "0xcbfe02098c3813a52807563312491347234fd2780d26d8b3609a58ae0a9f160c",
    "blockNumber": "0x1ff6e3f",
    "transactionHash": "0xc7f20cf4fa8baf84c36708e91846af31e5138bec59d90f4ceae0ff96c79d8545",
    "transactionIndex": "0x0",
    "logIndex": "0x8",
    "removed": false
  },
  {
    "address": "0xdd9ca2ace9b827a6caf43c2ae63cf1ab62d87a84",
    "topics": [
      "0xcd2ec76f8998c98a46bc055c1175960f987f713067aa10eef80f3c26cfcd4292"
    ],
    "data": "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000e2010100000000000000000000000000000000000000000000000000000000000004510000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000022e00000000000000000000000000000000000000000000000000000000003ddc26000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "blockHash": "0xcbfe02098c3813a52807563312491347234fd2780d26d8b3609a58ae0a9f160c",
    "blockNumber": "0x1ff6e3f",
    "transactionHash": "0xc7f20cf4fa8baf84c36708e91846af31e5138bec59d90f4ceae0ff96c79d8545",
    "transactionIndex": "0x0",
    "logIndex": "0x9",
    "removed": false
  },
  {
    "address": "0xdd9ca2ace9b827a6caf43c2ae63cf1ab62d87a84",
    "topics": [
      "0xe6b7d21138117399ef04d4d7904eabd626c683f9f007b1266adff7ad19e0cbca"
    ],
    "data": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "blockHash": "0xcbfe02098c3813a52807563312491347234fd2780d26d8b3609a58ae0a9f160c",
    "blockNumber": "0x1ff6e3f",
    "transactionHash": "0xc7f20cf4fa8baf84c36708e91846af31e5138bec59d90f4ceae0ff96c79d8545",
    "transactionIndex": "0x0",
    "logIndex": "0xa",
    "removed": false
  },
  {
    "address": "0x926b98ffd13a80ed0637b268c8f499cc7b782928",
    "topics": [
      "0x982b6e7cd3d3e82b3475c5978950c101b7a51b8b682ff81906dde028919b7872"
    ],
    "data": "0x0000000000000000000000000000000000000000000000004563918244f40000",
    "blockHash": "0xcbfe02098c3813a52807563312491347234fd2780d26d8b3609a58ae0a9f160c",
    "blockNumber": "0x1ff6e3f",
    "transactionHash": "0xc7f20cf4fa8baf84c36708e91846af31e5138bec59d90f4ceae0ff96c79d8545",
    "transactionIndex": "0x0",
    "logIndex": "0xb",
    "removed": false
  }
];

function analyzeLogs() {
    console.log("🔍 Analyse détaillée des logs de transaction\n");
    console.log("=" .repeat(60));
    
    // Adresses importantes
    const VAULT_ADDRESS = "0x926b98ffd13a80ed0637b268c8f499cc7b782928";
    const HANDLER_ADDRESS = "0xd9cbec81df392a88aeff575e962d149d57f4d6bc";
    const USDC_ADDRESS = "0xd9cbec81df392a88aeff575e962d149d57f4d6bc"; // Même que handler
    const USER_ADDRESS = "0x1ee9c37e28d2db4d8c35a94bb05c3f189191d506";
    const CORE_SYSTEM = "0x3333333333333333333333333333333333333333";
    const CORE_HANDLER = "0xdd9ca2ace9b827a6caf43c2ae63cf1ab62d87a84";
    
    // Signatures d'événements
    const TRANSFER_SIG = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    const APPROVAL_SIG = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";
    const DEPOSIT_SIG = "0x90890809c654f11d6e72a28fa60149770a0d11ec6c92319d6ceb2bb0a4ea1a15";
    const NAV_UPDATED_SIG = "0x982b6e7cd3d3e82b3475c5978950c101b7a51b8b682ff81906dde028919b7872";
    
    console.log("📊 Résumé de l'opération:");
    console.log("-".repeat(40));
    
    let totalDeposited = 0;
    let totalShares = 0;
    let coreInteractions = 0;
    
    logs.forEach((log, index) => {
        console.log(`\n📝 Log ${index}:`);
        console.log(`   Adresse: ${log.address}`);
        console.log(`   Topics[0]: ${log.topics[0]}`);
        
        // Décoder les adresses des topics
        if (log.topics.length > 1) {
            const from = "0x" + log.topics[1].slice(26);
            console.log(`   De: ${from}`);
            if (log.topics.length > 2) {
                const to = "0x" + log.topics[2].slice(26);
                console.log(`   Vers: ${to}`);
            }
        }
        
        // Analyser le type d'événement
        if (log.topics[0] === APPROVAL_SIG) {
            console.log("   🔐 Événement: Approval (autorisation)");
            const amount = ethers.BigNumber.from(log.data);
            console.log(`   💰 Montant autorisé: ${amount.toString()}`);
        }
        else if (log.topics[0] === TRANSFER_SIG) {
            console.log("   🔄 Événement: Transfer");
            const amount = ethers.BigNumber.from(log.data);
            
            if (log.address.toLowerCase() === VAULT_ADDRESS.toLowerCase()) {
                console.log("   📦 Type: Transfer de parts du vault (c50USD)");
                if (log.topics[1] === "0x0000000000000000000000000000000000000000000000000000000000000000") {
                    console.log("   ✅ Mint de nouvelles parts");
                    totalShares = amount;
                }
            } else {
                console.log("   💵 Type: Transfer USDC");
                totalDeposited = amount;
            }
            console.log(`   💰 Montant: ${ethers.utils.formatUnits(amount, log.address.toLowerCase() === VAULT_ADDRESS.toLowerCase() ? 18 : 6)}`);
        }
        else if (log.topics[0] === DEPOSIT_SIG) {
            console.log("   💎 Événement: Deposit (dépôt dans le vault)");
            // Décoder les données: amount1e8, sharesMinted
            const amount1e8 = ethers.BigNumber.from("0x" + log.data.slice(2, 66));
            const sharesMinted = ethers.BigNumber.from("0x" + log.data.slice(66, 130));
            console.log(`   💰 Montant déposé: ${ethers.utils.formatUnits(amount1e8, 8)} USDC`);
            console.log(`   🪙 Parts créées: ${ethers.utils.formatEther(sharesMinted)} c50USD`);
        }
        else if (log.topics[0] === NAV_UPDATED_SIG) {
            console.log("   📈 Événement: NavUpdated (mise à jour NAV)");
            const nav = ethers.BigNumber.from(log.data);
            console.log(`   💎 NAV: ${ethers.utils.formatEther(nav)} USD`);
        }
        else if (log.address === CORE_SYSTEM || log.address === CORE_HANDLER) {
            console.log("   🌐 Événement: Interaction HyperCore");
            coreInteractions++;
            
            // Essayer de décoder les données Core
            if (log.data.length > 2) {
                const data = log.data.substring(2);
                const chunks = data.match(/.{64}/g);
                if (chunks && chunks.length > 0) {
                    console.log(`   📊 Données Core détectées (${chunks.length} chunks)`);
                    // Les premières valeurs peuvent contenir des informations sur les ordres
                    if (chunks.length >= 3) {
                        const val1 = ethers.BigNumber.from("0x" + chunks[0]).toString();
                        const val2 = ethers.BigNumber.from("0x" + chunks[1]).toString();
                        const val3 = ethers.BigNumber.from("0x" + chunks[2]).toString();
                        console.log(`   🔢 Valeurs: ${val1}, ${val2}, ${val3}`);
                    }
                }
            }
        }
        else {
            console.log("   ❓ Événement: Non identifié");
        }
    });
    
    console.log("\n" + "=".repeat(60));
    console.log("📋 RÉSUMÉ FINAL:");
    console.log("=".repeat(60));
    
    console.log(`✅ Dépôt réussi: ${ethers.utils.formatUnits(totalDeposited, 6)} USDC`);
    console.log(`✅ Parts créées: ${ethers.utils.formatEther(totalShares)} c50USD`);
    console.log(`✅ Interactions Core: ${coreInteractions} événements`);
    
    console.log("\n🔍 Vérifications à effectuer:");
    console.log("1. Connectez-vous à l'interface HyperCore");
    console.log("2. Vérifiez les balances spot de l'adresse du handler");
    console.log("3. Consultez l'historique des ordres");
    console.log("4. Vérifiez que les USDC ont été échangés contre BTC/HYPE");
    
    console.log("\n📞 Adresses importantes:");
    console.log(`Vault: ${VAULT_ADDRESS}`);
    console.log(`Handler: ${HANDLER_ADDRESS}`);
    console.log(`Utilisateur: ${USER_ADDRESS}`);
    console.log(`Core System: ${CORE_SYSTEM}`);
    console.log(`Core Handler: ${CORE_HANDLER}`);
}

// Exécuter l'analyse
analyzeLogs();
