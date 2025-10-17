# HYPE50 VaultContract — Dépôts HYPE (18d), NAV USD, Retraits HYPE

## Résumé
Le vault HYPE50 accepte des dépôts en HYPE (18 décimales), valorise la NAV en USD via l'oracle HYPE, et paie les retraits en HYPE. Une fraction configurable (`autoDeployBps`) du dépôt peut être auto-déployée vers Core via le handler HYPE50 qui convertit 100% des HYPE en USDC puis alloue 50/50 BTC–HYPE.

## API
- `deposit(uint256 amount1e18)` — dépôt HYPE (1e18). Parts mintées en proportion de la NAV USD.
- `withdraw(uint256 shares)` — paiement en HYPE; si la trésorerie EVM est insuffisante, mise en file et rappel via le handler.
- `setHandler(IHandler handler)` — configure l’approval HYPE illimitée vers le handler.
- `setFees(depositFeeBps, withdrawFeeBps, autoDeployBps)` — frais de dépôt, de retrait, et fraction auto-déployée.
- `setWithdrawFeeTiers(WithdrawFeeTier[])` — paliers de frais (exprimés en HYPE 1e18).

## Points clés
- NAV (USD 1e18) = HYPE EVM en USD + Equity spot Core en USD.
- Parts (`decimals=18`) restent USD-dénominées pour l’équité inter-dépôts.
- Retraits: montant brut HYPE dérivé du PPS USD courant; frais en HYPE.
- Auto-deploy: `executeDepositHype(deployAmt1e18, true)` côté handler.

## Sécurité & Invariants
- Vérification `pxH > 0` dans `deposit()` et `settleWithdraw()`.
- CEI respecté; `SafeERC20` utilisé.
- `approve(0)` puis `approve(max)` lors de `setHandler`.
- Paliers triés et bornés (≤10).
- `notPaused` sur fonctions sensibles.

## Formules
- NAV côté vault:
  - `evmHypeUsd1e18 = hype.balanceOf(this) * oraclePxHype1e8 / 1e8`
  - `nav = evmHypeUsd1e18 + handler.equitySpotUsd1e18()`
- Shares mintées:
  - `shares = depositUsd1e18` si `totalSupply == 0`, sinon `shares = depositUsd1e18 * totalSupply / navPre`
- Retraits:
  - `grossHype1e18 = (shares * pps / 1e18) * 1e8 / oraclePxHype1e8`

## Intégration
1. Déployer le handler HYPE50 (voir doc Handler HYPE50) et le vault HYPE50.
2. `vault.setHandler(handler)` — approval HYPE illimitée.
3. Configurer côté handler: `setUsdcCoreLink`, `setHypeCoreLink`, `setSpotIds`, `setSpotTokenIds`.
4. (Optionnel) Configurer frais et paliers.

## Références code
- NAV USD HYPE EVM + Core:
```126:133:contracts/src/HYPE50 Defensive/VaultContract.sol
function nav1e18() public view returns (uint256) {
    uint64 pxH = address(handler) == address(0) ? uint64(0) : handler.oraclePxHype1e8();
    uint256 evmHypeUsd1e18 = pxH == 0 ? 0 : (hype.balanceOf(address(this)) * uint256(pxH)) / 1e8;
    uint256 coreEq1e18 = address(handler) == address(0) ? 0 : handler.equitySpotUsd1e18();
    return evmHypeUsd1e18 + coreEq1e18;
}
```
- Dépôt HYPE → auto-deploy:
```154:189:contracts/src/HYPE50 Defensive/VaultContract.sol
function deposit(uint256 amount1e18) external notPaused nonReentrant {
    ...
    handler.executeDepositHype(deployAmt, true);
}
```
- Retrait HYPE et rappel si nécessaire:
```192:238:contracts/src/HYPE50 Defensive/VaultContract.sol
function withdraw(uint256 shares) external notPaused nonReentrant {
    ...
    try handler.pullHypeFromCoreToEvm(recallAmount1e8) { ... }
}
```
