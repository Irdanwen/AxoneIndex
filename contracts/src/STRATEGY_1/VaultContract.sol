// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IHandler {
    function equitySpotUsd1e18() external view returns (uint256);
    function oraclePxHype1e8() external view returns (uint64);
    function executeDepositHype(bool forceRebalance) external payable;
    function pullHypeFromCoreToEvm(uint64 hype1e8) external returns (uint64);
    function sweepHypeToVault(uint256 amount1e18) external;
    function feeVault() external view returns (address);
}

contract VaultContract is ReentrancyGuard {
    // ERC20 share
    string public constant name = "Axone Strategy 1 Share";
    string public constant symbol = "sAXN1";
    uint8 public constant decimals = 18;

    address public owner;
    IHandler public handler;
    bool public paused;

    uint16 public depositFeeBps; // applied on shares minted
    uint16 public withdrawFeeBps; // applied on payout
    uint16 public autoDeployBps; // fraction of deposit auto deployed to Core

    struct WithdrawFeeTier { uint256 amount1e18; uint16 feeBps; }
    WithdrawFeeTier[] public withdrawFeeTiers; // trie par amount1e18 croissant

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    // Suivi des depots cumules utilisateur en HYPE (1e18)
    mapping(address => uint256) public deposits;

    struct WithdrawRequest {
        address user;
        uint256 shares;
        uint16 feeBpsSnapshot; // fige les frais au moment de la demande
        bool settled;
    }
    WithdrawRequest[] public withdrawQueue;

    event Deposit(address indexed user, uint256 amount1e18, uint256 sharesMinted);
    event WithdrawRequested(uint256 indexed id, address indexed user, uint256 shares);
    event WithdrawPaid(uint256 indexed id, address indexed to, uint256 amount1e18);
    event WithdrawCancelled(uint256 indexed id, address indexed user, uint256 shares);
    event HandlerSet(address handler);
    event FeesSet(uint16 depositFeeBps, uint16 withdrawFeeBps, uint16 autoDeployBps);
    event PausedSet(bool paused);
    event RecallAndSweep(uint256 amount1e18);
    event NavUpdated(uint256 nav1e18);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event WithdrawFeeTiersSet();
    event VaultFeePaid(address indexed vault, address indexed feeVault, uint8 kind, uint256 amount1e18);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier notPaused() {
        require(!paused, "paused");
        _;
    }

    constructor() {
        owner = msg.sender;
        autoDeployBps = 9000; // default 90%
    }

    receive() external payable {}

    function setHandler(IHandler _handler) external onlyOwner {
        require(address(_handler) != address(0), "Handler zero");
        handler = _handler;
        emit HandlerSet(address(_handler));
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
        for (uint256 i = 0; i < tiers.length; i++) {
            require(tiers[i].feeBps <= 10000, "fee range");
            require(i == 0 || tiers[i].amount1e18 > tiers[i-1].amount1e18, "Tranches non triees");
            withdrawFeeTiers.push(tiers[i]);
        }
        emit WithdrawFeeTiersSet();
    }

    function getWithdrawFeeBpsForAmount(uint256 amount1e18) public view returns (uint16) {
        uint16 bps = withdrawFeeBps;
        uint256 n = withdrawFeeTiers.length;
        for (uint256 i = 0; i < n; i++) {
            if (amount1e18 <= withdrawFeeTiers[i].amount1e18) {
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
        uint64 pxH = address(handler) == address(0) ? uint64(0) : handler.oraclePxHype1e8();
        uint256 evmHypeUsd1e18 = pxH == 0 ? 0 : (address(this).balance * uint256(pxH)) / 1e8;
        uint256 coreEq1e18 = address(handler) == address(0) ? 0 : handler.equitySpotUsd1e18();
        return evmHypeUsd1e18 + coreEq1e18;
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
        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }

    // Deposit in native HYPE (1e18)
    function deposit() external payable notPaused nonReentrant {
        uint256 amount1e18 = msg.value;
        require(amount1e18 > 0, "amount=0");
        uint256 navPre = nav1e18();
        deposits[msg.sender] += amount1e18;

        uint256 feeHype = 0;
        if (depositFeeBps > 0) {
            address fv = handler.feeVault();
            require(fv != address(0), "feeVault");
            feeHype = (amount1e18 * uint256(depositFeeBps)) / 10000;
            if (feeHype > 0) {
                (bool okFee, ) = payable(fv).call{value: feeHype}("");
                require(okFee, "fee send fail");
                emit VaultFeePaid(address(this), fv, 1, feeHype);
            }
        }

        uint256 netAmount = amount1e18 - feeHype;

        // USD notional for minting (based on net amount)
        uint64 pxH = handler.oraclePxHype1e8();
        require(pxH > 0, "px");
        uint256 depositUsd1e18 = (netAmount * uint256(pxH)) / 1e8;
        uint256 sharesMint;
        if (totalSupply == 0) {
            sharesMint = depositUsd1e18; // PPS = 1e18
        } else {
            sharesMint = (depositUsd1e18 * totalSupply) / navPre;
        }

        _mint(msg.sender, sharesMint);
        emit Deposit(msg.sender, amount1e18, sharesMint);

        // Auto-deploy a portion to Core via handler (HYPE -> USDC then 50/50)
        if (address(handler) != address(0) && autoDeployBps > 0) {
            uint256 deployAmt = (uint256(netAmount) * uint256(autoDeployBps)) / 10000;
            if (deployAmt > 0) {
                handler.executeDepositHype{value: deployAmt}(true);
            }
        }
        emit NavUpdated(nav1e18());
    }

    function withdraw(uint256 shares) external notPaused nonReentrant {
        require(shares > 0, "shares=0");
        require(balanceOf[msg.sender] >= shares, "balance");
        uint256 nav = nav1e18();
        require(nav > 0, "Empty vault");
        uint256 pps = (nav * 1e18) / totalSupply;

        // Gross USD due from shares
        uint256 targetUsd1e18 = (shares * pps) / 1e18;
        // Convert to HYPE
        uint64 pxH = handler.oraclePxHype1e8();
        require(pxH > 0, "px");
        uint256 grossHype1e18 = (targetUsd1e18 * 1e8) / uint256(pxH);
        uint16 feeBpsApplied = getWithdrawFeeBpsForAmount(grossHype1e18);
        uint256 feeHype1e18 = (feeBpsApplied > 0 && grossHype1e18 > 0)
            ? (grossHype1e18 * uint256(feeBpsApplied)) / 10000
            : 0;
        uint256 netHype1e18 = grossHype1e18 - feeHype1e18;
        uint256 cash = address(this).balance;

        bool needsHandlerFunds = grossHype1e18 > cash;

        if (cash >= netHype1e18 && !needsHandlerFunds) {
            _burn(msg.sender, shares);
            if (feeHype1e18 > 0) {
                address fv2 = handler.feeVault();
                require(fv2 != address(0), "feeVault");
                (bool okFee2, ) = payable(fv2).call{value: feeHype1e18}("");
                require(okFee2, "fee send fail");
                emit VaultFeePaid(address(this), fv2, 2, feeHype1e18);
            }
            (bool ok, ) = payable(msg.sender).call{value: netHype1e18}("");
            require(ok, "native pay fail");
            uint256 base = _getBaseAmountHype(grossHype1e18, deposits[msg.sender]);
            if (base > 0) {
                deposits[msg.sender] -= base;
            }
            emit WithdrawPaid(type(uint256).max, msg.sender, netHype1e18);
            emit NavUpdated(nav);
        } else {
            uint256 id = withdrawQueue.length;
            withdrawQueue.push(WithdrawRequest({user: msg.sender, shares: shares, feeBpsSnapshot: feeBpsApplied, settled: false}));
            emit WithdrawRequested(id, msg.sender, shares);

            if (needsHandlerFunds && address(handler) != address(0)) {
                uint256 shortfall1e18 = grossHype1e18 - cash;
                uint64 recallAmount1e8 = uint64(shortfall1e18 / 1e10);
                try handler.pullHypeFromCoreToEvm(recallAmount1e8) {
                    // Convert 1e8 -> 1e18 for sweep
                    try handler.sweepHypeToVault(uint256(recallAmount1e8) * 1e10) {
                        emit RecallAndSweep(shortfall1e18);
                    } catch {}
                } catch {}
            }
        }
    }

    // Owner/handler settles a queued withdrawal, bounded by current PPS
    function settleWithdraw(uint256 id, address to) external nonReentrant {
        require(msg.sender == owner || msg.sender == address(handler), "auth");
        require(id < withdrawQueue.length, "bad id");
        WithdrawRequest storage r = withdrawQueue[id];
        require(!r.settled, "settled");

        // Calculer le montant automatiquement
        uint256 nav = nav1e18();
        require(nav > 0, "Empty vault");
        uint256 pps = (nav * 1e18) / totalSupply;

        uint256 dueUsd1e18 = (r.shares * pps) / 1e18;
        uint64 pxH = handler.oraclePxHype1e8();
        require(pxH > 0, "px");
        uint256 grossHype1e18 = (dueUsd1e18 * 1e8) / uint256(pxH);
        uint256 feeHype1e18_settle = (r.feeBpsSnapshot > 0 && grossHype1e18 > 0)
            ? (grossHype1e18 * uint256(r.feeBpsSnapshot)) / 10000
            : 0;
        uint256 pay1e18 = grossHype1e18 - feeHype1e18_settle;
        require(pay1e18 > 0, "zero payment");
        
        r.settled = true;
        _burn(r.user, r.shares);
        if (feeHype1e18_settle > 0) {
            address fv3 = handler.feeVault();
            require(fv3 != address(0), "feeVault");
            (bool okFee3, ) = payable(fv3).call{value: feeHype1e18_settle}("");
            require(okFee3, "fee send fail");
            emit VaultFeePaid(address(this), fv3, 3, feeHype1e18_settle);
        }
        (bool ok2, ) = payable(to).call{value: pay1e18}("");
        require(ok2, "native pay fail");
        uint256 base = _getBaseAmountHype(grossHype1e18, deposits[r.user]);
        if (base > 0) {
            deposits[r.user] -= base;
        }
        emit WithdrawPaid(id, to, pay1e18);
        emit NavUpdated(nav);
    }

    function cancelWithdrawRequest(uint256 id) external nonReentrant {
        require(id < withdrawQueue.length, "bad id");
        WithdrawRequest storage r = withdrawQueue[id];
        require(!r.settled, "settled");
        require(msg.sender == r.user, "not your request");
        r.settled = true;
        emit WithdrawCancelled(id, r.user, r.shares);
    }

    function recallFromCoreAndSweep(uint256 amount1e18) external onlyOwner nonReentrant {
        require(amount1e18 % 1e10 == 0, "amount not 1e10 multiple");
        uint256 amt1e8u256 = amount1e18 / 1e10;
        require(amt1e8u256 <= type(uint64).max, "amount too large");
        uint64 amt1e8 = uint64(amt1e8u256);
        handler.pullHypeFromCoreToEvm(amt1e8);
        uint256 swept1e18 = amt1e8u256 * 1e10;
        handler.sweepHypeToVault(swept1e18);
        emit RecallAndSweep(swept1e18);
        emit NavUpdated(nav1e18());
    }

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
        require(to != address(0), "zero address");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }

    function _getBaseAmountHype(uint256 gross1e18, uint256 depositRecorded) internal pure returns (uint256) {
        // Logique de base amount: limite le retrait aux dépôts enregistrés
        // Évite les retraits excessifs qui pourraient affecter la stabilité du vault
        return gross1e18 > depositRecorded ? depositRecorded : gross1e18;
    }

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

