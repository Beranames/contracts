// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;
pragma abicoder v2;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Multicall} from "@openzeppelin/contracts/utils/Multicall.sol";

contract AddressesProvider is Ownable2Step, Multicall {
    address public REGISTRY;
    address public PRICE_ORACLE;
    address public FUNDS_MANAGER;
    address public AUCTION_HOUSE;
    address public TEAM;
    address public FOUNDATION;
    address public TREASURY;

    event Update(string name, address addr);

    constructor(
        address registry,
        address priceOracle,
        address fundsManager,
        address auctionHouse,
        address team,
        address foundation,
        address treasury
    ) {
        REGISTRY = registry;
        PRICE_ORACLE = priceOracle;
        FUNDS_MANAGER = fundsManager;
        AUCTION_HOUSE = auctionHouse;
        TEAM = team;
        FOUNDATION = foundation;
        TREASURY = treasury;
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

    function setTeam(address teamWallet) external onlyOwner {
        TEAM = teamWallet;
        emit Update("TEAM", teamWallet);
    }

    function setFoundation(address foundationWallet) external onlyOwner {
        FOUNDATION = foundationWallet;
        emit Update("FOUNDATION", foundationWallet);
    }

    function setTreasury(address treasury) external onlyOwner {
        TREASURY = treasury;
        emit Update("TREASURY", treasury);
    }
}
