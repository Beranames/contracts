// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestErc20 is ERC20 {
    constructor() ERC20("Beratoken", "BRT") {
        _mint(msg.sender, 1e24);
    }
}