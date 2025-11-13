# Guide de Vérification HyperCore Testnet

## 🔍 Comment vérifier que vos USDC ont été correctement envoyés sur HyperCore Testnet

### 📊 **Analyse de votre transaction**

D'après l'analyse de vos logs, voici ce qui s'est passé :

#### ✅ **Dépôt réussi :**
- **Montant déposé :** 50 USDC
- **Parts créées :** 49.5 sAXN1 (avec 1% de frais de dépôt)
- **Auto-déploiement :** 45 USDC (90% du dépôt) envoyés vers HyperCore
- **Interactions Core :** 5 événements HyperCore détectés

#### 🔄 **Flux des fonds :**
1. **50 USDC** → Vault (de votre adresse)
2. **45 USDC** → Handler → HyperCore System
3. **5 USDC** → Restent dans le vault
4. **49.5 sAXN1** → Parts créées pour vous

### 🛠️ **Méthodes de vérification**

#### **1. Script de vérification automatique**
```bash
cd /Users/morganmagalhaes/Documents/Codage/Cursor/AxoneIndex
node scripts/check-hypercore-testnet.js
```

Ce script vérifiera :
- ✅ La NAV du vault
- ✅ Les balances USDC
- ✅ Les balances sur HyperCore
- ✅ Les prix oracle
- ✅ La valeur des positions

#### **2. Vérification via l'interface HyperCore**

**Étape 1 :** Connectez-vous à l'interface HyperCore Testnet
- 🌐 **URL :** https://app.hyperliquid-testnet.xyz/
- 🔗 **Connectez votre wallet** (même adresse que celle utilisée pour le dépôt)

**Étape 2 :** Vérifiez les balances spot
- 📊 Allez dans la section "Spot" ou "Balances"
- 🔍 Recherchez l'adresse du handler : `0x4E0389AcF0b2bde612C43e6CE887309D81aCe0D6`
- 💰 Vérifiez les balances USDC, BTC, et HYPE

**Étape 3 :** Consultez l'historique des ordres
- 📋 Allez dans "Orders" ou "History"
- 🔍 Recherchez les ordres d'achat BTC/HYPE
- ✅ Vérifiez que les ordres ont été exécutés

#### **3. Vérification via l'explorateur HyperEVM**

**Étape 1 :** Consultez l'explorateur
- 🌐 **URL :** https://explorer.hyperliquid-testnet.xyz/
- 🔍 Recherchez votre transaction : `0xc7f20cf4fa8baf84c36708e91846af31e5138bec59d90f4ceae0ff96c79d8545`

**Étape 2 :** Analysez les événements
- 📝 Vérifiez les événements `OutboundToCore`
- 🔄 Consultez les interactions avec le système Core

### 🔍 **Interprétation des résultats**

#### ✅ **Signes de succès :**
- `coreEquity > 0` : Des fonds sont présents sur HyperCore
- `btcBalance > 0` ou `hypeBalance > 0` : Les USDC ont été échangés
- Ordres exécutés dans l'historique HyperCore
- NAV du vault mis à jour

#### ⚠️ **Signes d'attention :**
- `coreEquity = 0` : Aucun fonds sur HyperCore
- Toutes les balances = 0 : Problème possible
- Ordres non exécutés : Prix oracle ou slippage

### 📞 **Adresses importantes**

```
Vault Contract:     0xe9CabbB51544Bcc0A57F2ad902fD938a6cE7EEf2
Handler Contract:   0x4E0389AcF0b2bde612C43e6CE887309D81aCe0D6
Votre Adresse:      0x1ee9c37e28d2db4d8c35a94bb05c3f189191d506
Core System:        0x3333333333333333333333333333333333333333
Core Handler:       0xdd9ca2ace9b827a6caf43c2ae63cf1ab62d87a84
```

### 🔧 **Commandes de vérification rapide**

#### Vérifier la NAV du vault
```javascript
// Dans la console du navigateur sur l'interface HyperCore
const vault = await ethers.getContractAt("VaultContract", "0xe9CabbB51544Bcc0A57F2ad902fD938a6cE7EEf2");
const nav = await vault.nav1e18();
console.log(`NAV: ${ethers.utils.formatEther(nav)} USD`);
```

#### Vérifier les balances Core
```javascript
const handler = await ethers.getContractAt("CoreInteractionHandler", "0x4E0389AcF0b2bde612C43e6CE887309D81aCe0D6");
const equity = await handler.equitySpotUsd1e18();
console.log(`Équité Core: ${ethers.utils.formatEther(equity)} USD`);
```

### 🚨 **Dépannage**

#### Problème : Aucun fonds sur HyperCore
**Causes possibles :**
- Configuration incorrecte du handler
- Problème de connexion HyperEVM ↔ HyperCore
- Ordres d'achat échoués

**Solutions :**
1. Vérifiez la configuration du handler
2. Consultez les logs de transaction
3. Vérifiez les prix oracle
4. Contactez l'équipe technique

#### Problème : USDC sur Core mais pas de BTC/HYPE
**Causes possibles :**
- Ordres d'achat non exécutés
- Prix oracle non disponibles
- Slippage trop élevé

**Solutions :**
1. Vérifiez l'historique des ordres
2. Consultez les prix oracle
3. Vérifiez les paramètres de slippage

### 📈 **Monitoring continu**

Pour surveiller vos positions :
1. **Exécutez le script de vérification** régulièrement
2. **Surveillez les changements de NAV** du vault
3. **Vérifiez les prix oracle** sur HyperCore
4. **Consultez les événements de rebalancement**

### 🔗 **Ressources utiles**

- 🌐 **Interface HyperCore Testnet :** https://app.hyperliquid-testnet.xyz/
- 📊 **Explorateur HyperEVM :** https://explorer.hyperliquid-testnet.xyz/
- 📋 **Documentation HyperCore :** https://hyperliquid.gitbook.io/
- 💬 **Discord HyperCore :** https://discord.gg/hyperliquid

---

## 🎯 **Résumé de votre transaction**

✅ **Dépôt :** 50 USDC → 49.5 sAXN1  
✅ **Auto-déploiement :** 45 USDC vers HyperCore  
✅ **Interactions Core :** 5 événements détectés  
✅ **NAV mis à jour :** 5.0 USD  

**Prochaines étapes :**
1. Exécutez le script de vérification
2. Consultez l'interface HyperCore
3. Vérifiez que les USDC ont été échangés contre BTC/HYPE
4. Surveillez les performances de votre position
