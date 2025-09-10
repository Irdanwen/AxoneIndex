// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Interface EmissionController
/// @notice Interface minimale pour piloter l'émission du token de récompense
interface IEmissionController {
    /// @notice Adresse du token de récompense distribué
    function rewardToken() external view returns (address);

    /// @notice Débit de récompense par seconde
    function rewardPerSecond() external view returns (uint256);

    /// @notice Dernier timestamp de pull effectué
    function lastPullTime() external view returns (uint64);

    /// @notice Retourne la quantité en attente d'émission depuis le dernier pull
    function pendingEmission() external view returns (uint256);

    /// @notice Appelable uniquement par le RewardsHub configuré
    /// @return mintedOrSent Montant réellement frappé/transféré au hub
    function pull() external returns (uint256 mintedOrSent);
}



