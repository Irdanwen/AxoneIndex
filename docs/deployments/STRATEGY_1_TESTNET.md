# STRATEGY_1 — Déploiement HyperEVM Testnet

## Adresses

- L1Read: `0xCA4A9c9e937535c131394E868C6134f3e82974E0`
- CoreWriter (système): `0x3333333333333333333333333333333333333333`
- USDC (EVM): `0x0B80659a4076E9E93C7DbE0f10675A16a3e5C206`
- CoreInteractionHandler: `0x5d5Cd778D5C5FD8082e099A8e6d95ad83AE5CfeE`
- VaultContract: `0x5c4a979F19CaFE67ABf1E1fE883e4c15e8379473`

## Adresses — déploiement courant (dernier run `deploy_strategy1_testnet.js`)

**Dernier déploiement:** 2025-11-15

- L1Read: `0x71752E1caFa851f3Cdb34C1B8Dd5D4745d55403A`
- CoreWriter (système): `0x3333333333333333333333333333333333333333`
- USDC (EVM): `0x0B80659a4076E9E93C7DbE0f10675A16a3e5C206`
- CoreInteractionHandler: `0x5Ac60985E55d2B33cc2a26286a7325202bA487db`
- VaultContract: `0x82A9ec1B0c949c80dC9fDddD530DF83AB5190D46`

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


