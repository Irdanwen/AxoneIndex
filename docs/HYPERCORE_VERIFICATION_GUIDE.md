# Guide de Vérification HyperCore

## 🔍 Comment vérifier que vos USDC ont été correctement envoyés sur HyperCore

### 1. **Exécution des Scripts de Vérification**

> Pré-requis: depuis `contracts/`, assurez-vous que `pnpm install` a été exécuté et que les variables d'environnement (`TESTNET_RPC_URL`, `PRIVATE_KEY`) sont renseignées dans `contracts/env`.

#### Script 1: Vérification des Balances
```bash
cd contracts
pnpm hardhat run scripts/check-hypercore-balances.js --network testnet
```

Ce script vous donnera :
- ✅ La NAV (valeur nette) du vault
- ✅ Les balances USDC dans le vault et le handler
- ✅ Les balances sur HyperCore (USDC, BTC, HYPE)
- ✅ Les prix oracle actuels
- ✅ La valeur des positions

#### Script 2: Analyse des Événements
```bash
cd contracts
pnpm hardhat run scripts/analyze-deposit-events.js --network testnet
```

Ce script analysera votre transaction spécifique et décodera tous les événements.

### 2. **Vérification Manuelle via Code**

#### A. Vérifier l'Équité Core
```javascript
const handler = await ethers.getContractAt("CoreInteractionHandler", HANDLER_ADDRESS);
const coreEquity = await handler.equitySpotUsd1e18();
console.log(`Équité Core: ${ethers.utils.formatEther(coreEquity)} USD`);
```

#### B. Vérifier les Balances Individuelles
```javascript
// Balances USDC sur Core
const usdcBalance = await handler.spotBalance(HANDLER_ADDRESS, usdcCoreTokenId);
console.log(`USDC sur Core: ${ethers.utils.formatUnits(usdcBalance, 8)}`);

// Balances BTC sur Core
const btcBalance = await handler.spotBalance(HANDLER_ADDRESS, spotTokenBTC);
console.log(`BTC sur Core: ${btcBalance.toString()}`);

// Balances HYPE sur Core
const hypeBalance = await handler.spotBalance(HANDLER_ADDRESS, spotTokenHYPE);
console.log(`HYPE sur Core: ${hypeBalance.toString()}`);
```

### 3. **Interprétation des Résultats**

#### ✅ **Signes de Succès :**
- `coreEquity > 0` : Des fonds sont présents sur HyperCore
- `btcBalance > 0` ou `hypeBalance > 0` : Les USDC ont été échangés contre des tokens
- `usdcBalance` peut être > 0 si une partie n'a pas encore été échangée

#### ⚠️ **Signes d'Attention :**
- `coreEquity = 0` : Aucun fonds sur HyperCore
- Toutes les balances = 0 : Problème possible avec l'envoi

### 4. **Vérification des Événements de Transaction**

#### Événements Attendus :
1. **`Deposit`** : Confirme le dépôt dans le vault
2. **`Transfer`** (USDC) : Transfert USDC vers le vault
3. **`Transfer`** (c50USD) : Mint des parts du vault
4. **`OutboundToCore`** : Envoi vers HyperCore
5. **`NavUpdated`** : Mise à jour de la valeur nette

#### Logs Core/HyperCore :
- Adresse `0x3333333333333333333333333333333333333333` : Système Core
- Adresse `0xdd9ca2ace9b827a6caf43c2ae63cf1ab62d87a84` : Handler Core

### 5. **Vérification via Interface Web (si disponible)**

Si HyperCore a une interface web, vous pouvez :
1. Connecter votre wallet
2. Vérifier les balances spot
3. Voir l'historique des transactions
4. Consulter les ordres ouverts

### 6. **Dépannage**

#### Problème : `coreEquity = 0`
**Causes possibles :**
- Les USDC n'ont pas été envoyés sur Core
- Problème de configuration du handler
- Les ordres d'achat ont échoué

**Solutions :**
```javascript
// Vérifier la configuration
const usdcCoreSystemAddress = await handler.usdcCoreSystemAddress();
const usdcCoreTokenId = await handler.usdcCoreTokenId();
console.log(`USDC Core System: ${usdcCoreSystemAddress}`);
console.log(`USDC Core Token ID: ${usdcCoreTokenId}`);
```

#### Problème : USDC sur Core mais pas de BTC/HYPE
**Causes possibles :**
- Les ordres d'achat ont échoué
- Prix oracle non disponibles
- Slippage trop élevé

**Solutions :**
```javascript
// Vérifier les prix oracle
const spotBTC = await handler.spotBTC();
const spotHYPE = await handler.spotHYPE();
const btcPrice = await handler.spotOraclePx1e8(spotBTC);
const hypePrice = await handler.spotOraclePx1e8(spotHYPE);
console.log(`Prix BTC: $${ethers.utils.formatUnits(btcPrice, 8)}`);
console.log(`Prix HYPE: $${ethers.utils.formatUnits(hypePrice, 8)}`);
```

### 7. **Commandes Utiles**

#### Vérification Rapide
```bash
# Vérifier la NAV du vault
pnpm hardhat console --network testnet
> const vault = await ethers.getContractAt("VaultContract", "0xe9CabbB51544Bcc0A57F2ad902fD938a6cE7EEf2");
> const nav = await vault.nav1e18();
> console.log(ethers.utils.formatEther(nav));
```

#### Vérification des Balances Core
```bash
> const handler = await ethers.getContractAt("CoreInteractionHandler", "0x4E0389AcF0b2bde612C43e6CE887309D81aCe0D6");
> const equity = await handler.equitySpotUsd1e18();
> console.log(ethers.utils.formatEther(equity));
```

### 8. **Monitoring Continu**

Pour surveiller vos positions :
1. Exécutez le script de vérification régulièrement
2. Surveillez les changements de NAV
3. Vérifiez les prix oracle
4. Consultez les événements de rebalancement

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez d'abord avec les scripts fournis
2. Consultez les logs de transaction
3. Vérifiez la configuration du handler
4. Contactez l'équipe technique si nécessaire
