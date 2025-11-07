// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library HLConstants {
    // Time-in-force
    uint8 internal constant TIF_IOC = 3;

    // Spot asset ID offset (Hyperliquid unified asset ids)
    uint32 internal constant SPOT_ASSET_OFFSET = 10000;

    // Encoding helpers (SPOT-only). We prefix with a simple header: version=1, action id
    function _header(uint8 action) private pure returns (bytes memory) {
        return abi.encodePacked(uint8(1), action);
    }

    // Action 2: Spot Limit Order (IOC)
    // asset: spot id (uint32)
    // isBuy: true if buy
    // limitPxRaw: price exprimé en pxDecimals natifs Hyperliquid
    // szInSzDecimals: base size in token szDecimals
    // tif: time-in-force (IOC)
    // cloid: client order id
    function encodeSpotLimitOrder(
        uint32 asset,
        bool isBuy,
        uint64 limitPxRaw,
        uint64 szInSzDecimals,
        uint8 tif,
        uint128 cloid
    ) internal pure returns (bytes memory) {
        return abi.encodePacked(
            _header(2),
            abi.encode(asset, isBuy, limitPxRaw, szInSzDecimals, tif, cloid)
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
}

