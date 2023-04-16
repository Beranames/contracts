// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
pragma abicoder v2;

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
        uint duration,
        address asset
    ) external view returns (uint256);

    // ADMIN ONLY
    function setEmojis(string[] calldata emojis) external;

    function setAssetOracle(address asset, address oracle) external;
}
