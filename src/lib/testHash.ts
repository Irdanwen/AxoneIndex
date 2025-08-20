import { getCodeHash } from './referralUtils'

// Test du hashage du code "TEST123"
export function testHash() {
  const testCode = "TEST123"
  const hash = getCodeHash(testCode)
  
  console.log('=== Test de Hashage ===')
  console.log('Code de test:', testCode)
  console.log('Hash généré:', hash)
  console.log('Hash attendu: 0x55965438c2b31211ad28431137e9ffd8cee0c9f26f991f5daeb3c80d79bb7781')
  console.log('Hash correct:', hash === '0x55965438c2b31211ad28431137e9ffd8cee0c9f26f991f5daeb3c80d79bb7781')
  
  return hash
}

// Test de plusieurs codes
export function testMultipleHashes() {
  const testCodes = [
    "TEST123",
    "WELCOME", 
    "AXONE2024",
    "DEFI",
    "CRYPTO"
  ]
  
  console.log('=== Test de Plusieurs Codes ===')
  testCodes.forEach(code => {
    const hash = getCodeHash(code)
    console.log(`${code} -> ${hash}`)
  })
}

// Test de validation
export function validateHash() {
  const testCode = "TEST123"
  const expectedHash = "0x55965438c2b31211ad28431137e9ffd8cee0c9f26f991f5daeb3c80d79bb7781"
  const actualHash = getCodeHash(testCode)
  
  if (actualHash === expectedHash) {
    console.log('✅ Hashage correct pour TEST123')
    return true
  } else {
    console.log('❌ Erreur de hashage pour TEST123')
    console.log('Attendu:', expectedHash)
    console.log('Obtenu:', actualHash)
    return false
  }
}

