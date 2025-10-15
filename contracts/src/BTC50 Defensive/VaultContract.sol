// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IHandler {
    function equitySpotUsd1e18() external view returns (uint256);
    function executeDeposit(uint64 usdc1e8, bool forceRebalance) external;
    function pullFromCoreToEvm(uint64 usdc1e8) external returns (uint64);
    function sweepToVault(uint64 amount1e8) external;
}

contract VaultContract is ReentrancyGuard {
    using SafeERC20 for IERC20;
    // ERC20 share
    string public constant name = "Core50 Vault Share";
    string public constant symbol = "c50USD";
    uint8 public constant decimals = 18;

    IERC20 public immutable usdc;
    address public owner;
    IHandler public handler;
    bool public paused;

    uint16 public depositFeeBps; // applied on shares minted
    uint16 public withdrawFeeBps; // applied on payout
    uint16 public autoDeployBps; // fraction of deposit auto deployed to Core

    struct WithdrawFeeTier { uint256 amount1e8; uint16 feeBps; }
    WithdrawFeeTier[] public withdrawFeeTiers; // trie par amount1e8 croissant

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    // AJOUTER CETTE MAPPING POUR LES AUTORISATIONS
    mapping(address => mapping(address => uint256)) public allowance;
    // Suivi des depots cumules utilisateur en USDC (1e8)
    mapping(address => uint256) public deposits;

    struct WithdrawRequest {
        address user;
        uint256 shares;
        uint16 feeBpsSnapshot; // fige les frais au moment de la demande
        bool settled;
    }
    WithdrawRequest[] public withdrawQueue;

    event Deposit(address indexed user, uint256 amount1e8, uint256 sharesMinted);
    event WithdrawRequested(uint256 indexed id, address indexed user, uint256 shares);
    event WithdrawPaid(uint256 indexed id, address indexed to, uint256 amount1e8);
    event WithdrawCancelled(uint256 indexed id, address indexed user, uint256 shares);
    event HandlerSet(address handler);
    event FeesSet(uint16 depositFeeBps, uint16 withdrawFeeBps, uint16 autoDeployBps);
    event PausedSet(bool paused);
    event RecallAndSweep(uint256 amount1e8);
    event NavUpdated(uint256 nav1e18);
    // AJOUTER CES ÉVÉNEMENTS
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event WithdrawFeeTiersSet();

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier notPaused() {
        require(!paused, "paused");
        _;
    }

    constructor(IERC20 _usdc) {
        usdc = _usdc;
        owner = msg.sender;
        autoDeployBps = 9000; // default 90%
    }

    function setHandler(IHandler _handler) external onlyOwner {
        require(address(_handler) != address(0), "Handler zero");
        handler = _handler;
        emit HandlerSet(address(_handler));
        // Approval illimite pour permettre au handler de tirer les USDC du vault
        try usdc.approve(address(_handler), type(uint256).max) {
            // Succès
        } catch {
            // Si l'approbation échoue, on essaie de reset d'abord
            try usdc.approve(address(_handler), 0) {
                usdc.approve(address(_handler), type(uint256).max);
            } catch {
                // Si même le reset échoue, on continue sans l'approbation
                // L'utilisateur devra appeler setHandler une seconde fois
            }
        }
    }

    function setFees(uint16 _depositFeeBps, uint16 _withdrawFeeBps, uint16 _autoDeployBps) external onlyOwner {
        require(_autoDeployBps <= 10000, "autoDeployBps range");
        require(_depositFeeBps <= 10000 && _withdrawFeeBps <= 10000, "fees range");
        depositFeeBps = _depositFeeBps;
        withdrawFeeBps = _withdrawFeeBps;
        autoDeployBps = _autoDeployBps;
        emit FeesSet(_depositFeeBps, _withdrawFeeBps, _autoDeployBps);
    }

    function setWithdrawFeeTiers(WithdrawFeeTier[] memory tiers) external onlyOwner {
        require(tiers.length <= 10, "too many tiers");
        delete withdrawFeeTiers;
        // copie dans le storage
        for (uint256 i = 0; i < tiers.length; i++) {
            require(tiers[i].feeBps <= 10000, "fee range");
            require(i == 0 || tiers[i].amount1e8 > tiers[i-1].amount1e8, "Tranches non triees");
            withdrawFeeTiers.push(tiers[i]);
        }
        emit WithdrawFeeTiersSet();
    }

    function getWithdrawFeeBpsForAmount(uint256 amount1e8) public view returns (uint16) {
        uint16 bps = withdrawFeeBps;
        uint256 n = withdrawFeeTiers.length;
        for (uint256 i = 0; i < n; i++) {
            if (amount1e8 <= withdrawFeeTiers[i].amount1e8) {
                bps = withdrawFeeTiers[i].feeBps;
                break;
            }
        }
        return bps;
    }

    function pause() external onlyOwner { paused = true; emit PausedSet(true); }
    function unpause() external onlyOwner { paused = false; emit PausedSet(false); }

    // NAV/PPS
    function nav1e18() public view returns (uint256) {
        // USDC a 8 decimales: pour passer en 1e18, multiplier par 1e10
        uint256 evm1e18 = usdc.balanceOf(address(this)) * 1e10;
        uint256 coreEq1e18 = address(handler) == address(0) ? 0 : handler.equitySpotUsd1e18();
        return evm1e18 + coreEq1e18;
    }

    function pps1e18() public view returns (uint256) {
        if (totalSupply == 0) return 1e18;
        uint256 nav = nav1e18();
        require(nav > 0, "Empty vault");
        return (nav * 1e18) / totalSupply;
    }

    // Shares mint/burn internal
    function _mint(address to, uint256 amount) internal {
        totalSupply += amount;
        balanceOf[to] += amount;
        // AJOUTER CET ÉVÉNEMENT
        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        balanceOf[from] -= amount;
        totalSupply -= amount;
        // AJOUTER CET ÉVÉNEMENT
        emit Transfer(from, address(0), amount);
    }

    // Deposit in USDC (1e8)
    function deposit(uint256 amount1e8) external notPaused nonReentrant {
        require(amount1e8 > 0, "amount=0");
        uint256 navPre = nav1e18();
        // Enregistre le depot utilisateur (USDC 1e8) avant l'interaction externe
        deposits[msg.sender] += amount1e8;
        usdc.safeTransferFrom(msg.sender, address(this), amount1e8);
        uint256 sharesMint;
        if (totalSupply == 0) {
            // 8 -> 18 decimales: facteur 1e10
            sharesMint = uint256(amount1e8) * 1e10; // 1:1 PPS = 1e18
        } else {
            sharesMint = (uint256(amount1e8) * 1e10 * totalSupply) / navPre;
        }
        if (depositFeeBps > 0) {
            uint256 fee = (sharesMint * depositFeeBps) / 10000;
            sharesMint -= fee;
        }
        _mint(msg.sender, sharesMint);
        emit Deposit(msg.sender, amount1e8, sharesMint);

        // Auto-deploy a portion to Core via handler
        if (address(handler) != address(0) && autoDeployBps > 0) {
            uint256 deployAmt = (uint256(amount1e8) * uint256(autoDeployBps)) / 10000;
            if (deployAmt > 0) {
                // Plus de conversion: Core utilise 1e8 comme l'EVM
                uint64 deployAmt1e8 = uint64(deployAmt);
                uint256 currentAllowance = usdc.allowance(address(this), address(handler));
                if (currentAllowance < deployAmt1e8) {
                    usdc.approve(address(handler), 0);
                    usdc.approve(address(handler), type(uint256).max);
                }
                handler.executeDeposit(deployAmt1e8, true);
            }
        }
        emit NavUpdated(nav1e18());
    }

    function withdraw(uint256 shares) external notPaused nonReentrant {
        require(shares > 0, "shares=0");
        require(balanceOf[msg.sender] >= shares, "balance");
        
        // Optimisation : calculer nav une seule fois et le reutiliser
        uint256 nav = nav1e18();
        require(nav > 0, "Empty vault");
        uint256 pps = (nav * 1e18) / totalSupply;
        
        // Payout brut et frais bases sur le montant (gross)
        uint256 target1e18 = (shares * pps) / 1e18;                 // brut 1e18
        uint256 gross1e8 = target1e18 / 1e10;                        // brut 1e8
        uint16 feeBpsApplied = getWithdrawFeeBpsForAmount(gross1e8);
        uint256 fee1e8 = (feeBpsApplied > 0 && gross1e8 > 0)
            ? (uint256(gross1e8) * uint256(feeBpsApplied)) / 10000
            : 0;
        uint256 net1e8 = uint256(gross1e8) - fee1e8;                 // net 1e8
        uint256 cash = usdc.balanceOf(address(this));
        
        // AMÉLIORATION: Vérifier si on a besoin de fonds du handler
        bool needsHandlerFunds = gross1e8 > cash;
        
        if (cash >= net1e8 && !needsHandlerFunds) {
            // Paiement immediat : bruler les parts maintenant
            _burn(msg.sender, shares);
            usdc.safeTransfer(msg.sender, net1e8);
            // Consommer la base de depot jusqu'a gross
            uint256 base = _getBaseAmount(gross1e8, deposits[msg.sender]);
            if (base > 0) {
                deposits[msg.sender] -= base;
            }
            emit WithdrawPaid(type(uint256).max, msg.sender, net1e8);
            emit NavUpdated(nav); // Reutiliser la valeur calculee
        } else {
            // enqueue - NE PAS bruler les parts ici, seulement au reglement
            uint256 id = withdrawQueue.length;
            // fige le BPS utilise pour le retrait differe
            withdrawQueue.push(WithdrawRequest({user: msg.sender, shares: shares, feeBpsSnapshot: feeBpsApplied, settled: false}));
            emit WithdrawRequested(id, msg.sender, shares);
            
            // AMÉLIORATION: Déclencher automatiquement le rapatriement si nécessaire
            if (needsHandlerFunds && address(handler) != address(0)) {
                // Calculer le montant nécessaire depuis le handler
                uint256 shortfall = gross1e8 - cash;
                // Limiter par les limites de taux du handler
                uint64 recallAmount = uint64(shortfall);
                // Note: Le handler peut refuser si les limites de taux sont dépassées
                try handler.pullFromCoreToEvm(recallAmount) {
                    try handler.sweepToVault(recallAmount) {
                        emit RecallAndSweep(shortfall);
                    } catch {
                        // Si sweep échoue, le retrait reste en file d'attente
                    }
                } catch {
                    // Si pullFromCoreToEvm échoue, le retrait reste en file d'attente
                }
            }
        }
    }

    // Owner/handler settles a queued withdrawal, bounded by current PPS
    function settleWithdraw(uint256 id, uint256 pay1e8, address to) external nonReentrant {
        require(msg.sender == owner || msg.sender == address(handler), "auth");
        require(id < withdrawQueue.length, "bad id");
        WithdrawRequest storage r = withdrawQueue[id];
        require(!r.settled, "settled");
        require(pay1e8 > 0, "zero");
        
        // Optimisation : calculer nav une seule fois et le reutiliser
        uint256 nav = nav1e18();
        require(nav > 0, "Empty vault");
        uint256 pps = (nav * 1e18) / totalSupply;
        
        uint256 due1e18 = (r.shares * pps) / 1e18;                   // brut 1e18
        uint256 gross1e8 = due1e18 / 1e10;                           // brut 1e8
        // Calcul des frais avec BPS fige et base sur le montant brut
        uint256 fee1e8_settle = (r.feeBpsSnapshot > 0 && gross1e8 > 0)
            ? (uint256(gross1e8) * uint256(r.feeBpsSnapshot)) / 10000
            : 0;
        uint256 maxPay = uint256(gross1e8) - fee1e8_settle;          // net 1e8
        // Le reglement doit etre exact pour eviter un sous-paiement silencieux
        require(pay1e8 == maxPay, "pay!=due");
        r.settled = true;
        // Bruler les parts au moment du reglement final
        _burn(r.user, r.shares);
        usdc.safeTransfer(to, pay1e8);
        // Consommer la base de depot jusqu'a gross au reglement
        uint256 base = _getBaseAmount(gross1e8, deposits[r.user]);
        if (base > 0) {
            deposits[r.user] -= base;
        }
        emit WithdrawPaid(id, to, pay1e8);
        emit NavUpdated(nav); // Réutiliser la valeur calculée
    }

    // Allow user to cancel their queued withdrawal and restore shares
    function cancelWithdrawRequest(uint256 id) external nonReentrant {
        require(id < withdrawQueue.length, "bad id");
        WithdrawRequest storage r = withdrawQueue[id];
        require(!r.settled, "settled");
        require(msg.sender == r.user, "not your request");
        r.settled = true;
        // Les parts n'ont pas encore ete brulees, donc pas besoin de les restaurer
        emit WithdrawCancelled(id, r.user, r.shares);
    }

    function recallFromCoreAndSweep(uint256 amount1e8) external onlyOwner nonReentrant {
        uint64 amt1e8 = uint64(amount1e8);
        handler.pullFromCoreToEvm(amt1e8);
        handler.sweepToVault(amt1e8);
        emit RecallAndSweep(amount1e8);
        emit NavUpdated(nav1e18());
    }

    // AJOUTER CES FONCTIONS APRÈS LA FONCTION cancelWithdrawRequest
    function transfer(address to, uint256 value) external notPaused nonReentrant returns (bool) {
        require(value > 0, "zero value");
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        require(value == 0 || allowance[msg.sender][spender] == 0, "unsafe approve");
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external notPaused nonReentrant returns (bool) {
        require(allowance[from][msg.sender] >= value, "allowance too low");
        allowance[from][msg.sender] -= value;
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(balanceOf[from] >= value, "insufficient balance");
        require(to != address(0), "zero address"); // ✅ DOIT ÊTRE PRÉSENT
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }

    // Utilitaire gas: retourne min(gross1e8, deposit)
    function _getBaseAmount(uint256 gross1e8, uint256 depositRecorded) internal pure returns (uint256) {
        uint256 gross = uint256(gross1e8);
        return gross > depositRecorded ? depositRecorded : gross;
    }

    // Fonction de diagnostic pour setHandler
    function canSetHandler(address _handler) external view returns (bool, string memory) {
        if (msg.sender != owner) {
            return (false, "Not owner");
        }
        if (_handler == address(0)) {
            return (false, "Handler zero address");
        }
        return (true, "OK");
    }
}


