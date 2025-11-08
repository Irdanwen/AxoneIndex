# STRATEGY_1 — Déploiement HyperEVM Testnet

## Adresses

- L1Read: `0xF95B54c2c77F9e1c4E54869CCBCdA32380B38C96`
- CoreWriter (système): `0x3333333333333333333333333333333333333333`
- USDC (EVM): `0xd9cbec81df392a88aeff575e962d149d57f4d6bc`
- CoreInteractionHandler: `0xa89e805806d0174b587a7001944aaBEECb53f284`
- VaultContract: `0xc5e50b61f921C905C2e56837cBAdf3551dc24867`

## Paramètres appliqués

- setUsdcCoreLink(`0x2000000000000000000000000000000000000000`, `0`)
- setHypeCoreLink(`0x2222222222222222222222222222222222222222`, `1105`)
- setSpotIds(`1054`, `1035`)
- setSpotTokenIds(`0`, `1129`, `1105`)
- setParams(`5000`, `500`, `50`)
- setMaxOracleDeviationBps(`4500`)
- setRebalancer(`0x1eE9C37E28D2DB4d8c35A94bB05C3f189191D506`)
- Vault.setFees(`50`, `50`, `10000`)

## Notes d’usage

- Les scripts de vérification lisent ces adresses par défaut, et acceptent des overrides via variables d’environnement: `HANDLER`, `VAULT`, `L1READ`.
- Réseau: `--network testnet` (HyperEVM). Assurez-vous que `contracts/env` contient `PRIVATE_KEY` et `TESTNET_RPC_URL`.

## Commandes utiles

- Statut: `cd contracts && ./node_modules/.bin/hardhat run scripts/status_strategy1_testnet.js --network testnet`
- Événements: `cd contracts && ./node_modules/.bin/hardhat run scripts/strategy1_verify_events_testnet.js --network testnet`
- Rebalance: `cd contracts && GAS_PRICE_GWEI=3 ./node_modules/.bin/hardhat run scripts/strategy1_rebalance_testnet.js --network testnet`


