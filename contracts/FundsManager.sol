// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IAddressesProvider} from "./interfaces/IAddressesProvider.sol";
// Errors
error ZeroAddress();
error ZeroAmount();
error InvalidValue();
error FailedToTransfer(address to);

contract FundsManager is Ownable2Step {
    IAddressesProvider public addressesProvider;

    uint16 public constant BPS = 10_000;
    uint16 public constant BPS_TO_TEAM = 1_500;
    uint16 public constant BPS_TO_FOUNDATION = 8_000;

    event Success(bool indexed success);
    event Data(bytes data);

    constructor(IAddressesProvider addressesProvider_) {
        addressesProvider = addressesProvider_;
    }

    /**
     * @notice Distributes funds to the team, foundation & treasury
     * @dev requires that the caller has approved the FundsManager to transfer
     * the funds.
     * @param token token to distribute
     * @param amount amount of token to distribute
     */
    function distributeERC20(IERC20 token, uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        token.transferFrom(msg.sender, address(this), amount);
        (uint256 toTeam, uint256 toFoundation, uint toTreasury) = _split(
            amount
        );
        token.transfer(addressesProvider.TEAM(), toTeam);
        token.transfer(addressesProvider.FOUNDATION(), toFoundation);
        token.transfer(addressesProvider.TREASURY(), toTreasury);
    }

    /**
     * @notice Distributes funds to the team, foundation & treasury
     */
    function distributeNative() external payable {
        (uint256 toTeam, uint256 toFoundation, uint toTreasury) = _split(
            msg.value
        );
        bool sent;
        (sent, ) = addressesProvider.TEAM().call{value: toTeam}("");
        if (!sent) revert FailedToTransfer(addressesProvider.TEAM());
        (sent, ) = addressesProvider.FOUNDATION().call{value: toFoundation}("");
        if (!sent) revert FailedToTransfer(addressesProvider.FOUNDATION());
        (sent, ) = addressesProvider.TREASURY().call{value: toTreasury}("");
        if (!sent) revert FailedToTransfer(addressesProvider.TREASURY());
    }

    function _split(
        uint256 amount
    )
        public
        pure
        returns (uint256 toTeam, uint256 toFoundation, uint256 toTreasury)
    {
        toTeam = (amount * BPS_TO_TEAM) / BPS;
        toFoundation = (amount * BPS_TO_FOUNDATION) / BPS;
        toTreasury = amount - (toTeam + toFoundation);
    }
}
