// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023 Berachain Foundation
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

pragma solidity ^0.8.17;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IStakingModule} from "./IStaking.sol";

// Errors
error ZeroAddress();
error ZeroAmount();
error InvalidValue();
error FailedToDelegate();
error FailedToUndelegate();

interface IFundsManager {
    function STAKING_MODULE() external view returns (IStakingModule);

    function BPS() external view returns (uint16);

    function BPS_TO_TEAM() external view returns (uint16);

    function BPS_TO_FOUNDATION() external view returns (uint16);

    function BERANAMES_VALIDATOR() external view returns (address);

    function BERANAMES_WALLET() external view returns (address);

    function BERACHAIN_FOUNDATION_WALLET() external view returns (address);

    /**
     * @dev Returns the total amount of assets delegated to the validator.
     * @return amount total amount of assets delegated to the validator.
     */
    function totalDelegated() external view returns (uint256 amount);

    /**
     * @notice Distributes funds to the team, foundation & validator
     * @dev requires that the caller has approved the FundsManager to transfer
     * the funds.
     * @param token token to distribute
     * @param amount amount of token to distribute
     */
    function distributeFunds(IERC20 token, uint256 amount) external;
}
