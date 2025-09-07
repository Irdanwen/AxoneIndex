// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

import {IRewarder} from "./interfaces/IRewarder.sol";

/// @title RewarderExample
/// @notice Exemple minimal de rewarder secondaire (bonus token proportionnel au montant)
contract RewarderExample is Ownable2Step, IRewarder {
    using SafeERC20 for IERC20;

    IERC20 public immutable bonusToken;
    uint256 public bonusPerShareStored; // simple accumulateur optionnel

    event BonusPaid(address indexed user, uint256 indexed pid, uint256 amount);

    constructor(IERC20 bonusToken_) {
        bonusToken = bonusToken_;
    }

    function onDeposit(address user, uint256 pid, uint256 amount, uint256 /*newAmount*/ ) external override {
        // Exemple: pas de logique complexe, pourrait distribuer un airdrop fixe
        if (amount == 0) return;
        uint256 tip = amount / 10_000; // 0,01% symbolique
        if (tip > 0) {
            bonusToken.safeTransfer(user, tip);
            emit BonusPaid(user, pid, tip);
        }
    }

    function onWithdraw(address user, uint256 pid, uint256 amount, uint256 /*newAmount*/ ) external override {
        if (amount == 0) return;
        // Rien par défaut
    }

    function onHarvest(address user, uint256 pid, uint256 harvested) external override {
        if (harvested == 0) return;
        uint256 tip = harvested / 20_000; // 0,005%
        if (tip > 0) {
            bonusToken.safeTransfer(user, tip);
            emit BonusPaid(user, pid, tip);
        }
    }
}


