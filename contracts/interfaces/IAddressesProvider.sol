// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
pragma abicoder v2;

interface IAddressesProvider {
    function REGISTRY() external view returns (address);

    function PRICE_ORACLE() external view returns (address);

    function FUNDS_MANAGER() external view returns (address);

    function AUCTION_HOUSE() external view returns (address);

    function VALIDATOR() external view returns (address);

    function TEAM_WALLET() external view returns (address);

    function FOUNDATION_WALLET() external view returns (address);

    // ADMIN ONLY
    function setRegistry(address registry) external;

    function setPriceOracle(address priceOracle) external;

    function setFundsManager(address fundsManager) external;

    function setAuctionHouse(address auctionHouse) external;

    function setValidator(address validator) external;

    function setTeamWallet(address teamWallet) external;

    function setFoundationWallet(address foundationWallet) external;
}
