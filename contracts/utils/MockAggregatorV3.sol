// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

contract MockAggregatorV3 {
    uint256 public price;
    uint8 public decimals;

    constructor(uint8 decimals_, uint256 price_) {
        decimals = decimals_;
        price = price_;
    }

    function setPrice(uint256 price_) external {
        price = price_;
    }

    function latestRoundData()
        external
        view
        returns (uint80, int256 answer, uint256, uint256, uint80)
    {
        return (0, int256(price), 0, 0, 0);
    }
}
