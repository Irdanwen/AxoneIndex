# <NomContrat>

## Présentation
Bref résumé du rôle du contrat et de ses dépendances clés.

## Éléments clés
- Adresse: (si connue)
- Héritage: <Base1>, <Base2>
- Réseau(x): Testnet/Mainnet (si applicable)

## Événements
- EventName(param: type, ...): description et quand il est émis.

## Erreurs
- ErrorName(args): conditions de déclenchement.

## Modifiers
- onlyRole(bytes32 role): effet et prérequis.

## Fonctions (vue d’ensemble)
| Nom | Signature | Visibilité | Mutabilité | Accès | Emits/Reverts |
|-----|-----------|------------|-----------|-------|---------------|

## Détails des fonctions
### functionName(param1: type, ...): returnType
- Description: ...
- Paramètres: `param1` (type) – description, ...
- Retour: ...
- Accès: public/external, onlyOwner/roles, nonReentrant, etc.
- State: view/pure/payable
- Emits: EventX
- Reverts: ErrorY
- Exemple (ethers.js):
```ts
import { ethers } from "ethers";
const c = new ethers.Contract(addr, abi, signer);
const res = await c.functionName(arg1, { value: ... });
```

## Notes
- Terminologie cohérente (ex: « dépôt », « retrait », « staking »).
- Types alignés (uint256 vs number), unités documentées (decimals, wei/ether).
- Tous les éléments publics/external sont couverts.

