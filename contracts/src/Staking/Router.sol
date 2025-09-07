// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @title Router utilitaire
/// @notice Ne détient aucun fonds. Fournit un multicall pratique pour le front.
contract Router is Ownable2Step, Pausable, ReentrancyGuard {
    event Paused(address indexed by);
    event Unpaused(address indexed by);

    function pause() external onlyOwner { _pause(); emit Paused(msg.sender); }
    function unpause() external onlyOwner { _unpause(); emit Unpaused(msg.sender); }

    /// @notice Exécute une séquence d'appels arbitraires dans la même tx
    /// @dev Doit rester non-custodial; les approvals doivent être gérées en amont
    function multicall(bytes[] calldata data, address[] calldata targets)
        external
        whenNotPaused
        nonReentrant
        returns (bytes[] memory results)
    {
        require(data.length == targets.length, "len");
        uint256 len = data.length;
        results = new bytes[](len);
        for (uint256 i = 0; i < len; i++) {
            (bool ok, bytes memory ret) = targets[i].call(data[i]);
            require(ok, "call failed");
            results[i] = ret;
        }
    }
}


