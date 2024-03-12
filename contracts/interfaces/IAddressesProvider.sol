// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IAddressesProvider {
    function REGISTRY() external view returns (address);

    function PRICE_ORACLE() external view returns (address);

    function FUNDS_MANAGER() external view returns (address);

    function AUCTION_HOUSE() external view returns (address);

    function TEAM() external view returns (address);

    function FOUNDATION() external view returns (address);

    function TREASURY() external view returns (address);

    // ADMIN ONLY
    function setRegistry(address registry) external;

    function setPriceOracle(address priceOracle) external;

    function setFundsManager(address fundsManager) external;

    function setAuctionHouse(address auctionHouse) external;

    function setTeam(address team) external;

    function setFoundation(address foundation) external;

    function setTreasury(address treasury) external;
}
