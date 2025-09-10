// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Interface Rewarder secondaire (bonus token)
/// @notice Hooks optionnels invoqués par le RewardsHub
interface IRewarder {
    /// @notice Notifie un dépôt utilisateur
    function onDeposit(address user, uint256 pid, uint256 amount, uint256 newAmount) external;

    /// @notice Notifie un retrait utilisateur
    function onWithdraw(address user, uint256 pid, uint256 amount, uint256 newAmount) external;

    /// @notice Notifie une récolte (harvest) des récompenses principales
    function onHarvest(address user, uint256 pid, uint256 harvested) external;
}



