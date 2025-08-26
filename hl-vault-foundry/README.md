## Core50 Vault (HyperEVM ↔ HyperCore)

Mini-repo Foundry démontrant un vault ERC-20 acceptant l’USDC (6 décimales) sur HyperEVM testnet, calcul de NAV/PPS trustless (USDC EVM + equity HyperCore via precompiles), retraits synchrones/async, et interaction avec HyperCore via un handler dédié.

### Prérequis
- **RPC HyperEVM testnet**: `RPC_URL`
- **Clé privée**: `PRIVATE_KEY`
- **USDC (EVM)**: `0xd9cbec81df392a88aeff575e962d149d57f4d6bc`
- **CoreWriter (write)**: `0x3333333333333333333333333333333333333333`
- **L1Read (precompiles base)**: `0x0000000000000000000000000000000000000800`
- **Adresses Core spot USDC**: `USDC_CORE_SYSTEM_ADDRESS`, `USDC_CORE_TOKEN_ID`
- **IDs perps**: `PERP_BTC_ID`, `PERP_HYPE_ID`

### .env
Voir `.env.example`, puis renseigner et renommer en `.env`.

### Déploiement (Foundry)
```bash
forge install
forge build
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
```

Après déploiement, appelez les setters:
```solidity
handler.setUsdcCoreLink(<USDC_CORE_SYSTEM_ADDR>, <USDC_CORE_TOKEN_ID>);
handler.setPerpIds(<BTC_ID>, <HYPE_ID>);
handler.setLimits(200_000_000, 3600);
handler.setParams(50, 10, 100);
vault.setFees(0, 0, 9000);
```

### Séquence d’usage
1) Approve USDC puis `vault.deposit(100e6)`
2) `handler.rebalancePortfolio(0,0)` pour viser 50/50 BTC/HYPE (IOC limit pseudo-market)
3) `vault.withdraw(allShares)`
   - si insuffisance de cash: `vault.recallFromCoreAndSweep(usdNeeded)` → `handler.sweepToVault(usd)` → `vault.settleWithdraw(id, usd, user)`

### Unités
- **NAV/PPS**: 1e18
- **USDC EVM**: 1e6 (convertir en 1e18 via ×1e12)
- **Perps**: prix et taille en 1e8
- **TIF_IOC**: 3

### Garde-fous
- `pause/unpause`, `onlyOwner`
- Rate-limit (maxOutboundPerEpoch + epochLength)
- Slippage: `maxSlippageBps` + epsilon de marché `marketEpsilonBps`
- Deadband rééquilibrage: `deadbandBps`

### FAQ
- **usdcCoreSystemAddress / usdcCoreTokenId**: fournis par la couche système Core (doc Hyperliquid)
- **Perp IDs**: vérifier les IDs markets testnet (BTC, HYPE)
- **IOC market-like**: limite = oracle × (1 ± (maxSlippageBps + marketEpsilonBps)/1e4)

### Handlers d’actions clés
Dans `CoreInteractionHandler.sol`:
- Action 7 (USD class transfer): spot ↔ perp
- Action 6 (spotSend): Core → EVM credit puis sweep
- Action 1 (limit IOC): perps BTC & HYPE, reduceOnly si delta < 0

### Avertissements
- Importer `L1Read.sol` et `CoreWriter.sol` officiels (déjà inclus ici).
- Ne pas laisser d’approvals infinis non nécessaires (approve ciblé en dépôt).

