# Guide de Test - Connexion Wallet et Basculement HyperEVM

## ✅ Implémentation Terminée

Les modifications suivantes ont été implémentées avec succès :

### 1. Configuration du réseau HyperEVM (`src/lib/wagmi.ts`)
- ✅ Ajout de la définition du réseau HyperEVM (ID: 998)
- ✅ Configuration des RPC URLs pour HyperEVM
- ✅ Intégration dans la configuration wagmi

### 2. Mise à jour du Header (`src/components/layout/Header.tsx`)
- ✅ Ajout des hooks wagmi (`useAccount`, `useConnect`, `useSwitchChain`)
- ✅ Implémentation du bouton "Connecter Wallet"
- ✅ Affichage de l'adresse wallet connectée
- ✅ Bouton de basculement vers HyperEVM
- ✅ Gestion des erreurs de chaîne

## 🧪 Tests à Effectuer

### Test 1 : Connexion Wallet
1. Ouvrez l'application dans votre navigateur
2. Cliquez sur "Connecter Wallet" dans le header
3. **Résultat attendu** : MetaMask s'ouvre pour demander l'autorisation
4. Autorisez la connexion
5. **Résultat attendu** : L'adresse wallet s'affiche dans le header

### Test 2 : Basculement vers HyperEVM
1. Avec le wallet connecté, cliquez sur "Basculer vers HyperEVM"
2. **Résultat attendu** : MetaMask demande confirmation pour changer de réseau
3. Confirmez le changement
4. **Résultat attendu** : Le réseau change vers HyperEVM (ID: 998)

### Test 3 : Gestion des Erreurs
1. Si le réseau HyperEVM n'est pas configuré dans MetaMask
2. **Résultat attendu** : MetaMask propose d'ajouter automatiquement le réseau
3. Si erreur 4902 : Une alerte s'affiche

## 🔧 Configuration MetaMask Requise

Assurez-vous que MetaMask est configuré avec :
- **HyperEVM Testnet** (ajouté automatiquement via wagmi)

### Configuration manuelle HyperEVM (si nécessaire) :
- **Nom du réseau** : HyperEVM Testnet
- **URL RPC** : `https://rpc.hyperliquid-testnet.xyz/evm`
- **ID de chaîne** : 998
- **Symbole** : ETH
- **Explorateur** : (optionnel)

## 🚨 Dépannage

### Problème : Le basculement échoue
**Solution** : Vérifiez que l'URL RPC est correcte et accessible

### Problème : MetaMask ne reconnaît pas le réseau
**Solution** : Ajoutez manuellement le réseau HyperEVM dans MetaMask

### Problème : Erreur de connexion
**Solution** : Vérifiez que MetaMask est installé et déverrouillé

## 📝 Notes Techniques

- L'implémentation utilise `InjectedConnector` pour la compatibilité MetaMask
- Le gestionnaire d'erreur global capture les erreurs de changement de chaîne
- L'interface s'adapte dynamiquement selon l'état de connexion
- Les états de chargement sont gérés avec `isPending`

## 🎯 Prochaines Étapes

Une fois les tests validés, vous pouvez :
1. Ajouter des fonctionnalités de déconnexion
2. Implémenter la persistance de l'état de connexion
3. Ajouter des notifications pour les changements de réseau
4. Intégrer des transactions sur HyperEVM
