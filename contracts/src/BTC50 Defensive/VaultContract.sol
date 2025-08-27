// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
interface IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function balanceOf(address owner) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IHandler {
    function equitySpotUsd1e18() external view returns (uint256);
    function executeDeposit(uint64 usdc1e6, bool forceRebalance) external;
    function pullFromCoreToEvm(uint64 usdc1e6) external returns (uint64);
    function sweepToVault(uint64 amount1e6) external;
}

contract VaultContract is ReentrancyGuard {
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

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    struct WithdrawRequest {
        address user;
        uint256 shares;
        bool settled;
    }
    WithdrawRequest[] public withdrawQueue;

    event Deposit(address indexed user, uint256 amount1e6, uint256 sharesMinted);
    event WithdrawRequested(uint256 indexed id, address indexed user, uint256 shares);
    event WithdrawPaid(uint256 indexed id, address indexed to, uint256 amount1e6);
    event WithdrawCancelled(uint256 indexed id, address indexed user, uint256 shares);
    event HandlerSet(address handler);
    event FeesSet(uint16 depositFeeBps, uint16 withdrawFeeBps, uint16 autoDeployBps);
    event PausedSet(bool paused);
    event RecallAndSweep(uint64 amount1e6);
    event NavUpdated(uint256 nav1e18);

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

    function pause() external onlyOwner { paused = true; emit PausedSet(true); }
    function unpause() external onlyOwner { paused = false; emit PausedSet(false); }

    // NAV/PPS
    function nav1e18() public view returns (uint256) {
        uint256 evm1e18 = usdc.balanceOf(address(this)) * 1e12;
        uint256 coreEq1e18 = address(handler) == address(0) ? 0 : handler.equitySpotUsd1e18();
        return evm1e18 + coreEq1e18;
    }

    function pps1e18() public view returns (uint256) {
        if (totalSupply == 0) return 1e18;
        return (nav1e18() * 1e18) / totalSupply;
    }

    // Shares mint/burn internal
    function _mint(address to, uint256 amount) internal {
        totalSupply += amount;
        balanceOf[to] += amount;
    }

    function _burn(address from, uint256 amount) internal {
        balanceOf[from] -= amount;
        totalSupply -= amount;
    }

    // Deposit in USDC (1e6)
    function deposit(uint64 amount1e6) external notPaused nonReentrant {
        require(amount1e6 > 0, "amount=0");
        uint256 navPre = nav1e18();
        require(usdc.transferFrom(msg.sender, address(this), amount1e6), "pull fail");
        uint256 sharesMint;
        if (totalSupply == 0) {
            sharesMint = uint256(amount1e6) * 1e12; // 1:1 PPS = 1e18
        } else {
            sharesMint = (uint256(amount1e6) * 1e12 * totalSupply) / navPre;
        }
        if (depositFeeBps > 0) {
            uint256 fee = (sharesMint * depositFeeBps) / 10000;
            sharesMint -= fee;
        }
        _mint(msg.sender, sharesMint);
        emit Deposit(msg.sender, amount1e6, sharesMint);

        // Auto-deploy a portion to Core via handler
        if (address(handler) != address(0) && autoDeployBps > 0) {
            uint64 deployAmt = uint64((uint256(amount1e6) * uint256(autoDeployBps)) / 10000);
            if (deployAmt > 0) {
                // reset then set (USDC compatibility)
                require(usdc.approve(address(handler), 0), "approve0");
                require(usdc.approve(address(handler), deployAmt), "approve");
                handler.executeDeposit(deployAmt, true);
            }
        }
        emit NavUpdated(nav1e18());
    }

    function withdraw(uint256 shares) external notPaused nonReentrant {
        require(shares > 0, "shares=0");
        require(balanceOf[msg.sender] >= shares, "balance");
        uint256 pps = pps1e18();
        _burn(msg.sender, shares);
        // Target payout
        uint256 target1e18 = (shares * pps) / 1e18;
        uint64 target1e6 = uint64(target1e18 / 1e12);
        uint256 cash = usdc.balanceOf(address(this));
        if (cash >= target1e6) {
            uint64 pay = target1e6;
            if (withdrawFeeBps > 0) {
                uint256 fee = (uint256(pay) * withdrawFeeBps) / 10000;
                pay = uint64(uint256(pay) - fee);
            }
            require(usdc.transfer(msg.sender, pay), "pay fail");
            emit WithdrawPaid(type(uint256).max, msg.sender, pay);
            emit NavUpdated(nav1e18());
        } else {
            // enqueue
            uint256 id = withdrawQueue.length;
            withdrawQueue.push(WithdrawRequest({user: msg.sender, shares: shares, settled: false}));
            emit WithdrawRequested(id, msg.sender, shares);
        }
    }

    // Owner/handler settles a queued withdrawal, bounded by current PPS
    function settleWithdraw(uint256 id, uint64 pay1e6, address to) external nonReentrant {
        require(msg.sender == owner || msg.sender == address(handler), "auth");
        require(id < withdrawQueue.length, "bad id");
        WithdrawRequest storage r = withdrawQueue[id];
        require(!r.settled, "settled");
        require(pay1e6 > 0, "zero");
        uint256 pps = pps1e18();
        uint256 due1e18 = (r.shares * pps) / 1e18;                   // brut
        uint256 net1e18 = (due1e18 * (10000 - withdrawFeeBps)) / 10000; // net après frais
        uint64 maxPay = uint64(net1e18 / 1e12);
        require(pay1e6 <= maxPay, "overpay");
        r.settled = true;
        require(usdc.transfer(to, pay1e6), "transfer");
        emit WithdrawPaid(id, to, pay1e6);
        emit NavUpdated(nav1e18());
    }

    // Allow user to cancel their queued withdrawal and restore shares
    function cancelWithdrawRequest(uint256 id) external nonReentrant {
        require(id < withdrawQueue.length, "bad id");
        WithdrawRequest storage r = withdrawQueue[id];
        require(!r.settled, "settled");
        require(r.user == msg.sender, "not requester");
        r.settled = true;
        _mint(r.user, r.shares);
        emit WithdrawCancelled(id, r.user, r.shares);
    }

    function recallFromCoreAndSweep(uint64 amount1e6) external onlyOwner nonReentrant {
        handler.pullFromCoreToEvm(amount1e6);
        handler.sweepToVault(amount1e6);
        emit RecallAndSweep(amount1e6);
        emit NavUpdated(nav1e18());
    }
}


