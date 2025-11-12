// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library HLConstants {
    // Time-in-force
    uint8 internal constant TIF_IOC = 3;

    // CoreWriter action identifiers
    uint24 internal constant ACTION_LIMIT_ORDER = 1;
    uint24 internal constant ACTION_SPOT_SEND = 6;

    // Spot asset ID offset (Hyperliquid unified asset ids)
    uint32 internal constant SPOT_ASSET_OFFSET = 10000;

    // Encoding helpers according to HyperEVM/HyperCore documentation
    // Format: [0]=0x01, [1..3]=ActionID (big-endian), [4..]=abi.encode(...)
    function _encodeAction(uint24 actionId, bytes memory abiEncoded) private pure returns (bytes memory data) {
        data = new bytes(4 + abiEncoded.length);
        data[0] = 0x01;
        data[1] = bytes1(uint8(actionId >> 16));
        data[2] = bytes1(uint8(actionId >> 8));
        data[3] = bytes1(uint8(actionId));
        for (uint256 i = 0; i < abiEncoded.length; i++) {
            data[4 + i] = abiEncoded[i];
        }
    }

    // Action 1: Spot Limit Order (IOC)
    // asset: spot id (uint32)
    // isBuy: true if buy
    // limitPx1e8: prix humain * 1e8 (quantifié)
    // sz1e8: taille base humaine * 1e8
    // reduceOnly: true si l'ordre ne doit que réduire la position
    // encodedTif: time-in-force encodé
    // cloid: client order id
    function encodeSpotLimitOrder(
        uint24 actionId,
        uint32 asset,
        bool isBuy,
        uint64 limitPx1e8,
        uint64 sz1e8,
        bool reduceOnly,
        uint8 encodedTif,
        uint128 cloid
    ) internal pure returns (bytes memory) {
        bytes memory abiEncoded = abi.encode(asset, isBuy, limitPx1e8, sz1e8, reduceOnly, encodedTif, cloid);
        return _encodeAction(actionId, abiEncoded);
    }

    // Action 6: Spot Send (Core -> EVM credit)
    function encodeSpotSend(
        uint24 actionId,
        address destination,
        uint64 tokenId,
        uint64 amount1e8
    ) internal pure returns (bytes memory) {
        bytes memory abiEncoded = abi.encode(destination, tokenId, amount1e8);
        return _encodeAction(actionId, abiEncoded);
    }
}

