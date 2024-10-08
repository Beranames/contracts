// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IPriceOracle {
    function isEmoji(string calldata s) external view returns (bool);

    function dollarPriceForNamePerYear(
        string[] calldata chars
    ) external pure returns (uint256);

    function countEmojis(
        string[] calldata chars
    ) external view returns (uint256);

    function price(
        string[] calldata chars,
        uint duration
    ) external view returns (uint256);

    // ADMIN ONLY
    function setEmojis(string[] calldata emojis) external;
}
