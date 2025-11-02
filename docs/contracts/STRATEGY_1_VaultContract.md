# STRATEGY_1 VaultContract — Dépôts HYPE (18d), NAV USD, Retraits HYPE

## Résumé
Le vault STRATEGY_1 accepte des dépôts en HYPE (18 décimales), valorise la NAV en USD via l'oracle HYPE, et paie les retraits en HYPE. Une fraction configurable (`autoDeployBps`) du dépôt peut être auto-déployée vers Core via le handler STRATEGY_1 qui convertit 100% des HYPE en USDC puis alloue 50/50 BTC–HYPE.

## API
- `deposit()` (payable) — dépôt HYPE natif (montant via `msg.value`). Les parts sont désormais mintées sur la base du montant NET après frais de dépôt; le frais est envoyé à `feeVault`.
- `withdraw(uint256 shares)` — paiement en HYPE; le frais de retrait est envoyé à `feeVault` et l’utilisateur reçoit le NET. Si la trésorerie EVM est insuffisante, mise en file et rappel via le handler.
- `setHandler(IHandler handler)` — lie le handler; plus d’approval HYPE (dépôts natifs).
- `setFees(depositFeeBps, withdrawFeeBps, autoDeployBps)` — configure les BPS. Les frais de dépôt/retrait sont transférés à l’adresse `feeVault` exposée par le handler.
- `setWithdrawFeeTiers(WithdrawFeeTier[])` — paliers de frais (exprimés en HYPE 1e18) qui peuvent remplacer `withdrawFeeBps` selon le montant.
 - `recallFromCoreAndSweep(uint256 amount1e18)` — rappelle des fonds depuis Core en unités 1e18. Le montant DOIT être un multiple de `1e10` (interop 1e8 côté Core). La fonction émet `RecallAndSweep(swept1e18)` avec le montant effectivement sweepé après conversion, pas la valeur d’entrée brute.

## Fonctions (vue d’ensemble)
| Nom | Signature | Visibilité | Mutabilité | Accès |
|-----|-----------|------------|-----------|-------|
| setHandler | `setHandler(IHandler _handler)` | external | - | onlyOwner |
| setFees | `setFees(uint16 _depositFeeBps, uint16 _withdrawFeeBps, uint16 _autoDeployBps)` | external | - | onlyOwner |
| setWithdrawFeeTiers | `setWithdrawFeeTiers(WithdrawFeeTier[] memory tiers)` | external | - | onlyOwner |
| getWithdrawFeeBpsForAmount | `getWithdrawFeeBpsForAmount(uint256 amount1e18)` → `uint16` | public view | view | - |
| pause/unpause | `pause()` / `unpause()` | external | - | onlyOwner |
| nav1e18 | `nav1e18()` → `uint256` | public view | view | - |
| pps1e18 | `pps1e18()` → `uint256` | public view | view | - |
| deposit | `deposit()` | external payable | notPaused nonReentrant | - |
| withdraw | `withdraw(uint256 shares)` | external | notPaused nonReentrant | - |
| settleWithdraw | `settleWithdraw(uint256 id, address to)` | external | nonReentrant | owner or handler |
| cancelWithdrawRequest | `cancelWithdrawRequest(uint256 id)` | external | nonReentrant | requester |
| recallFromCoreAndSweep | `recallFromCoreAndSweep(uint256 amount1e18)` | external | nonReentrant | onlyOwner |
| transfer/approve/transferFrom | `transfer(address,uint256)` / `approve(address,uint256)` / `transferFrom(address,address,uint256)` | external | diverses | notPaused (sauf approve) |
| canSetHandler | `canSetHandler(address _handler)` → `(bool,string)` | external view | view | - |
| balanceOf | `balanceOf(address)` → `uint256` | public view | view | - |
| deposits | `deposits(address)` → `uint256` | public view | view | - |

- NAV (USD 1e18) = HYPE EVM (solde natif) en USD + Equity spot Core en USD.
- Parts (`decimals=18`) restent USD-dénominées pour l’équité inter-dépôts.
- Retraits: montant brut HYPE dérivé du PPS USD courant; le frais en HYPE est transféré à `feeVault`, l’utilisateur reçoit le net.
- Auto-deploy: `executeDepositHype{value: deployAmt}(true)` côté handler. À partir de la version courante, le handler conserve une réserve d’USDC sur Core configurable (par défaut 1%) et n’alloue que 99% du notional aux achats BTC/HYPE.

- Vérification `pxH > 0` dans `deposit()` et `settleWithdraw(uint256 id, address to)`.
- CEI respecté; envois natifs via `.call{value: ...}` avec vérification de succès.
- Plus d’`approve` HYPE (flux natifs). 
- Paliers triés et bornés (≤10).
- `notPaused` sur fonctions sensibles.

## Formules
- NAV côté vault:
  - `evmHypeUsd1e18 = address(this).balance * oraclePxHype1e8 / 1e8`
  - `nav = evmHypeUsd1e18 + handler.equitySpotUsd1e18()`
- Shares mintées (dépôt net):
  - `netAmount1e18 = amount1e18 - (amount1e18 * depositFeeBps / 10000)`
  - `depositUsd1e18 = netAmount1e18 * pxHype1e8 / 1e8`
  - `shares = depositUsd1e18` si `totalSupply == 0`, sinon `shares = depositUsd1e18 * totalSupply / navPre`
- Retraits:
  - `grossHype1e18 = (shares * pps / 1e18) * 1e8 / oraclePxHype1e8`
  - `feeHype1e18 = grossHype1e18 * withdrawFeeBpsApplied / 10000` (où `withdrawFeeBpsApplied` peut provenir des paliers)
  - `netHype1e18 = grossHype1e18 - feeHype1e18`
  - Transferts: `feeHype1e18` → `feeVault`, `netHype1e18` → utilisateur

### Rappel depuis Core (précision 1e18 ↔ 1e8)

- Pour éviter toute perte de précision: `amount1e18` doit être multiple de `1e10`.
- Conversion interne: `amt1e8 = amount1e18 / 1e10` puis `swept1e18 = amt1e8 * 1e10`.
- Garde-fous:
  - `require(amount1e18 % 1e10 == 0, "amount not 1e10 multiple");`
  - `require(amt1e8u256 <= type(uint64).max, "amount too large");`


## Intégration
1. Déployer le handler STRATEGY_1 (voir doc Handler STRATEGY_1) et le vault STRATEGY_1.
2. `vault.setHandler(handler)` — lie le handler; pas d'approval HYPE (dépôts natifs).
3. Configurer côté handler: `setUsdcCoreLink`, `setHypeCoreLink`, `setSpotIds`, `setSpotTokenIds`.
4. (Optionnel) Réserve USDC Core: `setUsdcReserveBps(100)` pour 1% (plafonné à 10%).
4. Configurer frais et paliers. Le Vault lit l’adresse des frais via `handler.feeVault()` et y envoie les frais de dépôt/retrait.

## Politique de frais (cohérente avec le Handler)

- Dépôt:
  - Calcul du frais en HYPE natif: `fee = amount * depositFeeBps / 10000`
  - Envoi du frais à `handler.feeVault()`
  - Mint des parts sur le montant NET (après frais)
- Retrait (immédiat ou via `settleWithdraw`):
  - Calcul du montant brut HYPE (`gross`)
  - Calcul du frais (via `withdrawFeeBps` ou `withdrawFeeTiers`)
  - Envoi du frais à `handler.feeVault()` et paiement du NET à l’utilisateur
- Événements:
  - `VaultFeePaid(vault, feeVault, kind, amount1e18)` est émis sur dépôt (`kind=1`), retrait immédiat (`kind=2`) et règlement de file d’attente (`kind=3`).

## Événements
- `Deposit(address indexed user, uint256 amount1e18, uint256 sharesMinted)`
- `WithdrawRequested(uint256 indexed id, address indexed user, uint256 shares)`
- `WithdrawPaid(uint256 indexed id, address indexed to, uint256 amount1e18)`
- `WithdrawCancelled(uint256 indexed id, address indexed user, uint256 shares)`
- `HandlerSet(address handler)`
- `FeesSet(uint16 depositFeeBps, uint16 withdrawFeeBps, uint16 autoDeployBps)`
- `PausedSet(bool paused)`
- `RecallAndSweep(uint256 amount1e18)`
- `NavUpdated(uint256 nav1e18)`
- `Transfer(address indexed from, address indexed to, uint256 value)`
- `Approval(address indexed owner, address indexed spender, uint256 value)`
- `WithdrawFeeTiersSet()`
- `VaultFeePaid(address indexed vault, address indexed feeVault, uint8 kind, uint256 amount1e18)`

## Références code
- NAV USD HYPE EVM + Core:
```116:122:contracts/src/STRATEGY_1/VaultContract.sol
function nav1e18() public view returns (uint256) {
    uint64 pxH = address(handler) == address(0) ? uint64(0) : handler.oraclePxHype1e8();
    uint256 evmHypeUsd1e18 = pxH == 0 ? 0 : (address(this).balance * uint256(pxH)) / 1e8;
    uint256 coreEq1e18 = address(handler) == address(0) ? 0 : handler.equitySpotUsd1e18();
    return evmHypeUsd1e18 + coreEq1e18;
}
```
- Dépôt HYPE natif → auto-deploy:
```144:175:contracts/src/STRATEGY_1/VaultContract.sol
function deposit() external payable notPaused nonReentrant {
    ...
    // fee envoyé à handler.feeVault(), parts mintées sur le net
    handler.executeDepositHype{value: deployAmt}(true);
}
```
- Retrait HYPE et rappel si nécessaire:
```177:225:contracts/src/STRATEGY_1/VaultContract.sol
function withdraw(uint256 shares) external notPaused nonReentrant {
    ...
    // fee envoyé à handler.feeVault(), utilisateur reçoit net
    try handler.pullHypeFromCoreToEvm(recallAmount1e8) { ... }
}
```
- Rappel depuis Core et sweep (sans perte):
```298:304:contracts/src/STRATEGY_1/VaultContract.sol
function recallFromCoreAndSweep(uint256 amount1e18) external onlyOwner nonReentrant {
    require(amount1e18 % 1e10 == 0, "amount not 1e10 multiple");
    uint256 amt1e8u256 = amount1e18 / 1e10;
    require(amt1e8u256 <= type(uint64).max, "amount too large");
    uint64 amt1e8 = uint64(amt1e8u256);
    handler.pullHypeFromCoreToEvm(amt1e8);
    uint256 swept1e18 = amt1e8u256 * 1e10;
    handler.sweepHypeToVault(swept1e18);
    emit RecallAndSweep(swept1e18);
}
```
 - Émission des frais:
```45:57:contracts/src/STRATEGY_1/VaultContract.sol
event VaultFeePaid(address indexed vault, address indexed feeVault, uint8 kind, uint256 amount1e18);
```
