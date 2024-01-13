// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
pragma abicoder v2;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {Nope, InputError} from "./common/Errors.sol";

import "hardhat/console.sol";

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

    /**
     * @notice Count the number of emojis in a string
     * @dev forced to loop over all members of the name
     */
    function countEmojisAndCheckForInvalidCharacters(
        string[] calldata chars
    ) public view returns (uint256 emojis) {
        bytes32 space = keccak256(abi.encode(" "));
        bytes32 empty = keccak256(abi.encode(""));
        bytes32 fullstop = keccak256(abi.encode("."));
        for (uint256 i = 0; i < chars.length; i++) {
            bytes memory member = bytes(chars[i]);
            if (member.length > 1) {
                if (isEmoji[member]) {
                    emojis++;
                } else {
                    revert InputError(chars[i]);
                }
            } else {
                bytes32 encodedMember = keccak256(abi.encode(chars[i]));
                if (encodedMember == space || encodedMember == empty || encodedMember == fullstop) {
                    revert Nope();
                }
            }
        }
    }

    function dollarPriceForNamePerYear(
        string[] calldata chars
    ) public view returns (uint256 amount) {
        uint emojis = countEmojisAndCheckForInvalidCharacters(chars);
        if (chars.length == 1) {
            amount = 999;
        } else if (chars.length == 2) {
            amount = 690;
        } else if (chars.length == 3) {
            amount = 420;
        } else if (chars.length == 4) {
            amount = 169;
        } else {
            amount = 25;
        }
        amount *= 1e18;
        // cannot mint single emojis on your own
        if (chars.length == 1 && emojis == 1) {
            revert Nope("cannot mint single emojis on your own");
        }
        if (chars.length == emojis) {
            amount += (amount * 69) / 100;
        } else if (emojis > 0) {
            amount += (amount * 25) / 100;
        }
    }

    function price(
        string[] calldata name,
        uint duration,
        address asset
    ) external view returns (uint256 amount) {
        uint assetPrice = _fetchAssetPrice(asset); // X base 1e18
        uint namePricePerYear = dollarPriceForNamePerYear(name); // Y base 1e18
        if (duration == 1) {
            amount = ((namePricePerYear * 1e18) / assetPrice);
        } else {
            amount = ((namePricePerYear * 1e18) / assetPrice);
            for (uint i = 2; i <= duration; ++i) {
                amount += (namePricePerYear * 110 ** i) / 100 ** i;
            }
        }
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
