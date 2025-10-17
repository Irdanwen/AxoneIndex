// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library HLConstants {
    // Time-in-force
    uint8 internal constant TIF_IOC = 3;

    // Encoding helpers. We prefix with a simple header: version=1, action id
    function _header(uint8 action) private pure returns (bytes memory) {
        return abi.encodePacked(uint8(1), action);
    }

    // Action 1: Limit Order (perps)
    // asset: perp id (uint32)
    // isBuy: true if buy
    // limitPx1e8: price in 1e8
    // sz1e8: size in 1e8 (absolute)
    // reduceOnly: true to only reduce exposure
    // tif: time-in-force (e.g., IOC=3)
    // cloid: client order id
    function encodeLimitOrder(
        uint32 asset,
        bool isBuy,
        uint64 limitPx1e8,
        uint64 sz1e8,
        bool reduceOnly,
        uint8 tif,
        uint128 cloid
    ) internal pure returns (bytes memory) {
        return abi.encodePacked(
            _header(1),
            abi.encode(asset, isBuy, limitPx1e8, sz1e8, reduceOnly, tif, cloid)
        );
    }

    // Action 6: Spot Send (Core -> EVM credit)
    function encodeSpotSend(
        address destination,
        uint64 tokenId,
        uint64 amount1e8
    ) internal pure returns (bytes memory) {
        return abi.encodePacked(_header(6), abi.encode(destination, tokenId, amount1e8));
    }

    // Action 7: USD class transfer between spot and perp
    // toPerp=true moves USD from spot to perp; false moves from perp to spot
    function encodeUsdClassTransfer(uint64 amount1e8, bool toPerp)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodePacked(_header(7), abi.encode(amount1e8, toPerp));
    }
}

