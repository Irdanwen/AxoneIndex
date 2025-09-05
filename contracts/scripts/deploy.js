const hre = require("hardhat");

async function main() {
  console.log("🚀 Déploiement des smart contracts Axone Finance...");

  // Récupération du compte déployeur
  const [deployer] = await ethers.getSigners();
  console.log("📝 Déploiement avec le compte:", deployer.address);
  console.log("💰 Balance du compte:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Déploiement du ReferralRegistry
  console.log("\n🔧 Déploiement du ReferralRegistry...");
  const ReferralRegistry = await hre.ethers.getContractFactory("ReferralRegistry");
  const referralRegistry = await ReferralRegistry.deploy(deployer.address);
  await referralRegistry.waitForDeployment();
  
  const referralRegistryAddress = await referralRegistry.getAddress();
  console.log("✅ ReferralRegistry déployé à l'adresse:", referralRegistryAddress);

  // Whitelist du déployeur pour les tests
  console.log("\n🔧 Whitelist du déployeur...");
  await referralRegistry.whitelistDirect(deployer.address);
  console.log("✅ Déployeur whitelisté");

  // Déploiement du token Axone (si le contrat existe)
  try {
    console.log("\n🔧 Déploiement du AxoneToken...");
    const AxoneToken = await hre.ethers.getContractFactory("AxoneToken");
    const axoneToken = await AxoneToken.deploy(deployer.address, deployer.address, deployer.address);
    await axoneToken.waitForDeployment();
    
    const axoneTokenAddress = await axoneToken.getAddress();
    console.log("✅ AxoneToken déployé à l'adresse:", axoneTokenAddress);

    // Vérification du déploiement
    const totalSupply = await axoneToken.totalSupply();
    console.log("📊 Supply total:", ethers.formatEther(totalSupply), "AXN");

    console.log("\n🎉 Déploiement terminé avec succès!");
    console.log("\n📋 Adresses des contrats:");
    console.log("ReferralRegistry:", referralRegistryAddress);
    console.log("AxoneToken:", axoneTokenAddress);
  } catch (error) {
    console.log("⚠️ AxoneToken non trouvé, déploiement du ReferralRegistry uniquement");
    console.log("\n🎉 Déploiement terminé avec succès!");
    console.log("\n📋 Adresses des contrats:");
    console.log("ReferralRegistry:", referralRegistryAddress);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur lors du déploiement:", error);
    process.exit(1);
  });
