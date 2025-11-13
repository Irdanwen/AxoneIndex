# Guide de Test - Connexion Wallet et Basculement HyperEVM

## ✅ Implémentation Terminée

Les modifications suivantes ont été implémentées avec succès :

### 1. Configuration du réseau HyperEVM (`src/lib/wagmi.ts`)
- Ajout de la définition du réseau HyperEVM (ID: 998)
- Configuration des RPC URLs pour HyperEVM
- Intégration dans la configuration wagmi

### 2. Mise à jour du Header (`src/components/layout/Header.tsx`)
- Hooks wagmi utilisés: `useAccount`, `useConnect`, `useDisconnect`, `useSwitchChain`
- Bouton `Connect Wallet` (desktop + drawer mobile) basé sur le connecteur `injected()`
- Pilule `HyperEVM` qui déclenche `switchChain({ chainId: 998 })` avec gestion de l'état `isPending`
- Menu compte affichant l'adresse abrégée et une action `Déconnecter`
- Gestion des erreurs (réseau manquant, changement refusé) via le système de toasts local

## 🧪 Tests à Effectuer

### Test 1 : Connexion Wallet
1. Ouvrez l'application dans votre navigateur
2. Cliquez sur `Connect Wallet` dans le header (ou le bouton équivalent dans le drawer mobile)
3. Résultat attendu : MetaMask s'ouvre pour demander l'autorisation
4. Autorisez la connexion
5. Résultat attendu : L'adresse wallet s'affiche dans le header

### Test 2 : Basculement vers HyperEVM
1. Avec le wallet connecté, cliquez sur la pilule `HyperEVM`
2. Résultat attendu : MetaMask demande confirmation pour changer de réseau (ou propose d'ajouter HyperEVM si absent)
3. Confirmez le changement
4. Résultat attendu : Le réseau change vers HyperEVM (ID: 998)

### Test 3 : Gestion des Erreurs
1. Si le réseau HyperEVM n'est pas configuré dans MetaMask
2. Résultat attendu : MetaMask propose d'ajouter automatiquement le réseau
3. Si erreur 4902 : Une alerte s'affiche

## 🔧 Configuration MetaMask Requise

Assurez-vous que MetaMask est configuré avec :
- HyperEVM Testnet (ajouté automatiquement via wagmi)

### Configuration manuelle HyperEVM (si nécessaire) :
- Nom du réseau : HyperEVM Testnet
- URL RPC : `https://rpc.hyperliquid-testnet.xyz/evm`
- ID de chaîne : 998
- Symbole : ETH
- Explorateur : (optionnel)

## 🚨 Dépannage

### Problème : Le basculement échoue
Solution : Vérifiez que l'URL RPC est correcte et accessible

### Problème : MetaMask ne reconnaît pas le réseau
Solution : Ajoutez manuellement le réseau HyperEVM dans MetaMask

### Problème : Erreur de connexion
Solution : Vérifiez que MetaMask est installé et déverrouillé

## 📝 Notes Techniques

- L'implémentation utilise `injected()` (wagmi v2)
- Les erreurs `switchChain` (ex: code 4902) sont capturées et relayées par des toasts
- L'interface s'adapte dynamiquement selon l'état de connexion et le viewport
- Les états de chargement sont gérés avec `isPending` exposé par wagmi


