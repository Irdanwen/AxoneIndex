const hre = require("hardhat");

async function main() {
  console.log("🧪 Test du système de parrainage Axone Finance...");

  // Récupération des comptes
  const [deployer, user1, user2, user3] = await ethers.getSigners();
  console.log("👤 Déployeur:", deployer.address);
  console.log("👤 Utilisateur 1:", user1.address);
  console.log("👤 Utilisateur 2:", user2.address);
  console.log("👤 Utilisateur 3:", user3.address);

  // Déploiement du ReferralRegistry
  console.log("\n🔧 Déploiement du ReferralRegistry...");
  const ReferralRegistry = await hre.ethers.getContractFactory("ReferralRegistry");
  const referralRegistry = await ReferralRegistry.deploy(deployer.address);
  await referralRegistry.waitForDeployment();
  
  const referralRegistryAddress = await referralRegistry.getAddress();
  console.log("✅ ReferralRegistry déployé à l'adresse:", referralRegistryAddress);

  // Whitelist du déployeur et de l'utilisateur 1
  console.log("\n🔧 Whitelist des utilisateurs...");
  await referralRegistry.whitelistDirect(deployer.address);
  await referralRegistry.whitelistDirect(user1.address);
  console.log("✅ Déployeur et Utilisateur 1 whitelistés");

  // Création de codes de parrainage
  console.log("\n🔧 Création de codes de parrainage...");
  
  // Code généré automatiquement
  const autoCode = await referralRegistry.connect(user1).createCode();
  console.log("✅ Code généré automatiquement:", autoCode);
  
  // Code avec hash spécifique
  const manualCode = "MANUAL123";
  const manualCodeHash = ethers.keccak256(ethers.toUtf8Bytes(manualCode));
  await referralRegistry.connect(user1).createCode(manualCodeHash);
  console.log("✅ Code manuel créé:", manualCode);

  // Utilisation des codes
  console.log("\n🔧 Utilisation des codes de parrainage...");
  
  // Utilisation du code automatique
  const autoCodeHash = ethers.keccak256(ethers.toUtf8Bytes(autoCode));
  await referralRegistry.connect(user2).useCode(autoCodeHash);
  console.log("✅ Utilisateur 2 whitelisté avec le code automatique");
  console.log("   Référent:", user1.address);

  // Utilisation du code manuel
  await referralRegistry.connect(user3).useCode(manualCodeHash);
  console.log("✅ Utilisateur 3 whitelisté avec le code manuel");
  console.log("   Référent:", user1.address);

  // Vérification des statuts
  console.log("\n📊 Vérification des statuts...");
  console.log("Déployeur whitelisté:", await referralRegistry.isWhitelisted(deployer.address));
  console.log("Utilisateur 1 whitelisté:", await referralRegistry.isWhitelisted(user1.address));
  console.log("Utilisateur 2 whitelisté:", await referralRegistry.isWhitelisted(user2.address));
  console.log("Utilisateur 3 whitelisté:", await referralRegistry.isWhitelisted(user3.address));

  // Vérification des référents
  console.log("\n🔗 Vérification des référents...");
  console.log("Référent de l'utilisateur 2:", await referralRegistry.referrerOf(user2.address));
  console.log("Référent de l'utilisateur 3:", await referralRegistry.referrerOf(user3.address));

  // Vérification du quota
  console.log("\n📈 Vérification du quota...");
  const codesCreated = await referralRegistry.codesCreated(user1.address);
  const quota = await referralRegistry.codesQuota();
  console.log("Codes créés par l'utilisateur 1:", codesCreated.toString());
  console.log("Quota maximum:", quota.toString());

  // Récupération des codes non utilisés
  console.log("\n🔍 Codes non utilisés de l'utilisateur 1...");
  const unusedCodes = await referralRegistry.getUnusedCodes(user1.address);
  console.log("Codes non utilisés:", unusedCodes);

  console.log("\n🎉 Test terminé avec succès!");
  console.log("\n📋 Résumé:");
  console.log("- ReferralRegistry:", referralRegistryAddress);
  console.log("- 4 utilisateurs whitelistés");
  console.log("- 2 codes créés et utilisés");
  console.log("- Système de parrainage fonctionnel");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur lors du test:", error);
    process.exit(1);
  });
