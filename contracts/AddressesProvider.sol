// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
pragma abicoder v2;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

contract AddressesProvider is Ownable2Step {
    address public REGISTRY;
    address public PRICE_ORACLE;
    address public FUNDS_MANAGER;
    address public AUCTION_HOUSE;
    address public VALIDATOR;
    address public TEAM_WALLET;
    address public FOUNDATION_WALLET;

    event Update(string name, address addr);

    constructor(
        address registry,
        address priceOracle,
        address fundsManager,
        address auctionHouse,
        address validator,
        address teamWallet,
        address foundationWallet
    ) {
        REGISTRY = registry;
        PRICE_ORACLE = priceOracle;
        FUNDS_MANAGER = fundsManager;
        AUCTION_HOUSE = auctionHouse;
        VALIDATOR = validator;
        TEAM_WALLET = teamWallet;
        FOUNDATION_WALLET = foundationWallet;
    }

    function setRegistry(address registry) external onlyOwner {
        REGISTRY = registry;
        emit Update("REGISTRY", registry);
    }

    function setPriceOracle(address priceOracle) external onlyOwner {
        PRICE_ORACLE = priceOracle;
        emit Update("PRICE_ORACLE", priceOracle);
    }

    function setFundsManager(address fundsManager) external onlyOwner {
        FUNDS_MANAGER = fundsManager;
        emit Update("FUNDS_MANAGER", fundsManager);
    }

    function setAuctionHouse(address auctionHouse) external onlyOwner {
        AUCTION_HOUSE = auctionHouse;
        emit Update("AUCTION_HOUSE", auctionHouse);
    }

    function setValidator(address validator) external onlyOwner {
        VALIDATOR = validator;
        emit Update("VALIDATOR", validator);
    }

    function setTeamWallet(address teamWallet) external onlyOwner {
        TEAM_WALLET = teamWallet;
        emit Update("TEAM_WALLET", teamWallet);
    }

    function setFoundationWallet(address foundationWallet) external onlyOwner {
        FOUNDATION_WALLET = foundationWallet;
        emit Update("FOUNDATION_WALLET", foundationWallet);
    }
}
