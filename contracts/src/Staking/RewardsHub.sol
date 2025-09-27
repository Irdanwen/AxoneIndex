// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IEmissionController} from "./interfaces/IEmissionController.sol";
import {IRewarder} from "./interfaces/IRewarder.sol";

/// @title RewardsHub
/// @notice Contrat central de staking des shares des différents vaults (VaultContract.sol)
/// @notice Distribue un token de reward (AxoneToken.sol) fourni par l'EmissionController
/// @notice Architecture MasterChef mono-reward avec pools dynamiques
contract RewardsHub is Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Précision pour les calculs de récompense (1e12 pour optimiser le gas)
    uint256 public constant ACC_PRECISION = 1e12;

    /// @notice Contrôleur d'émission des récompenses
    IEmissionController public controller;

    /// @notice Token de récompense distribué (raccourci vers controller.rewardToken())
    address public rewardToken;

    /// @notice Somme totale des points d'allocation de tous les pools
    uint256 public totalAllocPoint;

    /// @notice Informations d'un pool de staking
    struct PoolInfo {
        IERC20 stakeToken;           // Token de parts du vault (shares)
        uint128 allocPoint;          // Pondération du pool
        uint64 lastRewardTime;       // Timestamp de la dernière mise à jour
        uint256 accRewardPerShare;   // Récompenses accumulées par share (précision ACC_PRECISION)
        uint256 totalStaked;         // Somme des tokens stakés dans le pool
    }

    /// @notice Informations d'un utilisateur dans un pool
    struct UserInfo {
        uint256 amount;              // Montant staké par l'utilisateur
        int256 rewardDebt;           // Dette de récompense (signée pour précision)
    }

    /// @notice Liste des pools de staking
    PoolInfo[] public poolInfo;

    /// @notice Informations utilisateur par pool
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    /// @notice Rewarder optionnel par pool (pour bonus tokens)
    mapping(uint256 => IRewarder) public poolRewarders;

    /// @dev Événements (compat Hyperscan, noms courts et indexés)
    event PoolAdded(uint256 indexed pid, address indexed stakeToken, uint128 allocPoint);
    event PoolUpdated(uint256 indexed pid, uint128 oldAlloc, uint128 newAlloc);
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event ControllerSet(address indexed oldC, address indexed newC);
    event PoolRewarderSet(uint256 indexed pid, address indexed rewarder);
    // Paused/Unpaused fournis par Pausable d'OpenZeppelin

    constructor(address controller_) Ownable(msg.sender) {
        require(controller_ != address(0), "controller=0");
        controller = IEmissionController(controller_);
        rewardToken = controller.rewardToken();
    }

    /// @notice Nombre total de pools
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    /// @notice Ajoute un nouveau pool de staking
    /// @param stakeToken Token de parts du vault à staker
    /// @param allocPoint Points d'allocation du pool
    function addPool(IERC20 stakeToken, uint128 allocPoint) external onlyOwner {
        require(address(stakeToken) != address(0), "stakeToken=0");
        require(allocPoint > 0, "allocPoint=0");
        
        // Mise à jour de tous les pools existants avant d'ajouter le nouveau
        massUpdatePools();
        
        totalAllocPoint += allocPoint;
        
        poolInfo.push(PoolInfo({
            stakeToken: stakeToken,
            allocPoint: allocPoint,
            lastRewardTime: uint64(block.timestamp),
            accRewardPerShare: 0,
            totalStaked: 0
        }));
        
        emit PoolAdded(poolInfo.length - 1, address(stakeToken), allocPoint);
    }

    /// @notice Met à jour les points d'allocation d'un pool
    /// @param pid ID du pool
    /// @param newAllocPoint Nouveaux points d'allocation
    function setAllocPoint(uint256 pid, uint128 newAllocPoint) external onlyOwner {
        require(pid < poolInfo.length, "pid invalid");
        require(newAllocPoint > 0, "allocPoint=0");
        
        massUpdatePools();
        
        PoolInfo storage pool = poolInfo[pid];
        uint128 oldAllocPoint = pool.allocPoint;
        
        totalAllocPoint = totalAllocPoint - oldAllocPoint + newAllocPoint;
        pool.allocPoint = newAllocPoint;
        
        emit PoolUpdated(pid, oldAllocPoint, newAllocPoint);
    }

    /// @notice Configure un rewarder optionnel pour un pool
    /// @param pid ID du pool
    /// @param rewarder Adresse du rewarder (peut être address(0) pour désactiver)
    function setPoolRewarder(uint256 pid, IRewarder rewarder) external onlyOwner {
        require(pid < poolInfo.length, "pid invalid");
        poolRewarders[pid] = rewarder;
        emit PoolRewarderSet(pid, address(rewarder));
    }

    /// @notice Met à jour le contrôleur d'émission
    /// @param newController Nouveau contrôleur
    function setController(IEmissionController newController) external onlyOwner {
        require(address(newController) != address(0), "controller=0");
        address oldController = address(controller);
        controller = newController;
        rewardToken = newController.rewardToken();
        emit ControllerSet(oldController, address(newController));
    }

    /// @notice Met à jour tous les pools (appelé avant modifications importantes)
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    /// @notice Met à jour un pool spécifique
    /// @param pid ID du pool à mettre à jour
    function updatePool(uint256 pid) public {
        require(pid < poolInfo.length, "pid invalid");
        
        PoolInfo storage pool = poolInfo[pid];
        if (block.timestamp <= pool.lastRewardTime) {
            return;
        }
        
        if (pool.totalStaked == 0) {
            pool.lastRewardTime = uint64(block.timestamp);
            return;
        }
        
        // Calculer les récompenses depuis la dernière mise à jour
        uint256 elapsed = block.timestamp - pool.lastRewardTime;
        uint256 poolReward = (elapsed * controller.rewardPerSecond() * pool.allocPoint) / totalAllocPoint;
        
        // Demander au contrôleur de fournir les récompenses
        if (poolReward > 0) {
            controller.pull();
        }
        
        // Mettre à jour les récompenses accumulées par share
        pool.accRewardPerShare += (poolReward * ACC_PRECISION) / pool.totalStaked;
        pool.lastRewardTime = uint64(block.timestamp);
    }

    /// @notice Calcule les récompenses en attente pour un utilisateur
    /// @param pid ID du pool
    /// @param user Adresse de l'utilisateur
    /// @return pending Récompenses en attente
    function pendingReward(uint256 pid, address user) external view returns (uint256 pending) {
        require(pid < poolInfo.length, "pid invalid");
        
        PoolInfo memory pool = poolInfo[pid];
        UserInfo memory u = userInfo[pid][user];
        
        if (block.timestamp > pool.lastRewardTime && pool.totalStaked > 0) {
            uint256 elapsed = block.timestamp - pool.lastRewardTime;
            uint256 poolReward = (elapsed * controller.rewardPerSecond() * pool.allocPoint) / totalAllocPoint;
            uint256 accRewardPerShare = pool.accRewardPerShare + (poolReward * ACC_PRECISION) / pool.totalStaked;
            pending = (u.amount * accRewardPerShare) / ACC_PRECISION - uint256(u.rewardDebt);
        } else {
            pending = (u.amount * pool.accRewardPerShare) / ACC_PRECISION - uint256(u.rewardDebt);
        }
    }

    /// @notice Dépôt de tokens dans un pool
    /// @param pid ID du pool
    /// @param amount Montant à déposer
    function deposit(uint256 pid, uint256 amount) external nonReentrant whenNotPaused {
        require(pid < poolInfo.length, "pid invalid");
        require(amount > 0, "amount=0");
        
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][msg.sender];
        
        updatePool(pid);
        
        // Récolter les récompenses en attente
        if (user.amount > 0) {
            uint256 pending = (user.amount * pool.accRewardPerShare) / ACC_PRECISION - uint256(user.rewardDebt);
            if (pending > 0) {
                _safeRewardTransfer(msg.sender, pending);
                emit Harvest(msg.sender, pid, pending);
            }
        }
        
        // Dépôt des nouveaux tokens
        if (amount > 0) {
            pool.stakeToken.safeTransferFrom(msg.sender, address(this), amount);
            user.amount += amount;
            pool.totalStaked += amount;
        }
        
        user.rewardDebt = int256((user.amount * pool.accRewardPerShare) / ACC_PRECISION);
        
        // Notifier le rewarder optionnel
        IRewarder rewarder = poolRewarders[pid];
        if (address(rewarder) != address(0)) {
            rewarder.onDeposit(msg.sender, pid, 0, amount);
        }
        
        emit Deposit(msg.sender, pid, amount);
    }

    /// @notice Retrait de tokens d'un pool
    /// @param pid ID du pool
    /// @param amount Montant à retirer
    function withdraw(uint256 pid, uint256 amount) external nonReentrant whenNotPaused {
        require(pid < poolInfo.length, "pid invalid");
        require(amount > 0, "amount=0");
        
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][msg.sender];
        require(user.amount >= amount, "insufficient balance");
        
        updatePool(pid);
        
        // Récolter les récompenses en attente
        uint256 pending = (user.amount * pool.accRewardPerShare) / ACC_PRECISION - uint256(user.rewardDebt);
        if (pending > 0) {
            _safeRewardTransfer(msg.sender, pending);
            emit Harvest(msg.sender, pid, pending);
        }
        
        // Retrait des tokens
        user.amount -= amount;
        pool.totalStaked -= amount;
        pool.stakeToken.safeTransfer(msg.sender, amount);
        
        user.rewardDebt = int256((user.amount * pool.accRewardPerShare) / ACC_PRECISION);
        
        // Notifier le rewarder optionnel
        IRewarder rewarder = poolRewarders[pid];
        if (address(rewarder) != address(0)) {
            rewarder.onWithdraw(msg.sender, pid, amount, user.amount);
        }
        
        emit Withdraw(msg.sender, pid, amount);
    }

    /// @notice Récolte des récompenses sans retirer de tokens
    /// @param pid ID du pool
    /// @param to Adresse destinataire des récompenses
    function harvest(uint256 pid, address to) external nonReentrant whenNotPaused {
        require(pid < poolInfo.length, "pid invalid");
        require(to != address(0), "to=0");
        
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][msg.sender];
        
        updatePool(pid);
        
        uint256 pending = (user.amount * pool.accRewardPerShare) / ACC_PRECISION - uint256(user.rewardDebt);
        if (pending > 0) {
            user.rewardDebt = int256((user.amount * pool.accRewardPerShare) / ACC_PRECISION);
            _safeRewardTransfer(to, pending);
            emit Harvest(msg.sender, pid, pending);
            
            // Notifier le rewarder optionnel
            IRewarder rewarder = poolRewarders[pid];
            if (address(rewarder) != address(0)) {
                rewarder.onHarvest(msg.sender, pid, pending);
            }
        }
    }

    /// @notice Retrait d'urgence sans récolte des récompenses
    /// @param pid ID du pool
    function emergencyWithdraw(uint256 pid) external nonReentrant {
        require(pid < poolInfo.length, "pid invalid");
        
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][msg.sender];
        
        uint256 amount = user.amount;
        require(amount > 0, "no stake");
        
        user.amount = 0;
        user.rewardDebt = 0;
        pool.totalStaked -= amount;
        
        pool.stakeToken.safeTransfer(msg.sender, amount);
        emit EmergencyWithdraw(msg.sender, pid, amount);
    }

    /// @notice Transfert sécurisé des récompenses
    /// @param to Adresse destinataire
    /// @param amount Montant à transférer
    function _safeRewardTransfer(address to, uint256 amount) internal {
        uint256 balance = IERC20(rewardToken).balanceOf(address(this));
        if (amount > balance) {
            amount = balance;
        }
        if (amount > 0) {
            IERC20(rewardToken).safeTransfer(to, amount);
        }
    }

    /// @notice Pause du contrat (arrêt d'urgence)
    function pause() external onlyOwner { _pause(); }

    /// @notice Reprise du contrat
    function unpause() external onlyOwner { _unpause(); }

    /// @notice Récupération d'urgence de tokens (sauf rewardToken)
    /// @param token Adresse du token à récupérer
    /// @param amount Montant à récupérer
    /// @param to Adresse destinataire
    function emergencyTokenRecovery(IERC20 token, uint256 amount, address to) external onlyOwner {
        require(to != address(0), "to=0");
        require(address(token) != rewardToken, "cannot recover reward token");
        token.safeTransfer(to, amount);
    }
}
