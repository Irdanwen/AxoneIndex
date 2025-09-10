// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Interface minimale pour un token ERC20 mintable
interface IMintable {
    function mint(address to, uint256 amount) external;
}



