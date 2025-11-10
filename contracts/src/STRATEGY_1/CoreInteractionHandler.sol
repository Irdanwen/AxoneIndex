// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {HLConstants} from "./utils/HLConstants.sol";
import {CoreHandlerLib} from "./utils/CoreHandlerLib.sol";
import {Rebalancer50Lib} from "./Rebalancer50Lib.sol";
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
    

    // Immutable system contracts
    L1Read public immutable l1read;
    ICoreWriter public immutable coreWriter;
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

    // Prix: décimales spot par index (source de vérité; configuré on-chain par l’owner)
    mapping(uint32 => uint8) public spotPxDecimals;
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

    constructor(L1Read _l1read, ICoreWriter _coreWriter, IERC20 _usdc, uint64 _maxOutboundPerEpoch, uint64 _epochLength, address _feeVault, uint64 _feeBps) {
        l1read = _l1read;
        coreWriter = _coreWriter;
        usdc = _usdc;
        lastEpochStart = uint64(block.number);
        owner = msg.sender;
        // Defaults
        require(_epochLength > 0, "EPOCH_0");
        require(_maxOutboundPerEpoch > 0, "MAX_OUTBOUND_0");
        epochLength = _epochLength;
        maxOutboundPerEpoch = _maxOutboundPerEpoch;
        if (maxSlippageBps == 0) maxSlippageBps = 50;
        if (marketEpsilonBps == 0) marketEpsilonBps = 10;
        deadbandBps = 50; // par défaut 0.5%
        maxOracleDeviationBps = 500; // 5%
        require(_feeBps <= 10_000, "FEE_BPS");
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
            require(usdcToken == usdcCoreTokenId, "USDC_ID_CONFLICT");
        }
        spotTokenBTC = btcToken;
        spotTokenHYPE = hypeToken;
        emit SpotTokenIdsSet(usdcToken, btcToken, hypeToken);
    }

    function setLimits(uint64 _maxOutboundPerEpoch, uint64 _epochLength) external onlyOwner {
        require(_epochLength > 0, "EPOCH_0");
        require(_maxOutboundPerEpoch > 0, "MAX_OUTBOUND_0");
        maxOutboundPerEpoch = _maxOutboundPerEpoch;
        epochLength = _epochLength;
        emit LimitsSet(_maxOutboundPerEpoch, _epochLength);
    }

    function setParams(uint64 _maxSlippageBps, uint64 _marketEpsilonBps, uint64 _deadbandBps) external onlyOwner {
        require(_deadbandBps <= 50, "DEADBAND_TOO_HIGH");
        maxSlippageBps = _maxSlippageBps;
        marketEpsilonBps = _marketEpsilonBps;
        deadbandBps = _deadbandBps;
        emit ParamsSet(_maxSlippageBps, _marketEpsilonBps, _deadbandBps);
    }

    function setMaxOracleDeviationBps(uint64 _maxDeviationBps) external onlyOwner {
        require(_maxDeviationBps > 0 && _maxDeviationBps <= 5000, "BAD_DEV_BPS");
        maxOracleDeviationBps = _maxDeviationBps;
    }

    function setFeeConfig(address _feeVault, uint64 _feeBps) external onlyOwner {
        require(_feeBps <= 10_000, "FEE_BPS");
        feeVault = _feeVault;
        feeBps = _feeBps;
        emit FeeConfigSet(_feeVault, _feeBps);
    }

    function setUsdcReserveBps(uint64 bps) external onlyOwner {
        require(bps <= 1_000, "RES_BPS_TOO_HIGH");
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

    /// @notice Définit les décimales prix pour un marché spot donné
    function setSpotPxDecimals(uint32 spotIndex, uint8 pxDec) external onlyOwner {
        require(pxDec > 0 && pxDec <= 18, "PXDEC");
        spotPxDecimals[spotIndex] = pxDec;
    }

    /// @notice Définit le notional minimal (USD en 1e8)
    function setMinNotionalUsd1e8(uint64 v) external onlyOwner {
        require(v > 0, "MIN_NTL");
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

    /// @notice Emergency pause function for critical situations
    function emergencyPause() external onlyOwner {
        _pause();
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
        if (usdcCoreSystemAddress == address(0)) revert("USDC_CORE_NOT_SET");
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
        require(hypeCoreSystemAddress != address(0) && usdcCoreSystemAddress != address(0), "CORE_NOT_SET");
        uint256 hype1e18 = msg.value;
        require(hype1e18 > 0, "AMOUNT=0");
        // EVM->Core spot: send native HYPE to system address to credit Core spot balance
        (bool ok, ) = payable(hypeCoreSystemAddress).call{value: hype1e18}("");
        require(ok, "NATIVE_SEND_FAIL");
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
        if (usdcCoreSystemAddress == address(0)) revert("USDC_CORE_NOT_SET");
        // Ensure enough USDC spot by selling BTC/HYPE via IOC if needed, while preserving reserve
        uint256 usdcBal = spotBalance(address(this), usdcCoreTokenId);
        if (usdcBal < usdc1e8) {
            uint256 shortfall1e8 = usdc1e8 - usdcBal;
            // Try to sell BTC first, then HYPE
            _sellAssetForUsd(spotBTC, spotTokenBTC, shortfall1e8);
            // Refresh balance and compute remaining
            usdcBal = spotBalance(address(this), usdcCoreTokenId);
            if (usdcBal < usdc1e8) {
                _sellAssetForUsd(spotHYPE, spotTokenHYPE, usdc1e8 - usdcBal);
            }
        }
        // Reserve enforcement (post-adjustment): do not allow withdrawal that breaches reserve
        {
            uint256 equity1e18 = equitySpotUsd1e18();
            uint256 reserve1e8 = ((equity1e18 * uint256(usdcReserveBps)) / 10_000) / 1e10;
            uint256 usdcBal1e8 = spotBalance(address(this), usdcCoreTokenId);
            require(usdcBal1e8 >= reserve1e8 + usdc1e8, "RESERVE_USDC");
        }
        // Spot send to credit EVM
        _send(coreWriter, CoreHandlerLib.encodeSpotSend(usdcCoreSystemAddress, usdcCoreTokenId, usdc1e8));
        emit InboundFromCore(usdc1e8);
        return usdc1e8;
    }

    // Ensure enough HYPE on Core (sell BTC for USDC if needed, then buy HYPE), then send to EVM and optionally rebalance back to 50/50
    function pullHypeFromCoreToEvm(uint64 hype1e8) external onlyVault whenNotPaused returns (uint64) {
        require(hypeCoreSystemAddress != address(0), "HYPE_CORE_NOT_SET");
        uint256 hypeBal = spotBalance(address(this), hypeCoreTokenId);
        if (hypeBal < hype1e8) {
            uint256 shortfallH1e8 = hype1e8 - hypeBal;
            // Prix HYPE normalisé 1e8
            uint64 pxH1e8 = _validatedOraclePx1e8(false);
            // USD nécessaire en 1e8 pour couvrir le shortfall en HYPE: shortfallH1e8 * pxH / 1e8
            uint64 usdNeed1e8 = uint64((uint256(shortfallH1e8) * uint256(pxH1e8)) / 1e8);
            // Calculer la réserve USDC requise en unités 1e8 (USDC)
            uint256 equity1e18_r = equitySpotUsd1e18();
            uint256 reserve1e8 = ((equity1e18_r * uint256(usdcReserveBps)) / 10_000) / 1e10;
            // S'assurer d'abord d'avoir assez d'USDC pour usdNeed + réserve, en vendant BTC puis HYPE si nécessaire
            uint256 usdcBal1e8 = spotBalance(address(this), usdcCoreTokenId);
            uint256 targetUsdc1e8 = uint256(usdNeed1e8) + reserve1e8;
            if (usdcBal1e8 < targetUsdc1e8) {
                uint64 deficit1e8 = uint64(targetUsdc1e8 - usdcBal1e8);
                if (deficit1e8 > 0) {
                    _sellAssetForUsd(spotBTC, spotTokenBTC, deficit1e8);
                }
                // Refresh après vente BTC
                usdcBal1e8 = spotBalance(address(this), usdcCoreTokenId);
                if (usdcBal1e8 < targetUsdc1e8) {
                    uint64 stillShort1e8 = uint64(targetUsdc1e8 - usdcBal1e8);
                    // En dernier recours, vendre du HYPE côté Core (peut réduire légèrement la cible mais assure la liquidité)
                    _sellAssetForUsd(spotHYPE, spotTokenHYPE, stillShort1e8);
                }
            }
            // Acheter le HYPE manquant via IOC spot en utilisant usdNeed1e8 (converti en 1e18 pour la conversion taille)
            uint256 usdNeed1e18 = uint256(usdNeed1e8) * 1e10;
            uint64 szBuyH = CoreHandlerLib.toSzInSzDecimals(l1read, spotTokenHYPE, int256(usdNeed1e18), pxH1e8);
            if (szBuyH > 0) {
                uint64 pxBuyLimit = _marketLimitFromBbo(spotHYPE, true);
                _sendSpotLimitOrderDirect(spotHYPE, true, pxBuyLimit, szBuyH, 0);
                emit SpotOrderPlaced(spotHYPE, true, pxBuyLimit, szBuyH, 0);
            }
        }
        // Spot send to credit EVM HYPE
        _send(coreWriter, CoreHandlerLib.encodeSpotSend(hypeCoreSystemAddress, hypeCoreTokenId, hype1e8));
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
            require(feeVault != address(0), "FEE_VAULT");
            feeAmt1e8 = uint64((uint256(amount1e8) * uint256(feeBps)) / 10_000);
            if (feeAmt1e8 > 0) {
                require(usdc.transfer(feeVault, uint256(feeAmt1e8)), "fee sweep fail");
            }
        }
        uint64 net1e8 = amount1e8 - feeAmt1e8;
        require(usdc.transfer(vault, uint256(net1e8)), "sweep fail");
        emit SweepWithFee(amount1e8, feeAmt1e8, net1e8);
    }

    // Sweep native HYPE held on EVM from handler to vault, applying feeBps in HYPE
    function sweepHypeToVault(uint256 amount1e18) external onlyVault whenNotPaused {
        if (amount1e18 == 0) return;
        require(address(this).balance >= amount1e18, "BAL");
        uint256 feeAmt = 0;
        if (feeBps > 0) {
            require(feeVault != address(0), "FEE_VAULT");
            feeAmt = (amount1e18 * uint256(feeBps)) / 10_000;
            if (feeAmt > 0) {
                (bool f, ) = payable(feeVault).call{value: feeAmt}("");
                require(f, "fee send fail");
            }
        }
        uint256 net = amount1e18 - feeAmt;
        (bool s, ) = payable(vault).call{value: net}("");
        require(s, "sweep fail");
        // Reuse event with truncated units is not ideal; keep separate event if needed
        // For simplicity, emit same event with values downscaled to 1e8 notionally
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

    function _computeRebalanceDeltas() internal returns (int256 dB, int256 dH, uint64 pxB, uint64 pxH) {
        // Prix oracles normalisés 1e8 avec validation de déviation
        pxB = _validatedOraclePx1e8(true);
        pxH = _validatedOraclePx1e8(false);

        // Calcul des positions directement dans l'appel à computeDeltas
        (dB, dH) = _computeDeltasWithPositions(pxB, pxH);
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
                uint256 usdcBal1e8 = spotBalance(address(this), usdcCoreTokenId);
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
                uint256 usdcBal1e8 = spotBalance(address(this), usdcCoreTokenId);
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
        bid1e8 = _toPx1e8(spotAsset, b.bid);
        ask1e8 = _toPx1e8(spotAsset, b.ask);
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
    function quantizePx1e8(uint64 px1e8, uint8 szDecimals, bool isBuy) internal pure returns (uint64) {
        if (px1e8 == 0) return 0;
        uint8 maxPxDecimals = 8 > szDecimals ? uint8(8 - szDecimals) : 0;
        if (maxPxDecimals < 8) {
            uint8 cut = uint8(8 - maxPxDecimals);
            uint64 factor = uint64(10 ** cut);
            if (isBuy) {
                px1e8 = uint64((uint256(px1e8) + factor - 1) / factor) * factor;
            } else {
                px1e8 = (px1e8 / factor) * factor;
            }
        }
        uint64 pxInt = px1e8 / 100_000_000;
        if (pxInt >= 100000) {
            px1e8 = pxInt * 100_000_000;
        }
        return px1e8;
    }

    function _marketLimitFromBbo(uint32 asset, bool isBuy) internal view returns (uint64) {
        (uint64 bid1e8, uint64 ask1e8) = _spotBboPx1e8(asset);
        if (bid1e8 == 0 || ask1e8 == 0) {
            // Fallback sur l'oracle normalisé si BBO indisponible
            uint64 oracle = spotOraclePx1e8(asset);
            return _limitFromOracleQuantized(asset, oracle, isBuy);
        }
        uint64 lim;
        if (isBuy) {
            uint256 adj = (uint256(ask1e8) * uint256(marketEpsilonBps)) / 10_000;
            lim = uint64(uint256(ask1e8) + adj);
        } else {
            uint256 adj = (uint256(bid1e8) * uint256(marketEpsilonBps)) / 10_000;
            uint256 lo = (uint256(bid1e8) > adj) ? (uint256(bid1e8) - adj) : 1;
            lim = uint64(lo);
        }
        uint8 baseSzDec = _baseSzDecimals(asset);
        return quantizePx1e8(lim, baseSzDec, isBuy);
    }

    function _limitFromOracleQuantized(uint32 asset, uint64 oraclePx1e8, bool isBuy) internal view returns (uint64) {
        uint256 bps = uint256(maxSlippageBps) + uint256(marketEpsilonBps);
        uint256 adj = (uint256(oraclePx1e8) * bps) / 10_000;
        uint64 lim = isBuy
            ? uint64(uint256(oraclePx1e8) + adj)
            : uint64((uint256(oraclePx1e8) > adj) ? (uint256(oraclePx1e8) - adj) : 1);
        uint8 baseSzDec = _baseSzDecimals(asset);
        return quantizePx1e8(lim, baseSzDec, isBuy);
    }

    function snapToLot(uint64 sizeSz, uint8 /*szDecimals*/) internal pure returns (uint64) {
        // Les tailles sont déjà exprimées en unités d'entier alignées sur szDecimals
        return sizeSz;
    }

    function _checkMinNotional(uint64 px1e8, uint64 sizeSz, uint8 szDecimals) internal view returns (bool) {
        if (px1e8 == 0 || sizeSz == 0) return false;
        uint256 notional1e8 = (uint256(sizeSz) * uint256(px1e8)) / (10 ** uint256(szDecimals));
        return notional1e8 >= minNotionalUsd1e8;
    }

    function _assertOrder(uint32 asset, bool isBuy, uint64 limitPx1e8, uint64 szInSzDecimals) internal view {
        require(limitPx1e8 > 0, "px=0");
        require(szInSzDecimals > 0, "size=0");
        uint8 szDec = _baseSzDecimals(asset);
        require(_checkMinNotional(limitPx1e8, szInSzDecimals, szDec), "notional<min");
        uint64 qpx = quantizePx1e8(limitPx1e8, szDec, isBuy);
        require(qpx == limitPx1e8, "px not quantized");
    }

    function _spotPxDecimals(uint32 spotIndex) internal view returns (uint8) {
        uint8 configured = spotPxDecimals[spotIndex];
        if (configured > 0) {
            return configured;
        }
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
        if (tokenInfo.weiDecimals < tokenInfo.szDecimals) {
            // Non documenté mais on évite tout underflow en supposant le prix déjà exprimé en 1e8.
            return 8;
        }
        uint8 diff = tokenInfo.weiDecimals - tokenInfo.szDecimals;
        // Diff peut dépasser 8 pour certains actifs HIP: dans ce cas on retourne diff afin que _toPx1e8 divise correctement.
        return diff;
    }

    function _toPx1e8(uint32 spotIndex, uint64 rawPx) internal view returns (uint64) {
        if (rawPx == 0) return 0;
        uint8 pxDec = _spotPxDecimals(spotIndex);
        if (pxDec == 8) return rawPx;
        if (pxDec < 8) {
            uint256 mul = 10 ** uint256(8 - pxDec);
            uint256 n = uint256(rawPx) * mul;
            require(n <= type(uint64).max, "PX_OVERFLOW");
            return uint64(n);
        }
        // pxDec > 8
        return uint64(uint256(rawPx) / (10 ** uint256(pxDec - 8)));
    }

    function _toRawPx(uint32 asset, uint64 px1e8, bool /*isBuy*/) internal view returns (uint64) {
        uint8 pxDec = _spotPxDecimals(asset);
        if (pxDec == 8) return px1e8;
        if (pxDec < 8) {
            return uint64(uint256(px1e8) / (10 ** uint256(8 - pxDec)));
        }
        // pxDec > 8
        uint256 n = uint256(px1e8) * (10 ** uint256(pxDec - 8));
        require(n <= type(uint64).max, "PX_OVERFLOW");
        return uint64(n);
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

    function _send(ICoreWriter writer, bytes memory data) internal {
        writer.sendRawAction(data);
        emit OutboundToCore(data);
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
        uint8 baseSzDec = _baseSzDecimals(asset);
        szInSzDecimals = snapToLot(szInSzDecimals, baseSzDec);
        require(szInSzDecimals > 0, "size=0");
        require(_checkMinNotional(limitPx1e8, szInSzDecimals, baseSzDec), "min notional");
        _assertOrder(asset, isBuy, limitPx1e8, szInSzDecimals);
        uint32 assetId = asset + HLConstants.SPOT_ASSET_OFFSET;
        uint64 limitPxRaw = _toRawPx(asset, limitPx1e8, isBuy);
        _send(coreWriter, CoreHandlerLib.encodeSpotLimitOrder(assetId, isBuy, limitPxRaw, szInSzDecimals, cloid));
    }

    // ==== Helpers pour tests ====
    function toPx1e8Public(uint32 spotIndex, uint64 rawPx) external view returns (uint64) {
        return _toPx1e8(spotIndex, rawPx);
    }

    function toRawPxPublic(uint32 spotIndex, uint64 px1e8) external view returns (uint64) {
        return _toRawPx(spotIndex, px1e8, true);
    }

    function quantizePx1e8Public(uint64 px1e8, uint8 szDecimals, bool isBuy) external pure returns (uint64) {
        return quantizePx1e8(px1e8, szDecimals, isBuy);
    }

    function checkMinNotionalPublic(uint64 px1e8, uint64 sizeSz, uint8 szDecimals) external view returns (bool) {
        return _checkMinNotional(px1e8, sizeSz, szDecimals);
    }
}


