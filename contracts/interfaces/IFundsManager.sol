// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;
pragma abicoder v2;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Errors
error ZeroAddress();
error ZeroAmount();
error InvalidValue();
error FailedToDelegate();
error FailedToUndelegate();

interface IFundsManager {
    function BPS() external view returns (uint16);

    function BPS_TO_TEAM() external view returns (uint16);

    function BPS_TO_FOUNDATION() external view returns (uint16);

    function BERANAMES_VALIDATOR() external view returns (address);

    function BERANAMES_WALLET() external view returns (address);

    function BERACHAIN_FOUNDATION() external view returns (address);

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
    function distributeERC20(IERC20 token, uint256 amount) external;

    function distributeNative() external payable;
}
