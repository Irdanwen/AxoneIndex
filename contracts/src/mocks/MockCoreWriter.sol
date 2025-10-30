// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockCoreWriter {
    event Raw(bytes data);
    bytes public lastData;

    function sendRawAction(bytes calldata data) external {
        lastData = data;
        emit Raw(data);
    }
}


