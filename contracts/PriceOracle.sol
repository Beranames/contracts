// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
pragma abicoder v2;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

import "hardhat/console.sol";

error Nope();

contract PriceOracle is Ownable2Step {
    mapping(bytes => bool) public isEmoji;
    mapping(address => address) public priceFeeds; // asset => priceFeed

    constructor() {
        isEmoji[unicode"🐻"] = true;
        isEmoji[unicode"🪪"] = true;
    }

    function setEmojis(string[] calldata emojis) external onlyOwner {
        for (uint256 i = 0; i < emojis.length; i++) {
            isEmoji[bytes(emojis[i])] = true;
        }
    }

    function countEmojis(
        string[] calldata chars
    ) public view returns (uint256 emojis) {
        for (uint256 i = 0; i < chars.length; i++) {
            if (bytes(chars[i]).length > 1) {
                if (isEmoji[bytes(chars[i])]) {
                    emojis++;
                } else {
                    revert Nope();
                }
            }
        }
    }

    function dollarPriceForNamePerYear(
        string[] calldata chars
    ) public view returns (uint256 amount) {
        uint emojis = countEmojis(chars);
        if (chars.length == 1) {
            amount = 999;
        } else if (chars.length == 2) {
            amount = 690;
        } else if (chars.length == 3) {
            amount = 450;
        } else if (chars.length == 4) {
            amount = 80;
        } else {
            amount = 25;
        }
        amount *= 1e18;
        // cannot mint single emojis on your own
        if (chars.length == 1 && emojis == 1) {
            revert Nope();
        }
        if (chars.length == emojis) {
            amount = (amount * 69) / 100;
        } else if (emojis > 0) {
            amount = (amount * 25) / 100;
        }
    }

    function price(
        string[] calldata name,
        uint duration,
        address asset
    ) external view returns (uint256 amount) {
        uint assetPrice = _fetchAssetPrice(asset); // X * 1e18
        uint namePricePerYear = dollarPriceForNamePerYear(name); // Y * 1e18
        if (duration == 1) {
            amount = (namePricePerYear * assetPrice) / 1e18; // (Y*1e18 * X1e18) / 1e18
        } else {
            amount =
                namePricePerYear *
                ((duration - 1) + ((110) ** duration / 100 ** duration));
        }
        console.logUint(amount);
    }

    /**
     * @notice Fetch the price of an asset in USD
     * @param asset - The address of the asset
     * @return assetPrice price of the asset in USD (18 decimals)
     */
    function _fetchAssetPrice(
        address asset
    ) internal view returns (uint256 assetPrice) {
        // TODO - fetch real price
        // AggregatorV3Interface(priceFeeds[asset]).latestRoundData();
        // (, int256 assetPriceInt, , , ) = AggregatorV3Interface(
        //     priceFeeds[asset]
        // ).latestRoundData();
        // assetPrice = uint256(assetPriceInt);
        // console.logUint(assetPrice);
        return 1e18;
    }

    function setAssetOracle(address asset, address oracle) external onlyOwner {
        priceFeeds[asset] = oracle;
    }
}
