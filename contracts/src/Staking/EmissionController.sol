// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IMintable} from "./interfaces/IMintable.sol";

/// @title EmissionController
/// @notice Contrôle l'émission d'un token de récompense (mint ou drip) au profit d'un RewardsHub
contract EmissionController is Ownable2Step, Pausable {
    using SafeERC20 for IERC20;

    /// @notice Token de récompense distribué
    address public immutable rewardToken;

    /// @notice Adresse du RewardsHub autorisé à appeler pull()
    address public rewardsHub;

    /// @notice Débit d'émission par seconde
    uint256 public rewardPerSecond;

    /// @notice Timestamp du dernier pull
    uint64 public lastPullTime;

    /// @notice Mode de frappe (mint) actif si true, sinon mode drip (transfert depuis réserve)
    bool public isMintMode;

    /// @dev Événements (compat Hyperscan, noms courts et indexés)
    event RewardsHubSet(address indexed hub);
    event RewardPerSecondSet(uint256 oldR, uint256 newR);
    event Pulled(address indexed to, uint256 amount, uint64 fromTs, uint64 toTs);
    event MintModeToggled(bool isMint);

    constructor(address rewardToken_, uint256 rewardPerSecond_, bool isMintMode_) Ownable(msg.sender) {
        require(rewardToken_ != address(0), "token=0");
        rewardToken = rewardToken_;
        rewardPerSecond = rewardPerSecond_;
        isMintMode = isMintMode_;
        lastPullTime = uint64(block.timestamp);
    }

    /// @notice Configure le hub une seule fois
    function setRewardsHub(address hub) external onlyOwner {
        require(rewardsHub == address(0), "hub set");
        require(hub != address(0), "hub=0");
        rewardsHub = hub;
        emit RewardsHubSet(hub);
    }

    function setRewardPerSecond(uint256 newR) external onlyOwner {
        uint256 old = rewardPerSecond;
        rewardPerSecond = newR;
        emit RewardPerSecondSet(old, newR);
    }

    function toggleMintMode(bool on) external onlyOwner {
        isMintMode = on;
        emit MintModeToggled(on);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /// @notice Émission en attente depuis le dernier pull
    function pendingEmission() public view returns (uint256) {
        uint256 elapsed = block.timestamp - uint256(lastPullTime);
        return elapsed * rewardPerSecond;
    }

    /// @notice Appelable uniquement par le RewardsHub configuré
    function pull() external whenNotPaused returns (uint256 mintedOrSent) {
        require(msg.sender == rewardsHub, "auth");
        uint64 fromTs = lastPullTime;
        uint64 toTs = uint64(block.timestamp);
        if (toTs <= fromTs) return 0;
        uint256 amount = (uint256(toTs) - uint256(fromTs)) * rewardPerSecond;
        lastPullTime = toTs;

        if (amount == 0) {
            emit Pulled(rewardsHub, 0, fromTs, toTs);
            return 0;
        }

        if (isMintMode) {
            IMintable(rewardToken).mint(rewardsHub, amount);
            mintedOrSent = amount;
        } else {
            IERC20(rewardToken).safeTransfer(rewardsHub, amount);
            mintedOrSent = amount;
        }

        emit Pulled(rewardsHub, mintedOrSent, fromTs, toTs);
    }
}



