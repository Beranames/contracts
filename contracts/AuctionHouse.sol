// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";

import {IAddressesProvider} from "./interfaces/IAddressesProvider.sol";
import {IFundsManager} from "./interfaces/IFundsManager.sol";

error Nope();

/**
 */
contract AuctionHouse is Ownable2Step, Pausable, ERC721Holder {
    struct Bid {
        address bidder;
        uint256 amount;
    }
    struct Auction {
        uint256 start;
        uint256 end;
        uint256 startPrice;
        Bid highestBid;
    }

    event AuctionCreated(
        uint256 id,
        uint256 start,
        uint256 end,
        uint256 startPrice
    );
    event BidPlaced(uint256 id, address indexed bidder, uint256 amount);
    event Claimed(uint256 id, address indexed bidder);

    IAddressesProvider public addressesProvider;
    mapping(uint256 => Auction) public auctions;

    constructor(IAddressesProvider addressesProvider_) {
        addressesProvider = addressesProvider_;
    }

    function registry() internal view returns (IERC721) {
        return IERC721(addressesProvider.REGISTRY());
    }

    function fundsManager() internal view returns (IFundsManager) {
        return IFundsManager(addressesProvider.FUNDS_MANAGER());
    }

    function createAuction(
        uint256 tokenId,
        uint256 start,
        uint256 end,
        uint256 startPrice
    ) external onlyOwner {
        if (registry().ownerOf(tokenId) != address(this)) {
            revert Nope();
        }
        if (end <= block.timestamp) {
            revert Nope();
        }
        if (auctions[tokenId].end != 0) {
            revert Nope();
        }
        if (end - start < 24 hours) revert Nope();
        auctions[tokenId] = Auction({
            start: start,
            end: end,
            startPrice: startPrice,
            highestBid: Bid({bidder: address(0), amount: 0})
        });
        emit AuctionCreated(tokenId, start, end, startPrice);
    }

    function placeBid(uint256 id) external payable {
        uint amount = msg.value;
        Auction memory auction = auctions[id];
        if (auction.start >= block.timestamp) revert Nope();
        if (auction.end <= block.timestamp) revert Nope();
        if (amount < auction.startPrice) revert Nope();
        if (auction.highestBid.amount >= amount) revert Nope();
        Bid memory currentBid = auction.highestBid;
        if (currentBid.bidder != address(0)) {
            payable(currentBid.bidder).transfer(currentBid.amount);
        }
        Bid memory bid = Bid({bidder: _msgSender(), amount: amount});
        auctions[id].highestBid = bid;
        emit BidPlaced(id, _msgSender(), amount);
    }

    function claim(uint256 id) external {
        Auction memory auction = auctions[id];
        if (auction.highestBid.bidder != _msgSender()) revert Nope();
        if (auction.end >= block.timestamp) revert Nope();
        registry().transferFrom(address(this), auction.highestBid.bidder, id);
        fundsManager().distributeNative{value: auction.highestBid.amount}();
        emit Claimed(id, _msgSender());
    }

    function transferUnclaimed(uint256 id) external onlyOwner {
        Auction memory auction = auctions[id];
        if (auction.start >= block.timestamp) revert Nope();
        if (auction.end <= block.timestamp) revert Nope();
        if (auction.highestBid.bidder != address(0)) revert Nope();
        registry().transferFrom(address(this), _msgSender(), id);
    }
}
