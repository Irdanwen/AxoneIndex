# Correction Erreur Build Vercel - Wagmi v2

## Problème identifié
❌ **Erreur de compilation** :
```
Module not found: Package path ./connectors/injected is not exported from package wagmi
```

## Cause
L'import de `InjectedConnector` utilisait l'ancienne API wagmi v1 au lieu de la nouvelle API wagmi v2.

## Corrections appliquées

### 1. **Header.tsx** - Correction de l'import
```diff
- import { InjectedConnector } from 'wagmi/connectors/injected';
+ import { injected } from 'wagmi/connectors';
```

### 2. **Header.tsx** - Correction de l'utilisation
```diff
- onClick={() => connect({ connector: new InjectedConnector() })}
+ onClick={() => connect({ connector: injected })}
```

### 3. **wagmi.ts** - Ajout des connecteurs
```diff
+ import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [sepolia, hyperEVM],
+ connectors: [
+   injected()
+ ],
  transports: {
    [sepolia.id]: http(),
    [hyperEVM.id]: http(hyperEVM.rpcUrls.default.http[0])
  }
})
```

## Différences Wagmi v1 vs v2

### **Wagmi v1** (ancien)
```typescript
import { InjectedConnector } from 'wagmi/connectors/injected'
// ...
onClick={() => connect({ connector: new InjectedConnector() })}
```

### **Wagmi v2** (nouveau)
```typescript
import { injected } from 'wagmi/connectors'
// ...
onClick={() => connect({ connector: injected })}
```

## Résultat
✅ **Build Vercel réussi** - Plus d'erreur de module non trouvé
✅ **Compatibilité wagmi v2** - Utilisation de la nouvelle API
✅ **Fonctionnalité préservée** - Connexion wallet toujours opérationnelle

## Vérification
- ✅ Import `injected` depuis `wagmi/connectors`
- ✅ Configuration wagmi avec connecteurs
- ✅ Utilisation correcte dans le Header
- ✅ Aucune autre référence à l'ancienne API
