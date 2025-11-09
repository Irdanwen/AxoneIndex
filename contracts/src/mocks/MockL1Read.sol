// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockL1Read {
    struct SpotBalance { uint64 total; uint64 hold; uint64 entryNtl; }
    struct TokenInfo {
        string name;
        uint64[] spots;
        uint64 deployerTradingFeeShare;
        address deployer;
        address evmContract;
        uint8 szDecimals;
        uint8 weiDecimals;
        int8 evmExtraWeiDecimals;
    }
    struct Bbo { uint64 bid; uint64 ask; }
    struct SpotInfo { string name; uint64[2] tokens; }

    mapping(address => mapping(uint64 => SpotBalance)) public spotBalances;
    mapping(uint32 => uint64) public spotPxRaw;
    mapping(uint32 => TokenInfo) public tokenInfos;
    mapping(uint32 => Bbo) public bboData;
    mapping(uint32 => SpotInfo) public spotInfos;

    function setSpotBalance(address user, uint64 token, uint64 total) external {
        spotBalances[user][token] = SpotBalance(total, 0, 0);
    }

    function setSpotPx(uint32 index, uint64 rawPx) external { spotPxRaw[index] = rawPx; }

    function setTokenInfo(
        uint32 token,
        string calldata name,
        uint8 szDecimals,
        uint8 weiDecimals
    ) external {
        tokenInfos[token] = TokenInfo(name, new uint64[](0), 0, address(0), address(0), szDecimals, weiDecimals, 0);
    }

    function setBbo(uint32 asset, uint64 bid, uint64 ask) external { bboData[asset] = Bbo(bid, ask); }
    function setSpotInfo(uint32 spot, string calldata name, uint64 baseTokenId, uint64 quoteTokenId) external {
        spotInfos[spot] = SpotInfo(name, [baseTokenId, quoteTokenId]);
    }

    // Interface-compatible functions used by handler/lib
    function spotBalance(address user, uint64 token) external view returns (SpotBalance memory) {
        return spotBalances[user][token];
    }

    function spotPx(uint32 index) external view returns (uint64) { return spotPxRaw[index]; }

    function tokenInfo(uint32 token) external view returns (TokenInfo memory) { return tokenInfos[token]; }

    function bbo(uint32 asset) external view returns (Bbo memory) { return bboData[asset]; }
    function spotInfo(uint32 spot) external view returns (SpotInfo memory) {
        return spotInfos[spot];
    }
}


