// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library SystemAddressLib {
    // Adresse système spéciale pour HYPE natif selon la documentation
    address public constant HYPE_SYSTEM_ADDRESS = 0x2222222222222222222222222222222222222222;
    
    /// @notice Calcule l'adresse système Core pour un tokenId spot
    /// @dev Format: premier octet 0x20, le reste zéro sauf l'index tokenId en big-endian
    /// @param tokenId Le token ID pour lequel calculer l'adresse système
    /// @return systemAddress L'adresse système Core correspondante
    function getSpotSystemAddress(uint64 tokenId) internal pure returns (address) {
        // Toujours calculer 0x20-prefixed + tokenId (tokenId peut être 0, ex: USDC)
        bytes20 addr = bytes20(uint160(uint256(0x20) << 152)); // premier octet 0x20
        addr |= bytes20(uint160(tokenId)); // tokenId dans les derniers octets
        return address(addr);
    }
    
    /// @notice Vérifie si une adresse est une adresse système Core spot (préfixe 0x20)
    function isSystemAddress(address addr) internal pure returns (bool) {
        return (uint160(addr) >> 152) == 0x20;
    }
    
    /// @notice Extrait le tokenId d'une adresse système Core spot
    /// @dev Rejette si l'adresse n'est pas une adresse système spot (ex: HYPE natif)
    function getTokenIdFromSystemAddress(address systemAddress) internal pure returns (uint64) {
        require(isSystemAddress(systemAddress), "not spot system address");
        return uint64(uint160(systemAddress));
    }
}
