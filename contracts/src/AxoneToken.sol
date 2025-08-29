// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AxoneToken is ERC20Burnable, Ownable {
    constructor(address initialOwner) Ownable(initialOwner) ERC20("Axone Token", "AXONE") {
        _mint(initialOwner, 1_000_000 ether);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
