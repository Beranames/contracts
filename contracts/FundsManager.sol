// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IAddressesProvider} from "./interfaces/IAddressesProvider.sol";
import {IStakingModule} from "./interfaces/IStaking.sol";
import "hardhat/console.sol";
// Errors
error ZeroAddress();
error ZeroAmount();
error InvalidValue();
error FailedToDelegate();
error FailedToUndelegate();

contract FundsManager is Ownable2Step {
    IStakingModule public immutable STAKING_MODULE =
        IStakingModule(0xd9A998CaC66092748FfEc7cFBD155Aae1737C2fF);
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
     * @dev Returns the total amount of assets delegated to the validator.
     * @return amount total amount of assets delegated to the validator.
     */
    function totalDelegated() public view returns (uint256 amount) {
        return
            STAKING_MODULE.getDelegation(
                address(this),
                addressesProvider.VALIDATOR()
            );
    }

    receive() external payable {
        // console.logUint(msg.value);
        (uint toTeam, uint toFoundation) = _split(msg.value);
        // TODO - sort this
        // payable(addressesProvider.TEAM_WALLET()).transfer(toTeam);
        // payable(addressesProvider.FOUNDATION_WALLET()).transfer(toFoundation);
        // _delegate(msg.value - toTeam - toFoundation);
    }

    fallback() external payable {
        // console.logUint(msg.value);
        (uint toTeam, uint toFoundation) = _split(msg.value);
    }

    /**
     * @notice Distributes funds to the team, foundation & validator
     * @dev requires that the caller has approved the FundsManager to transfer
     * the funds.
     * @param token token to distribute
     * @param amount amount of token to distribute
     */
    function distributeFunds(IERC20 token, uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        // console.logUint(amount);
        // token.transferFrom(msg.sender, address(this), amount);
        // uint256 toTeam = (amount * BPS_TO_TEAM) / BPS;
        // uint256 toFoundation = (amount * BPS_TO_FOUNDATION) / BPS;
        // token.transfer(addressesProvider.TEAM_WALLET(), toTeam);
        // token.transfer(addressesProvider.FOUNDATION_WALLET(), toFoundation);
        // TODO - delegate
        // _delegate(msg.value - toTeam - toFoundation);
    }

    function _split(
        uint256 amount
    ) public pure returns (uint256 toTeam, uint256 toFoundation) {
        toTeam = (amount * BPS_TO_TEAM) / BPS;
        toFoundation = (amount * BPS_TO_FOUNDATION) / BPS;
    }

    /**
     * @dev Delegates Base Denom to the validator.
     * @param amount amount of Base Denom to delegate.
     */
    function _delegate(uint256 amount) internal {
        if (amount == 0) revert ZeroAmount();
        bool success = STAKING_MODULE.delegate(
            addressesProvider.VALIDATOR(),
            amount
        );
        if (!success) revert FailedToDelegate();
    }

    function undelegate(uint256 amount) external onlyOwner {
        if (amount == 0) revert ZeroAmount();
        bool success = STAKING_MODULE.undelegate(
            addressesProvider.VALIDATOR(),
            amount
        );
        payable(addressesProvider.TEAM_WALLET()).transfer(amount);
        if (!success) revert FailedToUndelegate();
    }
}
