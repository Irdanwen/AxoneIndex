// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IEmissionController} from "./interfaces/IEmissionController.sol";
import {IRewarder} from "./interfaces/IRewarder.sol";

/// @title RewardsHub (type MasterChef mono-reward)
/// @notice Staking de tokens de parts (shares ERC-4626, 18 décimales) et distribution du token de récompense
contract RewardsHub is Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Précision utilisée pour l'accumulateur de reward par part
    uint256 public constant ACC_PRECISION = 1e12;

    /// @notice Contrôleur d'émission (débit global par seconde)
    IEmissionController public controller;

    /// @notice Raccourci: token de récompense (doit correspondre à controller.rewardToken())
    address public rewardToken;

    /// @notice Somme des points d'allocation de tous les pools
    uint256 public totalAllocPoint;

    struct PoolInfo {
        IERC20 stakeToken;           // token de parts du vault (shares)
        uint128 allocPoint;          // pondération du pool
        uint64  lastRewardTime;      // timestamp dernière MAJ
        uint256 accRewardPerShare;   // accumulateur de reward par share (ACC_PRECISION)
        uint256 totalStaked;         // total staké dans le pool
        IRewarder rewarder;          // optionnel: rewarder secondaire
    }

    struct UserInfo {
        uint256 amount;              // montant staké
        int256  rewardDebt;          // dette de récompense (signée)
    }

    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo; // pid => user => info

    // Événements
    event PoolAdded(uint256 indexed pid, address indexed stakeToken, uint128 allocPoint);
    event PoolUpdated(uint256 indexed pid, uint128 oldAlloc, uint128 newAlloc);
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event ControllerSet(address indexed oldC, address indexed newC);
    event Paused(address indexed by);
    event Unpaused(address indexed by);

    constructor(IEmissionController controller_) {
        setController(controller_);
    }

    // ----- Admin -----
    function pause() external onlyOwner { _pause(); emit Paused(msg.sender); }
    function unpause() external onlyOwner { _unpause(); emit Unpaused(msg.sender); }

    function setController(IEmissionController newC) public onlyOwner {
        require(address(newC) != address(0), "controller=0");
        address old = address(controller);
        controller = newC;
        rewardToken = newC.rewardToken();
        emit ControllerSet(old, address(newC));
    }

    function addPool(IERC20 stakeToken, uint128 allocPoint) external onlyOwner {
        require(address(stakeToken) != address(0), "token=0");
        totalAllocPoint += allocPoint;
        poolInfo.push(
            PoolInfo({
                stakeToken: stakeToken,
                allocPoint: allocPoint,
                lastRewardTime: uint64(block.timestamp),
                accRewardPerShare: 0,
                totalStaked: 0,
                rewarder: IRewarder(address(0))
            })
        );
        emit PoolAdded(poolInfo.length - 1, address(stakeToken), allocPoint);
    }

    function setAllocPoint(uint256 pid, uint128 newAlloc) external onlyOwner {
        PoolInfo storage p = poolInfo[pid];
        uint128 old = p.allocPoint;
        if (old == newAlloc) return;
        // Mettre à jour le pool avant de changer l'allocation pour figer l'état courant
        _updatePool(pid);
        p.allocPoint = newAlloc;
        // Ajuster la somme globale
        totalAllocPoint = totalAllocPoint - old + newAlloc;
        emit PoolUpdated(pid, old, newAlloc);
    }

    function setPoolRewarder(uint256 pid, IRewarder rewarder) external onlyOwner {
        poolInfo[pid].rewarder = rewarder; // stub simple
    }

    // ----- Vue -----
    function poolLength() external view returns (uint256) { return poolInfo.length; }

    function pendingReward(uint256 pid, address user) external view returns (uint256 pending) {
        PoolInfo memory p = poolInfo[pid];
        UserInfo memory u = userInfo[pid][user];
        uint256 acc = p.accRewardPerShare;
        if (block.timestamp > p.lastRewardTime && p.totalStaked != 0 && totalAllocPoint != 0) {
            uint256 elapsed = block.timestamp - p.lastRewardTime;
            uint256 emission = controller.pendingEmission();
            // Part du pool
            uint256 poolReward = (emission * uint256(p.allocPoint)) / totalAllocPoint;
            acc += (poolReward * ACC_PRECISION) / p.totalStaked;
        }
        int256 accumulated = int256((u.amount * acc) / ACC_PRECISION);
        pending = uint256(accumulated - u.rewardDebt);
    }

    // ----- Logic -----
    function deposit(uint256 pid, uint256 amount) external whenNotPaused nonReentrant {
        PoolInfo storage p = poolInfo[pid];
        UserInfo storage u = userInfo[pid][msg.sender];
        _updatePool(pid);

        // Récolte implicite sur dépôt
        if (u.amount > 0) {
            uint256 pendingAmt = _pendingAmount(u, p);
            if (pendingAmt > 0) {
                IERC20(rewardToken).safeTransfer(msg.sender, pendingAmt);
                emit Harvest(msg.sender, pid, pendingAmt);
                if (address(p.rewarder) != address(0)) {
                    p.rewarder.onHarvest(msg.sender, pid, pendingAmt);
                }
            }
        }

        if (amount > 0) {
            p.stakeToken.safeTransferFrom(msg.sender, address(this), amount);
            p.totalStaked += amount;
            u.amount += amount;
            if (address(p.rewarder) != address(0)) {
                p.rewarder.onDeposit(msg.sender, pid, amount, u.amount);
            }
        }

        u.rewardDebt = int256((u.amount * p.accRewardPerShare) / ACC_PRECISION);
        emit Deposit(msg.sender, pid, amount);
    }

    function withdraw(uint256 pid, uint256 amount) external whenNotPaused nonReentrant {
        PoolInfo storage p = poolInfo[pid];
        UserInfo storage u = userInfo[pid][msg.sender];
        require(u.amount >= amount, "amount>stake");
        _updatePool(pid);

        uint256 pendingAmt = _pendingAmount(u, p);
        if (pendingAmt > 0) {
            IERC20(rewardToken).safeTransfer(msg.sender, pendingAmt);
            emit Harvest(msg.sender, pid, pendingAmt);
            if (address(p.rewarder) != address(0)) {
                p.rewarder.onHarvest(msg.sender, pid, pendingAmt);
            }
        }

        if (amount > 0) {
            u.amount -= amount;
            p.totalStaked -= amount;
            p.stakeToken.safeTransfer(msg.sender, amount);
            if (address(p.rewarder) != address(0)) {
                p.rewarder.onWithdraw(msg.sender, pid, amount, u.amount);
            }
        }

        u.rewardDebt = int256((u.amount * p.accRewardPerShare) / ACC_PRECISION);
        emit Withdraw(msg.sender, pid, amount);
    }

    function harvest(uint256 pid, address to) public whenNotPaused nonReentrant {
        PoolInfo storage p = poolInfo[pid];
        UserInfo storage u = userInfo[pid][msg.sender];
        _updatePool(pid);
        uint256 pendingAmt = _pendingAmount(u, p);
        u.rewardDebt = int256((u.amount * p.accRewardPerShare) / ACC_PRECISION);
        if (pendingAmt > 0) {
            IERC20(rewardToken).safeTransfer(to, pendingAmt);
            emit Harvest(msg.sender, pid, pendingAmt);
            if (address(p.rewarder) != address(0)) {
                p.rewarder.onHarvest(msg.sender, pid, pendingAmt);
            }
        }
    }

    function harvestAll(uint256[] calldata pids) external whenNotPaused nonReentrant {
        uint256 len = pids.length;
        for (uint256 i = 0; i < len; i++) {
            harvest(pids[i], msg.sender);
        }
    }

    /// @notice Retrait sans tenir compte des récompenses (en cas d'urgence)
    function emergencyWithdraw(uint256 pid) external nonReentrant {
        PoolInfo storage p = poolInfo[pid];
        UserInfo storage u = userInfo[pid][msg.sender];
        uint256 amount = u.amount;
        u.amount = 0;
        u.rewardDebt = 0;
        p.totalStaked -= amount;
        p.stakeToken.safeTransfer(msg.sender, amount);
        emit EmergencyWithdraw(msg.sender, pid, amount);
    }

    // ----- Internes -----
    function _updatePool(uint256 pid) internal {
        PoolInfo storage p = poolInfo[pid];
        if (block.timestamp <= p.lastRewardTime) return;
        if (p.totalStaked == 0 || totalAllocPoint == 0) {
            p.lastRewardTime = uint64(block.timestamp);
            return;
        }
        // 1) Tirer l'émission depuis le controller (met à jour son lastPullTime)
        uint256 emitted = controller.pull();
        if (emitted == 0) {
            p.lastRewardTime = uint64(block.timestamp);
            return;
        }
        // 2) Part de ce pool
        uint256 poolReward = (emitted * uint256(p.allocPoint)) / totalAllocPoint;
        if (poolReward > 0) {
            p.accRewardPerShare += (poolReward * ACC_PRECISION) / p.totalStaked;
        }
        p.lastRewardTime = uint64(block.timestamp);
    }

    function _pendingAmount(UserInfo storage u, PoolInfo storage p) internal view returns (uint256) {
        int256 accumulated = int256((u.amount * p.accRewardPerShare) / ACC_PRECISION);
        int256 debt = u.rewardDebt;
        if (accumulated <= debt) return 0;
        return uint256(accumulated - debt);
    }
}


