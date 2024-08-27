// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract PriceOracle is Ownable2Step {
    error Nope();
    mapping(bytes => bool) public isEmoji;

    constructor() {
        isEmoji[unicode"🐻"] = true;
        isEmoji[unicode"🪪"] = true;
    }

    function setEmojis(string[] calldata emojis) external onlyOwner {
        uint len = emojis.length;
        for (uint256 i = 0; i < len; ++i) {
            isEmoji[bytes(emojis[i])] = true;
        }
    }

    // In bartio, we have a BERA price and a discount on the yearly plan for more than one year
    function price(
        string[] calldata name,
        uint duration
    ) external view returns (uint256 amount) {
        uint beraPerYear_ = beraPerYear(name);
        if (duration == 2) {
            beraPerYear_ = beraPerYear_ * 95 / 100; // 5% discount
        } else if (duration == 3) {
            beraPerYear_ = beraPerYear_ * 85 / 100; // 15% discount
        } else if (duration == 4) {
            beraPerYear_ = beraPerYear_ * 70 / 100; // 30% discount
        } else if (duration >= 5) {
            beraPerYear_ = beraPerYear_ * 60 / 100; // 40% discount
        }
        return beraPerYear_ * duration;
    }

    function beraPerYear(
        string[] calldata chars
    ) public view returns (uint256 amount) {
        uint emojis = countEmojisAndCheckForInvalidCharacters(chars);
        if (chars.length == 1 && emojis == 1) {
            revert Nope();
        }

        if (chars.length == 1) {
            amount = 16;
        } else if (chars.length == 2) {
            amount = 8;
        } else if (chars.length == 3) {
            amount = 4;
        } else if (chars.length == 4) {
            amount = 2;
        } else {
            amount = 1;
        }
        
        return amount;
    }

    /**
     * @notice Count the number of emojis in a string
     * @dev forced to loop over all members of the name
     */
    function countEmojisAndCheckForInvalidCharacters(
        string[] calldata chars
    ) public view returns (uint256 emojis) {
        // CAN BE CONSTANT
        bytes32 space = keccak256(abi.encode(" "));
        bytes32 empty = keccak256(abi.encode(""));
        bytes32 fullstop = keccak256(abi.encode("."));
        uint len = chars.length;
        for (uint256 i = 0; i < len; ++i) {
            bytes memory member = bytes(chars[i]);
            if (member.length > 1) {
                if (isEmoji[member]) {
                    emojis++;
                } else {
                    revert Nope();
                }
            } else {
                bytes32 encodedMember = keccak256(abi.encode(chars[i]));
                if (
                    encodedMember == space ||
                    encodedMember == empty ||
                    encodedMember == fullstop
                ) {
                    revert Nope();
                }
            }
        }
    }
}
