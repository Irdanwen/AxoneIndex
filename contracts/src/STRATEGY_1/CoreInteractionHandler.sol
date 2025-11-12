// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {HLConstants} from "./utils/HLConstants.sol";
import {CoreHandlerLib} from "./utils/CoreHandlerLib.sol";
import {Rebalancer50Lib} from "./Rebalancer50Lib.sol";
import {SystemAddressLib} from "./utils/SystemAddressLib.sol";
import {StrategyMathLib} from "./utils/StrategyMathLib.sol";
import {L1Read} from "./interfaces/L1Read.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

interface ICoreWriter {
    function sendRawAction(bytes calldata data) external;
}

// IERC20 importé via OpenZeppelin ci-dessus

contract CoreInteractionHandler is Pausable {
    using SafeERC20 for IERC20;

    ICoreWriter public constant CORE_WRITER = ICoreWriter(0x3333333333333333333333333333333333333333);

    // Immutable system contracts
    L1Read public immutable l1read;
    IERC20 public immutable usdc;

    // Config
    address public vault;
    address public usdcCoreSystemAddress;
    uint64 public usdcCoreTokenId;
    address public hypeCoreSystemAddress;
    uint64 public hypeCoreTokenId;
    // Spot market ids (BTC/USDC and HYPE/USDC)
    uint32 public spotBTC;
    uint32 public spotHYPE;
    // Spot token ids for balances
    uint64 public spotTokenBTC;
    uint64 public spotTokenHYPE;

    // Risk params
    uint64 public maxOutboundPerEpoch;
    uint64 public epochLength;
    uint64 public lastEpochStart;
    uint64 public sentThisEpoch;
    // Blocks per epoch (assuming 12s per block)
    uint64 public constant BLOCKS_PER_EPOCH = 1; // 1 block = 12 seconds
    uint64 public maxSlippageBps; // for IOC limit price
    uint64 public marketEpsilonBps; // widen limit to mimic marketable IOC
    uint64 public deadbandBps;
    uint64 public maxOracleDeviationBps;

    uint64 public lastPxBtc1e8;
    uint64 public lastPxHype1e8;
    bool public pxInitB;
    bool public pxInitH;

    // Fees config
    address public feeVault;
    uint64 public feeBps; // out of 10_000

    // USDC reserve on Core (in bps of total equity), default 1%
    uint64 public usdcReserveBps = 100;

    event UsdcReserveSet(uint64 bps);

    error NotVault();
    error NotOwner();
    error NotRebalancer();
    error RateLimited();
    error OracleZero();
    error OracleGradualCatchup();
    error CoreAccountMissing();

    error EPOCH_0();
    error MAX_OUTBOUND_0();
    error FEE_BPS();
    error DEADBAND_TOO_HIGH();
    error BAD_DEV_BPS();
    error USDC_CORE_NOT_SET();
    error CORE_NOT_SET();
    error AMOUNT_ZERO();
    error NATIVE_SEND_FAIL();
    error RESERVE_USDC();
    error HYPE_CORE_NOT_SET();
    error FEE_VAULT();
    error NATIVE_PAY_FAIL();
    error SWEEP_FAIL();
    error FEE_SEND_FAIL();
    error INVALID_ASSET();
    error INVALID_SZ_DECIMALS();
    error NOTIONAL_LT_MIN();
    error PX_NOT_QUANTIZED();
    error PX_TOO_LOW();
    error PX_TOO_HIGH();
    error SIZE_TOO_LARGE();
    error SIZE_ZERO();
    error INVALID_TIF();
    error CLOID_TOO_LARGE();
    error MIN_NTL();
    error USDC_ID_CONFLICT();
    error BAL();

    event LimitsSet(uint64 maxOutboundPerEpoch, uint64 epochLength);
    event ParamsSet(uint64 maxSlippageBps, uint64 marketEpsilonBps, uint64 deadbandBps);
    event VaultSet(address vault);
    event UsdcCoreLinkSet(address systemAddress, uint64 tokenId);
    event SpotIdsSet(uint32 btcSpot, uint32 hypeSpot);
    event SpotTokenIdsSet(uint64 usdcToken, uint64 btcToken, uint64 hypeToken);
    event HypeCoreLinkSet(address systemAddress, uint64 tokenId);
    event OutboundToCore(bytes data);
    event InboundFromCore(uint64 amount1e8);
    event Rebalanced(int256 dBtc1e18, int256 dHype1e18);
    event SpotOrderPlaced(uint32 asset, bool isBuy, uint64 limitPx1e8, uint64 sizeSzDecimals, uint128 cloid);
    event RebalanceSkippedOracleDeviation(uint64 pxB1e8, uint64 pxH1e8);
    event DepositSkippedOracleDeviationUsdc(uint64 pxB1e8, uint64 pxH1e8);
    event DepositSkippedOracleDeviationHype(uint64 pxH1e8);
    event FeeConfigSet(address feeVault, uint64 feeBps);
    event SweepWithFee(uint64 gross1e8, uint64 fee1e8, uint64 net1e8);
    event RebalancerSet(address rebalancer);

    address public owner;
    address public rebalancer;
    // Option: rééquilibrer automatiquement après un retrait HYPE (par défaut: activé)
    bool public rebalanceAfterWithdrawal = true;

    // Seuil notional minimum (USD 1e8) pour éviter des IOC poussière
    uint64 public minNotionalUsd1e8 = 50 * 1e8;

    modifier onlyOwner(){
        if(msg.sender!=owner) revert NotOwner();
        _;
    }

    modifier onlyVault() {
        if (msg.sender != vault) revert NotVault();
        _;
    }

    modifier onlyRebalancer() {
        if (msg.sender != rebalancer) revert NotRebalancer();
        _;
    }

    constructor(L1Read _l1read, IERC20 _usdc, uint64 _maxOutboundPerEpoch, uint64 _epochLength, address _feeVault, uint64 _feeBps) {
        l1read = _l1read;
        usdc = _usdc;
        lastEpochStart = uint64(block.number);
        owner = msg.sender;
        
        // Calculer automatiquement les adresses système Core selon la documentation
        // USDC: utiliser l'adresse système calculée (sera configurée via setUsdcCoreLink)
        // HYPE: utiliser l'adresse système spéciale pour le token natif
        hypeCoreSystemAddress = SystemAddressLib.HYPE_SYSTEM_ADDRESS;
        
        if (_epochLength == 0) revert EPOCH_0();
        if (_maxOutboundPerEpoch == 0) revert MAX_OUTBOUND_0();
        epochLength = _epochLength;
        maxOutboundPerEpoch = _maxOutboundPerEpoch;
        if (maxSlippageBps == 0) maxSlippageBps = 50;
        if (marketEpsilonBps == 0) marketEpsilonBps = 10;
        deadbandBps = 50; // par défaut 0.5%
        maxOracleDeviationBps = 500; // 5%
        if (_feeBps > 10_000) revert FEE_BPS();
        feeVault = _feeVault;
        feeBps = _feeBps;
        emit FeeConfigSet(_feeVault, _feeBps);
    }

    receive() external payable {}

    // Admin setters (to be called by deployer/owner offchain in this sample; add auth as needed)
    function setVault(address _vault) external onlyOwner {
        vault = _vault;
        emit VaultSet(_vault);
    }

    function setUsdcCoreLink(address systemAddr, uint64 tokenId) external onlyOwner {
        // Si systemAddr est fourni, l'utiliser, sinon calculer automatiquement
        if (systemAddr == address(0)) {
            systemAddr = SystemAddressLib.getSpotSystemAddress(tokenId);
        }
        usdcCoreSystemAddress = systemAddr;
        usdcCoreTokenId = tokenId;
        emit UsdcCoreLinkSet(systemAddr, tokenId);
    }

    function setHypeCoreLink(address systemAddr, uint64 tokenId) external onlyOwner {
        hypeCoreSystemAddress = systemAddr;
        hypeCoreTokenId = tokenId;
        emit HypeCoreLinkSet(systemAddr, tokenId);
    }

    function setSpotIds(uint32 btcSpot, uint32 hypeSpot) external onlyOwner {
        spotBTC = btcSpot;
        spotHYPE = hypeSpot;
        emit SpotIdsSet(btcSpot, hypeSpot);
    }

    function setSpotTokenIds(uint64 usdcToken, uint64 btcToken, uint64 hypeToken) external onlyOwner {
        if (usdcCoreTokenId == 0) {
            usdcCoreTokenId = usdcToken;
        } else {
            if (usdcToken != usdcCoreTokenId) revert USDC_ID_CONFLICT();
        }
        spotTokenBTC = btcToken;
        spotTokenHYPE = hypeToken;
        emit SpotTokenIdsSet(usdcToken, btcToken, hypeToken);
    }

    function setLimits(uint64 _maxOutboundPerEpoch, uint64 _epochLength) external onlyOwner {
        if (_epochLength == 0) revert EPOCH_0();
        if (_maxOutboundPerEpoch == 0) revert MAX_OUTBOUND_0();
        maxOutboundPerEpoch = _maxOutboundPerEpoch;
        epochLength = _epochLength;
        emit LimitsSet(_maxOutboundPerEpoch, _epochLength);
    }

    function setParams(uint64 _maxSlippageBps, uint64 _marketEpsilonBps, uint64 _deadbandBps) external onlyOwner {
        if (_deadbandBps > 50) revert DEADBAND_TOO_HIGH();
        maxSlippageBps = _maxSlippageBps;
        marketEpsilonBps = _marketEpsilonBps;
        deadbandBps = _deadbandBps;
        emit ParamsSet(_maxSlippageBps, _marketEpsilonBps, _deadbandBps);
    }

    function setMaxOracleDeviationBps(uint64 _maxDeviationBps) external onlyOwner {
        if (!(_maxDeviationBps > 0 && _maxDeviationBps <= 5000)) revert BAD_DEV_BPS();
        maxOracleDeviationBps = _maxDeviationBps;
    }

    function setFeeConfig(address _feeVault, uint64 _feeBps) external onlyOwner {
        if (_feeBps > 10_000) revert FEE_BPS();
        feeVault = _feeVault;
        feeBps = _feeBps;
        emit FeeConfigSet(_feeVault, _feeBps);
    }

    function setUsdcReserveBps(uint64 bps) external onlyOwner {
        if (bps > 1_000) revert DEADBAND_TOO_HIGH();
        usdcReserveBps = bps;
        emit UsdcReserveSet(bps);
    }

    function setRebalancer(address _rebalancer) external onlyOwner {
        rebalancer = _rebalancer;
        emit RebalancerSet(_rebalancer);
    }

    /// @notice Active/désactive le rééquilibrage automatique après retrait HYPE
    function setRebalanceAfterWithdrawal(bool v) external onlyOwner {
        rebalanceAfterWithdrawal = v;
    }

    /// @notice Définit le notional minimal (USD en 1e8)
    function setMinNotionalUsd1e8(uint64 v) external onlyOwner {
        if (v == 0) revert MIN_NTL();
        minNotionalUsd1e8 = v;
    }

    /// @notice Pause all critical operations in case of emergency
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause all operations
    function unpause() external onlyOwner {
        _unpause();
    }

    // Views (spot)
    function spotBalance(address coreUser, uint64 tokenId) public view returns (uint64) {
        L1Read.SpotBalance memory b = l1read.spotBalance(coreUser, tokenId);
        return b.total;
    }

    /// @notice Get spot balance converted to wei decimals
    /// @dev Converts SpotBalance.total from szDecimals to weiDecimals format
    /// @param coreUser The user address
    /// @param tokenId The token ID
    /// @return balanceInWei The balance converted to wei decimals (uint256 for precision)
    function spotBalanceInWei(address coreUser, uint64 tokenId) internal view returns (uint256) {
        return CoreHandlerLib.spotBalanceInWei(l1read, coreUser, tokenId);
    }

    function spotOraclePx1e8(uint32 spotAsset) public view returns (uint64) {
        uint64 raw = l1read.spotPx(spotAsset);
        if (raw == 0) revert OracleZero();
        return _toPx1e8(spotAsset, raw);
    }

    // Public oracle getters for vault accounting
    function oraclePxHype1e8() external view returns (uint64) {
        return spotOraclePx1e8(spotHYPE);
    }

    function oraclePxBtc1e8() external view returns (uint64) {
        return spotOraclePx1e8(spotBTC);
    }

    function equitySpotUsd1e18() public view returns (uint256) {
        // Core spot equity only. EVM USDC est compté dans le Vault.
        // CORRECTION AUDIT: Utilisation de spotBalanceInWei pour conversion correcte szDecimals -> weiDecimals
        uint256 usdcBalWei = spotBalanceInWei(address(this), usdcCoreTokenId);
        uint256 btcBalWei = spotBalanceInWei(address(this), spotTokenBTC);
        uint256 hypeBalWei = spotBalanceInWei(address(this), spotTokenHYPE);

        uint256 pxB1e8 = spotOraclePx1e8(spotBTC);
        uint256 pxH1e8 = spotOraclePx1e8(spotHYPE);

        // Récupération des infos de décimales pour chaque token
        L1Read.TokenInfo memory usdcInfo = l1read.tokenInfo(uint32(usdcCoreTokenId));
        L1Read.TokenInfo memory btcInfo = l1read.tokenInfo(uint32(spotTokenBTC));
        L1Read.TokenInfo memory hypeInfo = l1read.tokenInfo(uint32(spotTokenHYPE));

        // Conversion USDC: balanceWei * 10^(18 - weiDecimals)
        uint256 usdc1e18 = usdcBalWei * (10 ** (18 - usdcInfo.weiDecimals));
        
        // Conversion assets: valueUsd1e18 = (balanceWei / 10^weiDecimals) * (price1e8 / 10^8) * 10^18
        // Simplifié: balanceWei * price1e8 * 10^(18 - weiDecimals - 8)
        uint256 btcUsd1e18;
        uint256 hypeUsd1e18;
        
        if (btcInfo.weiDecimals + 8 <= 18) {
            btcUsd1e18 = btcBalWei * pxB1e8 * (10 ** (18 - btcInfo.weiDecimals - 8));
        } else {
            btcUsd1e18 = (btcBalWei * pxB1e8) / (10 ** (btcInfo.weiDecimals + 8 - 18));
        }
        
        if (hypeInfo.weiDecimals + 8 <= 18) {
            hypeUsd1e18 = hypeBalWei * pxH1e8 * (10 ** (18 - hypeInfo.weiDecimals - 8));
        } else {
            hypeUsd1e18 = (hypeBalWei * pxH1e8) / (10 ** (hypeInfo.weiDecimals + 8 - 18));
        }
        
        return usdc1e18 + btcUsd1e18 + hypeUsd1e18;
    }

    // Core flows
    function executeDeposit(uint64 usdc1e8, bool forceRebalance) external onlyVault whenNotPaused {
        if (usdcCoreSystemAddress == address(0)) revert USDC_CORE_NOT_SET();
        _rateLimit(usdc1e8);
        // Pull USDC from vault to handler (EVM token has 8 decimals => 1:1)
        uint256 evmAmt = uint256(usdc1e8);
        usdc.safeTransferFrom(msg.sender, address(this), evmAmt);
        // EVM->Core spot: send to system address to credit Core spot balance
        usdc.safeTransfer(usdcCoreSystemAddress, evmAmt);
        // After crediting USDC spot, try to place two IOC buys ~50/50 into BTC and HYPE
        // Tolerant oracle: if deviated, skip orders without reverting
        uint256 usd1e18 = uint256(usdc1e8) * 1e10;
        uint256 allocUsd1e18 = (usd1e18 * (10_000 - usdcReserveBps)) / 10_000;
        uint256 halfUsd1e18 = allocUsd1e18 / 2;
        (uint64 pxB, bool devB) = _tryValidatedOraclePx1e8(true);
        (uint64 pxH, bool devH) = _tryValidatedOraclePx1e8(false);
        if (devB || devH) {
            emit DepositSkippedOracleDeviationUsdc(pxB, pxH);
            return;
        }
        uint64 szB = CoreHandlerLib.toSzInSzDecimals(l1read, spotTokenBTC, int256(halfUsd1e18), pxB);
        uint64 szH = CoreHandlerLib.toSzInSzDecimals(l1read, spotTokenHYPE, int256(halfUsd1e18), pxH);
        if (szB > 0) {
            uint64 pxBLimit = _marketLimitFromBbo(spotBTC, true);
            _sendSpotLimitOrderDirect(spotBTC, true, pxBLimit, szB, 0);
            emit SpotOrderPlaced(spotBTC, true, pxBLimit, szB, 0);
        }
        if (szH > 0) {
            uint64 pxHLimit = _marketLimitFromBbo(spotHYPE, true);
            _sendSpotLimitOrderDirect(spotHYPE, true, pxHLimit, szH, 0);
            emit SpotOrderPlaced(spotHYPE, true, pxHLimit, szH, 0);
        }
        if (forceRebalance) {
            _rebalance(0, 0);
        }
    }

    // HYPE deposit (native): move HYPE to Core, sell all to USDC, then allocate 50/50 BTC/HYPE
    function executeDepositHype(bool forceRebalance) external payable onlyVault whenNotPaused {
        if (!(hypeCoreSystemAddress != address(0) && usdcCoreSystemAddress != address(0))) revert CORE_NOT_SET();
        uint256 hype1e18 = msg.value;
        if (hype1e18 == 0) revert AMOUNT_ZERO();
        // EVM->Core spot: send native HYPE to system address to credit Core spot balance
        (bool ok, ) = payable(hypeCoreSystemAddress).call{value: hype1e18}("");
        if (!ok) revert NATIVE_SEND_FAIL();
        // Compute USD notional and sell HYPE -> USDC on Core via IOC
        (uint64 pxH, bool devH) = _tryValidatedOraclePx1e8(false);
        // USD 1e8 = (HYPE 1e18 / 1e18) * px1e8
        uint64 usd1e8 = SafeCast.toUint64((hype1e18 * uint256(pxH)) / 1e18);
        // Apply outbound rate limit based on USD notional like USDC deposit (even if deviated)
        _rateLimit(usd1e8);
        if (devH) {
            emit DepositSkippedOracleDeviationHype(pxH);
            return;
        }
        // Sell HYPE -> USDC on Core via IOC
        _sellAssetForUsd(spotHYPE, spotTokenHYPE, usd1e8);
        // Allocate 50/50 from USDC to BTC/HYPE
        uint256 totalUsd1e18 = uint256(usd1e8) * 1e10;
        uint256 allocUsd1e18 = (totalUsd1e18 * (10_000 - usdcReserveBps)) / 10_000;
        uint256 halfUsd1e18 = allocUsd1e18 / 2;
        (uint64 pxB, bool devB) = _tryValidatedOraclePx1e8(true);
        if (devB) {
            emit DepositSkippedOracleDeviationHype(pxH);
            return;
        }
        uint64 szB = CoreHandlerLib.toSzInSzDecimals(l1read, spotTokenBTC, int256(halfUsd1e18), pxB);
        uint64 szH = CoreHandlerLib.toSzInSzDecimals(l1read, spotTokenHYPE, int256(halfUsd1e18), pxH);
        if (szB > 0) {
            uint64 pxBLimit = _marketLimitFromBbo(spotBTC, true);
            _sendSpotLimitOrderDirect(spotBTC, true, pxBLimit, szB, 0);
            emit SpotOrderPlaced(spotBTC, true, pxBLimit, szB, 0);
        }
        if (szH > 0) {
            uint64 pxHLimit = _marketLimitFromBbo(spotHYPE, true);
            _sendSpotLimitOrderDirect(spotHYPE, true, pxHLimit, szH, 0);
            emit SpotOrderPlaced(spotHYPE, true, pxHLimit, szH, 0);
        }
        if (forceRebalance) {
            _rebalance(0, 0);
        }
    }

    function pullFromCoreToEvm(uint64 usdc1e8) external onlyVault whenNotPaused returns (uint64) {
        if (usdcCoreSystemAddress == address(0)) revert USDC_CORE_NOT_SET();
        // Ensure enough USDC spot by selling BTC/HYPE via IOC if needed, while preserving reserve
        L1Read.TokenInfo memory usdcInfo = l1read.tokenInfo(uint32(usdcCoreTokenId));
        uint256 usdcBalWei = spotBalanceInWei(address(this), usdcCoreTokenId);
        uint256 usdcBal1e8 = _weiToMantissa1e8(usdcBalWei, usdcInfo.weiDecimals);
        if (usdcBal1e8 < usdc1e8) {
            uint256 shortfall1e8 = uint256(usdc1e8) - usdcBal1e8;
            // Try to sell BTC first, then HYPE
            _sellAssetForUsd(spotBTC, spotTokenBTC, shortfall1e8);
            // Refresh balance and compute remaining
            usdcBalWei = spotBalanceInWei(address(this), usdcCoreTokenId);
            usdcBal1e8 = _weiToMantissa1e8(usdcBalWei, usdcInfo.weiDecimals);
            if (usdcBal1e8 < usdc1e8) {
                _sellAssetForUsd(spotHYPE, spotTokenHYPE, uint256(usdc1e8) - usdcBal1e8);
            }
        }
        // Reserve enforcement (post-adjustment): do not allow withdrawal that breaches reserve
        {
            uint256 equity1e18 = equitySpotUsd1e18();
            uint256 reserve1e8 = ((equity1e18 * uint256(usdcReserveBps)) / 10_000) / 1e10;
            uint256 refreshedBal1e8 = _weiToMantissa1e8(
                spotBalanceInWei(address(this), usdcCoreTokenId),
                usdcInfo.weiDecimals
            );
            if (!(refreshedBal1e8 >= reserve1e8 + usdc1e8)) revert RESERVE_USDC();
        }
        // Spot send to credit EVM
        uint256 sendWei = _mantissa1e8ToWei(usdc1e8, usdcInfo.weiDecimals);
        _send(
            CoreHandlerLib.encodeSpotSend(
                usdcCoreSystemAddress,
                usdcCoreTokenId,
                SafeCast.toUint64(sendWei)
            )
        );
        emit InboundFromCore(usdc1e8);
        return usdc1e8;
    }

    // Ensure enough HYPE on Core (sell BTC for USDC if needed, then buy HYPE), then send to EVM and optionally rebalance back to 50/50
    function pullHypeFromCoreToEvm(uint64 hype1e8) external onlyVault whenNotPaused returns (uint64) {
        if (hypeCoreSystemAddress == address(0)) revert HYPE_CORE_NOT_SET();
        L1Read.TokenInfo memory hypeInfo = l1read.tokenInfo(uint32(hypeCoreTokenId));
        uint256 hypeBalWei = spotBalanceInWei(address(this), hypeCoreTokenId);
        uint256 hypeBal1e8 = _weiToMantissa1e8(hypeBalWei, hypeInfo.weiDecimals);
        if (hypeBal1e8 < hype1e8) {
            uint256 shortfallH1e8 = uint256(hype1e8) - hypeBal1e8;
            // Prix HYPE normalisé 1e8
            uint64 pxH1e8 = _validatedOraclePx1e8(false);
            // USD nécessaire en 1e8 pour couvrir le shortfall en HYPE: shortfallH1e8 * pxH / 1e8
            uint256 usdNeed1e8 = (shortfallH1e8 * uint256(pxH1e8)) / 1e8;
            // Calculer la réserve USDC requise en unités 1e8 (USDC)
            uint256 equity1e18_r = equitySpotUsd1e18();
            uint256 reserve1e8 = ((equity1e18_r * uint256(usdcReserveBps)) / 10_000) / 1e10;
            // S'assurer d'abord d'avoir assez d'USDC pour usdNeed + réserve, en vendant BTC puis HYPE si nécessaire
            L1Read.TokenInfo memory usdcInfo = l1read.tokenInfo(uint32(usdcCoreTokenId));
            uint256 usdcBalWei = spotBalanceInWei(address(this), usdcCoreTokenId);
            uint256 usdcBal1e8 = _weiToMantissa1e8(usdcBalWei, usdcInfo.weiDecimals);
            uint256 targetUsdc1e8 = uint256(usdNeed1e8) + reserve1e8;
            if (usdcBal1e8 < targetUsdc1e8) {
                uint256 deficit1e8 = targetUsdc1e8 - usdcBal1e8;
                if (deficit1e8 > 0) {
                    _sellAssetForUsd(spotBTC, spotTokenBTC, deficit1e8);
                }
                // Refresh après vente BTC
                usdcBal1e8 = _weiToMantissa1e8(
                    spotBalanceInWei(address(this), usdcCoreTokenId),
                    usdcInfo.weiDecimals
                );
                if (usdcBal1e8 < targetUsdc1e8) {
                    uint256 stillShort1e8 = targetUsdc1e8 - usdcBal1e8;
                    // En dernier recours, vendre du HYPE côté Core (peut réduire légèrement la cible mais assure la liquidité)
                    _sellAssetForUsd(spotHYPE, spotTokenHYPE, stillShort1e8);
                }
            }
            // Acheter le HYPE manquant via IOC spot en utilisant usdNeed1e8 (converti en 1e18 pour la conversion taille)
            uint256 usdNeed1e18 = usdNeed1e8 * 1e10;
            uint64 szBuyH = CoreHandlerLib.toSzInSzDecimals(l1read, spotTokenHYPE, int256(usdNeed1e18), pxH1e8);
            if (szBuyH > 0) {
                uint64 pxBuyLimit = _marketLimitFromBbo(spotHYPE, true);
                _sendSpotLimitOrderDirect(spotHYPE, true, pxBuyLimit, szBuyH, 0);
                emit SpotOrderPlaced(spotHYPE, true, pxBuyLimit, szBuyH, 0);
            }
        }
        // Spot send to credit EVM HYPE
        uint256 sendWei = _mantissa1e8ToWei(hype1e8, hypeInfo.weiDecimals);
        _send(
            CoreHandlerLib.encodeSpotSend(
                hypeCoreSystemAddress,
                hypeCoreTokenId,
                SafeCast.toUint64(sendWei)
            )
        );
        emit InboundFromCore(hype1e8);
        // Optionnel: rééquilibrer après le retrait pour revenir vers 50/50
        if (rebalanceAfterWithdrawal) {
            _rebalance(0, 0);
        }
        return hype1e8;
    }

    function sweepToVault(uint64 amount1e8) external onlyVault whenNotPaused {
        if (amount1e8 == 0) {
            return;
        }
        uint64 feeAmt1e8 = 0;
        if (feeBps > 0) {
            if (feeVault == address(0)) revert FEE_VAULT();
            feeAmt1e8 = uint64((uint256(amount1e8) * uint256(feeBps)) / 10_000);
            if (feeAmt1e8 > 0) {
                bool ok = usdc.transfer(feeVault, uint256(feeAmt1e8));
                if (!ok) revert SWEEP_FAIL();
            }
        }
        uint64 net1e8 = amount1e8 - feeAmt1e8;
        bool ok2 = usdc.transfer(vault, uint256(net1e8));
        if (!ok2) revert SWEEP_FAIL();
        emit SweepWithFee(amount1e8, feeAmt1e8, net1e8);
    }

    // Sweep native HYPE held on EVM from handler to vault, applying feeBps in HYPE
    function sweepHypeToVault(uint256 amount1e18) external onlyVault whenNotPaused {
        if (amount1e18 == 0) return;
        if (!(address(this).balance >= amount1e18)) revert BAL();
        uint256 feeAmt = 0;
        if (feeBps > 0) {
            if (feeVault == address(0)) revert FEE_VAULT();
            feeAmt = (amount1e18 * uint256(feeBps)) / 10_000;
            if (feeAmt > 0) {
                (bool f, ) = payable(feeVault).call{value: feeAmt}("");
                if (!f) revert FEE_SEND_FAIL();
            }
        }
        uint256 net = amount1e18 - feeAmt;
        (bool s, ) = payable(vault).call{value: net}("");
        if (!s) revert SWEEP_FAIL();
        uint64 gross1e8 = SafeCast.toUint64(amount1e18 / 1e10);
        uint64 fee1e8 = SafeCast.toUint64(feeAmt / 1e10);
        uint64 net1e8 = SafeCast.toUint64(net / 1e10);
        emit SweepWithFee(gross1e8, fee1e8, net1e8);
    }

    function rebalancePortfolio(uint128 cloidBtc, uint128 cloidHype) public onlyRebalancer whenNotPaused {
        _rebalance(cloidBtc, cloidHype);
    }

    function _rebalance(uint128 cloidBtc, uint128 cloidHype) internal {
        (uint64 pxB, bool devB) = _tryValidatedOraclePx1e8(true);
        (uint64 pxH, bool devH) = _tryValidatedOraclePx1e8(false);
        if (devB || devH) {
            emit RebalanceSkippedOracleDeviation(pxB, pxH);
            return;
        }
        (int256 dB, int256 dH) = _computeDeltasWithPositions(pxB, pxH);
        _placeRebalanceOrders(dB, dH, pxB, pxH, cloidBtc, cloidHype);
        emit Rebalanced(dB, dH);
    }

    function _computeDeltasWithPositions(uint64 pxB, uint64 pxH) internal view returns (int256 dB, int256 dH) {
        // Balances spot convertis en weiDecimals
        uint256 usdcBalWei = spotBalanceInWei(address(this), usdcCoreTokenId);
        uint256 btcBalWei = spotBalanceInWei(address(this), spotTokenBTC);
        uint256 hypeBalWei = spotBalanceInWei(address(this), spotTokenHYPE);

        // Infos de décimales pour conversion de valorisation
        L1Read.TokenInfo memory usdcInfo = l1read.tokenInfo(uint32(usdcCoreTokenId));
        L1Read.TokenInfo memory btcInfo = l1read.tokenInfo(uint32(spotTokenBTC));
        L1Read.TokenInfo memory hypeInfo = l1read.tokenInfo(uint32(spotTokenHYPE));

        // USDC en 1e18
        uint256 usdc1e18 = usdcBalWei * (10 ** (18 - usdcInfo.weiDecimals));

        // Positions en USD 1e18
        int256 posB1e18;
        int256 posH1e18;
        if (btcInfo.weiDecimals + 8 <= 18) {
            posB1e18 = int256(btcBalWei * uint256(pxB) * (10 ** (18 - btcInfo.weiDecimals - 8)));
        } else {
            posB1e18 = int256((btcBalWei * uint256(pxB)) / (10 ** (btcInfo.weiDecimals + 8 - 18)));
        }
        if (hypeInfo.weiDecimals + 8 <= 18) {
            posH1e18 = int256(hypeBalWei * uint256(pxH) * (10 ** (18 - hypeInfo.weiDecimals - 8)));
        } else {
            posH1e18 = int256((hypeBalWei * uint256(pxH)) / (10 ** (hypeInfo.weiDecimals + 8 - 18)));
        }

        uint256 equity1e18 = usdc1e18 + uint256(posB1e18) + uint256(posH1e18);
        uint256 targetEquity1e18 = (equity1e18 * (10_000 - usdcReserveBps)) / 10_000;
        (dB, dH) = Rebalancer50Lib.computeDeltas(targetEquity1e18, posB1e18, posH1e18, deadbandBps);
    }

    function _placeRebalanceOrders(
        int256 dB,
        int256 dH,
        uint64 /*pxB*/,
        uint64 /*pxH*/,
        uint128 cloidBtc,
        uint128 cloidHype
    ) internal {
        bool buyB = dB > 0;
        bool buyH = dH > 0;
        bool hasSell = false;

        // 1) Ventes d'abord (génèrent l'USDC nécessaire)
        if (!buyH && dH != 0) {
            uint64 pxHLimitSell = _marketLimitFromBbo(spotHYPE, false);
            uint64 szHSell = CoreHandlerLib.toSzInSzDecimals(l1read, spotTokenHYPE, dH, pxHLimitSell);
            if (szHSell > 0) {
                hasSell = true;
                _sendSpotLimitOrderDirect(spotHYPE, false, pxHLimitSell, szHSell, cloidHype);
                emit SpotOrderPlaced(spotHYPE, false, pxHLimitSell, szHSell, cloidHype);
            }
        }
        if (!buyB && dB != 0) {
            uint64 pxBLimitSell = _marketLimitFromBbo(spotBTC, false);
            uint64 szBSell = CoreHandlerLib.toSzInSzDecimals(l1read, spotTokenBTC, dB, pxBLimitSell);
            if (szBSell > 0) {
                hasSell = true;
                _sendSpotLimitOrderDirect(spotBTC, false, pxBLimitSell, szBSell, cloidBtc);
                emit SpotOrderPlaced(spotBTC, false, pxBLimitSell, szBSell, cloidBtc);
            }
        }

        // 2) Achats ensuite
        // Cas où aucun ordre de vente n'est nécessaire: on plafonne l'achat à l'USDC disponible pour éviter un échec IOC
        if (buyB && dB != 0) {
            int256 dBToUse = dB;
            if (!hasSell) {
                // Limiter l'achat au solde USDC disponible (1e8) converti en 1e18
                L1Read.TokenInfo memory usdcInfoBuy = l1read.tokenInfo(uint32(usdcCoreTokenId));
                uint256 usdcBalWeiBuy = spotBalanceInWei(address(this), usdcCoreTokenId);
                uint256 usdcBal1e8 = _weiToMantissa1e8(usdcBalWeiBuy, usdcInfoBuy.weiDecimals);
                uint256 maxUsd1e18 = usdcBal1e8 * 1e10;
                uint256 needUsd1e18 = uint256(dBToUse);
                if (needUsd1e18 > maxUsd1e18) {
                    dBToUse = int256(maxUsd1e18); // réduire la taille cible
                }
            }
            uint64 pxBLimitBuy = _marketLimitFromBbo(spotBTC, true);
            uint64 szBbuy = CoreHandlerLib.toSzInSzDecimals(l1read, spotTokenBTC, dBToUse, pxBLimitBuy);
            if (szBbuy > 0) {
                _sendSpotLimitOrderDirect(spotBTC, true, pxBLimitBuy, szBbuy, cloidBtc);
                emit SpotOrderPlaced(spotBTC, true, pxBLimitBuy, szBbuy, cloidBtc);
            }
        }

        if (buyH && dH != 0) {
            int256 dHToUse = dH;
            if (!hasSell) {
                L1Read.TokenInfo memory usdcInfoBuy = l1read.tokenInfo(uint32(usdcCoreTokenId));
                uint256 usdcBalWeiBuy = spotBalanceInWei(address(this), usdcCoreTokenId);
                uint256 usdcBal1e8 = _weiToMantissa1e8(usdcBalWeiBuy, usdcInfoBuy.weiDecimals);
                uint256 maxUsd1e18 = usdcBal1e8 * 1e10;
                uint256 needUsd1e18 = uint256(dHToUse);
                if (needUsd1e18 > maxUsd1e18) {
                    dHToUse = int256(maxUsd1e18);
                }
            }
            uint64 pxHLimitBuy = _marketLimitFromBbo(spotHYPE, true);
            uint64 szHbuy = CoreHandlerLib.toSzInSzDecimals(l1read, spotTokenHYPE, dHToUse, pxHLimitBuy);
            if (szHbuy > 0) {
                _sendSpotLimitOrderDirect(spotHYPE, true, pxHLimitBuy, szHbuy, cloidHype);
                emit SpotOrderPlaced(spotHYPE, true, pxHLimitBuy, szHbuy, cloidHype);
            }
        }
    }

    // Internal utils
    function _limitFromOracle(uint64 oraclePx1e8, bool isBuy) internal view returns (uint64) {
        return CoreHandlerLib.limitFromOracle(oraclePx1e8, isBuy, maxSlippageBps, marketEpsilonBps);
    }

    function _spotBboPx1e8(uint32 spotAsset) internal view returns (uint64 bid1e8, uint64 ask1e8) {
        uint32 assetId = spotAsset + HLConstants.SPOT_ASSET_OFFSET;
        L1Read.Bbo memory b = l1read.bbo(assetId);
        uint8 pxDec = _spotPxDecimals(spotAsset);
        bid1e8 = StrategyMathLib.scalePxTo1e8(b.bid, pxDec);
        ask1e8 = StrategyMathLib.scalePxTo1e8(b.ask, pxDec);
    }

    function _baseSzDecimals(uint32 asset) internal view returns (uint8) {
        uint64 baseTokenId;
        if (asset == spotBTC && spotTokenBTC != 0) {
            baseTokenId = spotTokenBTC;
        } else if (asset == spotHYPE && spotTokenHYPE != 0) {
            baseTokenId = spotTokenHYPE;
        } else {
            L1Read.SpotInfo memory info = l1read.spotInfo(asset);
            baseTokenId = info.tokens[0];
        }
        if (baseTokenId == 0) return 0;
        L1Read.TokenInfo memory baseInfo = l1read.tokenInfo(uint32(baseTokenId));
        return baseInfo.szDecimals;
    }

    /// @notice Clamp prix 1e8: ≤5 sig figs et ≤ (8 - szDecimals) décimales. BUY: ceil, SELL: floor.
    function _marketLimitFromBbo(uint32 asset, bool isBuy) internal view returns (uint64) {
        (uint64 bid1e8, uint64 ask1e8) = _spotBboPx1e8(asset);
        if (bid1e8 == 0 || ask1e8 == 0) {
            // Fallback sur l'oracle normalisé si BBO indisponible
            uint64 oracle = spotOraclePx1e8(asset);
            return _limitFromOracleQuantized(asset, oracle, isBuy);
        }
        uint8 baseSzDec = _baseSzDecimals(asset);
        return StrategyMathLib.marketLimitFromBbo(bid1e8, ask1e8, baseSzDec, marketEpsilonBps, isBuy);
    }

    function _limitFromOracleQuantized(uint32 asset, uint64 oraclePx1e8, bool isBuy) internal view returns (uint64) {
        uint8 baseSzDec = _baseSzDecimals(asset);
        return StrategyMathLib.limitFromOracleQuantized(oraclePx1e8, baseSzDec, maxSlippageBps, marketEpsilonBps, isBuy);
    }

    function snapToLot(uint64 sizeSz, uint8 /*szDecimals*/) internal pure returns (uint64) {
        // Les tailles sont déjà exprimées en unités d'entier alignées sur szDecimals
        return sizeSz;
    }

    function _assertOrder(uint32 asset, bool isBuy, uint64 limitPx1e8, uint64 szInSzDecimals) internal view {
        if (limitPx1e8 == 0) revert PX_TOO_LOW();
        if (szInSzDecimals == 0) revert SIZE_TOO_LARGE();
        
        // Validation de l'asset selon la documentation
        if (!(asset == spotBTC || asset == spotHYPE)) revert INVALID_ASSET();
        
        uint8 szDec = _baseSzDecimals(asset);
        if (szDec == 0) revert INVALID_SZ_DECIMALS();
        
        if (!StrategyMathLib.checkMinNotional(limitPx1e8, szInSzDecimals, szDec, minNotionalUsd1e8)) revert NOTIONAL_LT_MIN();
        uint64 qpx = StrategyMathLib.quantizePx1e8(limitPx1e8, szDec, isBuy);
        if (qpx != limitPx1e8) revert PX_NOT_QUANTIZED();
        
        // Validation supplémentaire
        if (limitPx1e8 < 1) revert PX_TOO_LOW();
        if (limitPx1e8 > 1e12) revert PX_TOO_HIGH();
        if (szInSzDecimals > 1e15) revert SIZE_TOO_LARGE();
    }

    function _spotPxDecimals(uint32 spotIndex) internal view returns (uint8) {
        return _derivedSpotPxDecimals(spotIndex);
    }

    function _derivedSpotPxDecimals(uint32 spotIndex) internal view returns (uint8) {
        L1Read.SpotInfo memory info = l1read.spotInfo(spotIndex);
        uint64 baseTokenId = info.tokens[0];
        if (baseTokenId == 0) {
            // Fallback conservateur: Hyperliquid documente des prix au moins en 1e6.
            return 8;
        }
        L1Read.TokenInfo memory tokenInfo = l1read.tokenInfo(uint32(baseTokenId));
        if (tokenInfo.szDecimals >= 8) {
            return 0;
        }
        uint8 priceDecimals = uint8(8 - tokenInfo.szDecimals);
        return priceDecimals;
    }

    function _toPx1e8(uint32 spotIndex, uint64 rawPx) internal view returns (uint64) {
        uint8 pxDec = _spotPxDecimals(spotIndex);
        return StrategyMathLib.scalePxTo1e8(rawPx, pxDec);
    }

    function _toSz1e8(int256 deltaUsd1e18, uint64 price1e8) internal pure returns (uint64) {
        return CoreHandlerLib.toSz1e8(deltaUsd1e18, price1e8);
    }

    function _sellAssetForUsd(uint32 spotAsset, uint64 /*tokenId*/, uint256 targetUsd1e8) internal {
        if (targetUsd1e8 == 0) return;
        uint64 px = spotOraclePx1e8(spotAsset);
        // Convert target USD to base size 1e8
        uint256 targetUsd1e18 = targetUsd1e8 * 1e10;
        uint64 spotTokenId = spotAsset == spotBTC ? spotTokenBTC : spotTokenHYPE;
        uint64 szBase = CoreHandlerLib.toSzInSzDecimals(l1read, spotTokenId, int256(targetUsd1e18), px);
        if (szBase == 0) return;
        // Sell with lower bound price
        uint64 pxLimit = _marketLimitFromBbo(spotAsset, false);
        _sendSpotLimitOrderDirect(spotAsset, false, pxLimit, szBase, 0);
    }

    function _send(bytes memory data) internal {
        _ensureCoreAccountExists();
        CORE_WRITER.sendRawAction(data);
        emit OutboundToCore(data);
    }
    function _ensureCoreAccountExists() internal view {
        if (!l1read.coreUserExists(address(this)).exists) revert CoreAccountMissing();
    }

    function _mantissa1e8ToWei(uint64 amount1e8, uint8 weiDecimals) internal pure returns (uint256) {
        return StrategyMathLib.mantissa1e8ToWei(amount1e8, weiDecimals);
    }

    /// @notice Convertit wei en mantissa 1e8 avec gestion de la perte de précision
    /// @dev Utilise un arrondi vers le bas pour éviter les reverts
    function _weiToMantissa1e8(uint256 amountWei, uint8 weiDecimals) internal pure returns (uint256) {
        return StrategyMathLib.weiToMantissa1e8(amountWei, weiDecimals);
    }

    /// @notice Convertit mantissa 1e8 en wei avec validation améliorée
    /// @dev Gère les cas de perte de précision avec arrondi sécurisé
    function _mantissa1e8ToWeiSafe(uint64 amount1e8, uint8 weiDecimals) internal pure returns (uint256) {
        if (amount1e8 == 0) return 0;
        
        if (weiDecimals >= 8) {
            uint256 factor = 10 ** uint256(weiDecimals - 8);
            uint256 result = uint256(amount1e8) * factor;
            // Protection contre l'overflow
            require(result / factor == uint256(amount1e8), "overflow");
            return result;
        } else {
            uint256 divisor = 10 ** uint256(8 - weiDecimals);
            return uint256(amount1e8) / divisor; // Arrondi vers le bas (safe)
        }
    }

    /// @notice Calcule la perte de précision lors de la conversion wei -> mantissa 1e8
    /// @dev Utilisé pour le logging et le debugging
    function _calculateWeiToMantissaLoss(uint256 amountWei, uint8 weiDecimals) internal pure returns (uint256 loss) {
        if (amountWei == 0 || weiDecimals < 8) return 0;
        
        uint256 divisor = 10 ** uint256(weiDecimals - 8);
        uint256 remainder = amountWei % divisor;
        return remainder; // Perte due à la division
    }

    function _rateLimit(uint64 amount1e8) internal {
        if (amount1e8 == 0) return;
        uint64 currentBlock = uint64(block.number);
        if (currentBlock - lastEpochStart >= epochLength) {
            lastEpochStart = currentBlock;
            sentThisEpoch = 0;
        }
        if (sentThisEpoch + amount1e8 > maxOutboundPerEpoch) revert RateLimited();
        sentThisEpoch += amount1e8;
    }

    function _validatedOraclePx1e8(bool isBtc) internal returns (uint64) {
        uint32 asset = isBtc ? spotBTC : spotHYPE;
        uint64 raw = l1read.spotPx(asset);
        if (raw == 0) revert OracleZero();
        uint64 px1e8 = _toPx1e8(asset, raw);

        uint64 last = isBtc ? lastPxBtc1e8 : lastPxHype1e8;
        bool init = isBtc ? pxInitB : pxInitH;
        if (init && last != 0) {
            uint256 up = uint256(last) * (10_000 + uint256(maxOracleDeviationBps)) / 10_000;
            uint256 down = uint256(last) * (10_000 - uint256(maxOracleDeviationBps)) / 10_000;
            if (uint256(px1e8) > up) {
                uint64 adj = uint64(up);
                if (isBtc) { lastPxBtc1e8 = adj; pxInitB = true; } else { lastPxHype1e8 = adj; pxInitH = true; }
                revert OracleGradualCatchup();
            }
            if (uint256(px1e8) < down) {
                uint64 adj = uint64(down);
                if (isBtc) { lastPxBtc1e8 = adj; pxInitB = true; } else { lastPxHype1e8 = adj; pxInitH = true; }
                revert OracleGradualCatchup();
            }
        }

        if (isBtc) { lastPxBtc1e8 = px1e8; pxInitB = true; } else { lastPxHype1e8 = px1e8; pxInitH = true; }
        return px1e8;
    }

    /// @notice Variante tolérante: met à jour le dernier prix et signale la déviation sans revert
    /// @return px prix normalisé 1e8 ajusté (borné si déviation)
    /// @return deviated true si le prix courant est hors bande de déviation
    function _tryValidatedOraclePx1e8(bool isBtc) internal returns (uint64 px, bool deviated) {
        uint32 asset = isBtc ? spotBTC : spotHYPE;
        uint64 raw = l1read.spotPx(asset);
        if (raw == 0) return (0, true);
        uint64 px1e8 = _toPx1e8(asset, raw);

        uint64 last = isBtc ? lastPxBtc1e8 : lastPxHype1e8;
        bool init = isBtc ? pxInitB : pxInitH;
        bool out = false;
        if (init && last != 0) {
            uint256 up = uint256(last) * (10_000 + uint256(maxOracleDeviationBps)) / 10_000;
            uint256 down = uint256(last) * (10_000 - uint256(maxOracleDeviationBps)) / 10_000;
            if (uint256(px1e8) > up) { px1e8 = uint64(up); out = true; }
            else if (uint256(px1e8) < down) { px1e8 = uint64(down); out = true; }
        }

        if (isBtc) { lastPxBtc1e8 = px1e8; pxInitB = true; } else { lastPxHype1e8 = px1e8; pxInitH = true; }
        return (px1e8, out);
    }



    function _sendSpotLimitOrderDirect(
        uint32 asset,
        bool isBuy,
        uint64 limitPx1e8,
        uint64 szInSzDecimals,
        uint128 cloid
    ) internal {
        // Validation complète selon la documentation HyperEVM/HyperCore
        if (!(asset == spotBTC || asset == spotHYPE)) revert INVALID_ASSET();
        
        uint8 baseSzDec = _baseSzDecimals(asset);
        if (baseSzDec == 0) revert INVALID_SZ_DECIMALS();
        
        szInSzDecimals = snapToLot(szInSzDecimals, baseSzDec);
        if (szInSzDecimals == 0) revert SIZE_TOO_LARGE();
        if (!StrategyMathLib.checkMinNotional(limitPx1e8, szInSzDecimals, baseSzDec, minNotionalUsd1e8)) revert NOTIONAL_LT_MIN();
        
        _assertOrder(asset, isBuy, limitPx1e8, szInSzDecimals);
        
        // Validation TIF: nous utilisons uniquement IOC (3) selon la documentation
        uint8 encodedTif = HLConstants.TIF_IOC;
        if (encodedTif != 3) revert INVALID_TIF();
        
        // Validation cloid: 0 est autorisé (pas de client order ID)
        // Si cloid > 0, il doit être dans des limites raisonnables
        if (cloid > 0) {
            if (cloid > type(uint128).max / 2) revert CLOID_TOO_LARGE();
        }
        
        uint32 assetId = asset + HLConstants.SPOT_ASSET_OFFSET;
        uint64 limitPxForCore = limitPx1e8;
        uint64 sz1e8 = StrategyMathLib.sizeSzTo1e8(szInSzDecimals, baseSzDec);
        if (sz1e8 == 0) revert SIZE_ZERO();
        
        _send(
            // HyperCore wire format expects both price and size as human-readable * 1e8 values.
            CoreHandlerLib.encodeSpotLimitOrder(
                assetId,
                isBuy,
                limitPxForCore,
                sz1e8,
                false, // reduceOnly
                encodedTif,
                cloid
            )
        );
    }
}


