import { getCodeHash } from './referralUtils'

// Test du hashage du code "TEST123"
export function testCodeHash() {
  const testCode = "TEST123"
  const hash = getCodeHash(testCode)
  
  console.log('Code de test:', testCode)
  console.log('Hash généré:', hash)
  
  // Le hash attendu pour "TEST123" (à vérifier avec le contrat)
  // Vous pouvez comparer ce hash avec celui stocké dans le contrat
  return hash
}

// Fonction pour tester plusieurs codes
export function testMultipleCodes() {
  const testCodes = ["TEST123", "WELCOME", "AXONE2024", "DEFI"]
  
  testCodes.forEach(code => {
    const hash = getCodeHash(code)
    console.log(`${code} -> ${hash}`)
  })
}

