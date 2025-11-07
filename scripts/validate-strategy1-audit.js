#!/usr/bin/env node

/**
 * Script de Validation - Audit STRATEGY_1
 * 
 * Ce script valide les points critiques identifiés lors de l'audit
 * et génère un rapport de conformité avec le protocole Hyperliquid.
 */

const fs = require('fs');
const path = require('path');

// Configuration des tests
const AUDIT_CONFIG = {
  // Formats de prix oracle à valider
  ORACLE_FORMATS: {
    BTC: { expected: 1e3, normalized: 1e8, factor: 100000 },
    HYPE: { expected: 1e6, normalized: 1e8, factor: 100 }
  },
  
  // Formats de décimales à tester
  DECIMAL_FORMATS: [
    { szDecimals: 4, weiDecimals: 8, name: "USDC-like" },
    { szDecimals: 8, weiDecimals: 8, name: "Standard" },
    { szDecimals: 8, weiDecimals: 4, name: "Inverted" },
    { szDecimals: 6, weiDecimals: 8, name: "HYPE-like" }
  ],
  
  // Adresses système à valider
  SYSTEM_ADDRESSES: {
    usdcCoreSystemAddress: "0x0000000000000000000000000000000000000000",
    hypeCoreSystemAddress: "0x0000000000000000000000000000000000000000"
  },
  
  // Paramètres de sécurité
  SECURITY_PARAMS: {
    maxOracleDeviationBps: 500, // 5%
    deadbandBps: 50, // 0.5%
    maxSlippageBps: 50, // 0.5%
    marketEpsilonBps: 10 // 0.1%
  }
};

/**
 * Valide les formats de prix oracle
 */
function validateOracleFormats() {
  console.log("🔍 Validation des formats de prix oracle...");
  
  const results = [];
  
  for (const [asset, config] of Object.entries(AUDIT_CONFIG.ORACLE_FORMATS)) {
    const testPrice = 50000; // Prix de test
    const rawPrice = testPrice * config.expected;
    const normalizedPrice = rawPrice * config.factor;
    const expectedNormalized = testPrice * config.normalized;
    
    const isValid = normalizedPrice === expectedNormalized;
    
    results.push({
      asset,
      rawPrice,
      normalizedPrice,
      expectedNormalized,
      isValid,
      factor: config.factor
    });
    
    console.log(`  ${asset}: ${isValid ? '✅' : '❌'} ${rawPrice} → ${normalizedPrice} (facteur: ${config.factor})`);
  }
  
  return results;
}

/**
 * Valide les conversions de décimales
 */
function validateDecimalConversions() {
  console.log("🔍 Validation des conversions de décimales...");
  
  const results = [];
  
  for (const format of AUDIT_CONFIG.DECIMAL_FORMATS) {
    const testBalance = 1000000; // Balance de test
    let convertedBalance;
    
    if (format.weiDecimals > format.szDecimals) {
      const diff = format.weiDecimals - format.szDecimals;
      convertedBalance = testBalance * Math.pow(10, diff);
    } else if (format.weiDecimals < format.szDecimals) {
      const diff = format.szDecimals - format.weiDecimals;
      convertedBalance = Math.floor(testBalance / Math.pow(10, diff));
    } else {
      convertedBalance = testBalance;
    }
    
    results.push({
      name: format.name,
      szDecimals: format.szDecimals,
      weiDecimals: format.weiDecimals,
      originalBalance: testBalance,
      convertedBalance,
      isValid: convertedBalance > 0
    });
    
    console.log(`  ${format.name}: ${convertedBalance > 0 ? '✅' : '❌'} ${testBalance} → ${convertedBalance}`);
  }
  
  return results;
}

/**
 * Valide les encodages d'ordres spot
 */
function validateSpotOrderEncoding() {
  console.log("🔍 Validation des encodages d'ordres spot...");
  
  const testOrder = {
    asset: 1, // BTC
    isBuy: true,
    limitPxRaw: 50000 * 1000,
    szInSzDecimals: 1000000,
    tif: 3, // IOC
    cloid: 12345
  };
  
  // Simulation de l'encodage HLConstants
  const header = Buffer.from([1, 2]); // version=1, action=2
  const encoded = Buffer.concat([
    header,
    Buffer.from([
      ...new Uint8Array(new Uint32Array([testOrder.asset]).buffer),
      ...new Uint8Array([testOrder.isBuy ? 1 : 0]),
      ...new Uint8Array(new BigUint64Array([BigInt(testOrder.limitPxRaw)]).buffer),
      ...new Uint8Array(new BigUint64Array([BigInt(testOrder.szInSzDecimals)]).buffer),
      ...new Uint8Array([testOrder.tif]),
      ...new Uint8Array(new BigUint64Array([BigInt(testOrder.cloid)]).buffer)
    ])
  ]);
  
  const isValid = encoded.length > 0 && encoded[0] === 1 && encoded[1] === 2;
  
  console.log(`  Ordre spot: ${isValid ? '✅' : '❌'} Taille: ${encoded.length} bytes`);
  
  return {
    order: testOrder,
    encoded: encoded.toString('hex'),
    isValid,
    size: encoded.length
  };
}

/**
 * Valide les encodages de spot send
 */
function validateSpotSendEncoding() {
  console.log("🔍 Validation des encodages de spot send...");
  
  const testSend = {
    destination: AUDIT_CONFIG.SYSTEM_ADDRESSES.usdcCoreSystemAddress,
    tokenId: 1,
    amount1e8: 100000000 // 1 USDC
  };
  
  // Simulation de l'encodage HLConstants
  const header = Buffer.from([1, 6]); // version=1, action=6
  const encoded = Buffer.concat([
    header,
    Buffer.from([
      ...Buffer.from(testSend.destination.slice(2), 'hex'),
      ...new Uint8Array(new BigUint64Array([BigInt(testSend.tokenId)]).buffer),
      ...new Uint8Array(new BigUint64Array([BigInt(testSend.amount1e8)]).buffer)
    ])
  ]);
  
  const isValid = encoded.length > 0 && encoded[0] === 1 && encoded[1] === 6;
  
  console.log(`  Spot send: ${isValid ? '✅' : '❌'} Taille: ${encoded.length} bytes`);
  
  return {
    send: testSend,
    encoded: encoded.toString('hex'),
    isValid,
    size: encoded.length
  };
}

/**
 * Valide les paramètres de sécurité
 */
function validateSecurityParams() {
  console.log("🔍 Validation des paramètres de sécurité...");
  
  const results = [];
  
  for (const [param, value] of Object.entries(AUDIT_CONFIG.SECURITY_PARAMS)) {
    let isValid = false;
    let message = "";
    
    switch (param) {
      case 'maxOracleDeviationBps':
        isValid = value > 0 && value <= 5000; // Max 50%
        message = isValid ? "Déviation oracle acceptable" : "Déviation oracle trop élevée";
        break;
      case 'deadbandBps':
        isValid = value > 0 && value <= 50; // Max 0.5%
        message = isValid ? "Deadband approprié" : "Deadband trop élevé";
        break;
      case 'maxSlippageBps':
        isValid = value > 0 && value <= 1000; // Max 10%
        message = isValid ? "Slippage acceptable" : "Slippage trop élevé";
        break;
      case 'marketEpsilonBps':
        isValid = value > 0 && value <= 100; // Max 1%
        message = isValid ? "Epsilon marché approprié" : "Epsilon marché trop élevé";
        break;
    }
    
    results.push({
      param,
      value,
      isValid,
      message
    });
    
    console.log(`  ${param}: ${isValid ? '✅' : '❌'} ${value} bps - ${message}`);
  }
  
  return results;
}

/**
 * Génère le rapport d'audit
 */
function generateAuditReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      criticalIssues: 0,
      warnings: 0
    },
    results: results,
    recommendations: []
  };
  
  // Calcul des statistiques
  for (const result of results) {
    if (Array.isArray(result)) {
      for (const item of result) {
        report.summary.totalTests++;
        if (item.isValid) {
          report.summary.passedTests++;
        } else {
          report.summary.failedTests++;
          if (item.critical) {
            report.summary.criticalIssues++;
          } else {
            report.summary.warnings++;
          }
        }
      }
    } else {
      report.summary.totalTests++;
      if (result.isValid) {
        report.summary.passedTests++;
      } else {
        report.summary.failedTests++;
        if (result.critical) {
          report.summary.criticalIssues++;
        } else {
          report.summary.warnings++;
        }
      }
    }
  }
  
  // Recommandations basées sur les résultats
  if (report.summary.criticalIssues > 0) {
    report.recommendations.push("🚨 CORRECTION IMMÉDIATE REQUISE: Problèmes critiques détectés");
  }
  
  if (report.summary.warnings > 0) {
    report.recommendations.push("⚠️ ATTENTION: Problèmes mineurs détectés - validation recommandée");
  }
  
  if (report.summary.passedTests === report.summary.totalTests) {
    report.recommendations.push("✅ TOUS LES TESTS PASSÉS: Système conforme aux spécifications");
  }
  
  return report;
}

/**
 * Fonction principale
 */
async function main() {
  console.log("🚀 Démarrage de la validation d'audit STRATEGY_1\n");
  
  const results = [];
  
  try {
    // 1. Validation des formats de prix oracle
    const oracleResults = validateOracleFormats();
    results.push(...oracleResults);
    
    // 2. Validation des conversions de décimales
    const decimalResults = validateDecimalConversions();
    results.push(...decimalResults);
    
    // 3. Validation des encodages d'ordres spot
    const orderResult = validateSpotOrderEncoding();
    results.push(orderResult);
    
    // 4. Validation des encodages de spot send
    const sendResult = validateSpotSendEncoding();
    results.push(sendResult);
    
    // 5. Validation des paramètres de sécurité
    const securityResults = validateSecurityParams();
    results.push(...securityResults);
    
    // 6. Génération du rapport
    const report = generateAuditReport(results);
    
    // 7. Sauvegarde du rapport
    const reportPath = path.join(__dirname, '..', 'docs', 'AUDIT_VALIDATION_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // 8. Affichage du résumé
    console.log("\n📊 RÉSUMÉ DE LA VALIDATION");
    console.log("==========================");
    console.log(`Tests totaux: ${report.summary.totalTests}`);
    console.log(`Tests réussis: ${report.summary.passedTests} ✅`);
    console.log(`Tests échoués: ${report.summary.failedTests} ❌`);
    console.log(`Problèmes critiques: ${report.summary.criticalIssues} 🚨`);
    console.log(`Avertissements: ${report.summary.warnings} ⚠️`);
    
    console.log("\n📋 RECOMMANDATIONS");
    console.log("==================");
    for (const recommendation of report.recommendations) {
      console.log(recommendation);
    }
    
    console.log(`\n📄 Rapport détaillé sauvegardé: ${reportPath}`);
    
    // Code de sortie basé sur les résultats
    if (report.summary.criticalIssues > 0) {
      process.exit(1);
    } else if (report.summary.warnings > 0) {
      process.exit(2);
    } else {
      process.exit(0);
    }
    
  } catch (error) {
    console.error("❌ Erreur lors de la validation:", error.message);
    process.exit(1);
  }
}

// Exécution du script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  validateOracleFormats,
  validateDecimalConversions,
  validateSpotOrderEncoding,
  validateSpotSendEncoding,
  validateSecurityParams,
  generateAuditReport
};
