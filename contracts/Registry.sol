// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
pragma abicoder v2;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC721, ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {Multicall} from "@openzeppelin/contracts/utils/Multicall.sol";

import {IAddressesProvider} from "./interfaces/IAddressesProvider.sol";
import {IFundsManager} from "./interfaces/IFundsManager.sol";
import {IPriceOracle} from "./interfaces/IPriceOracle.sol";

import {console} from "hardhat/console.sol";

error NoEntity();
error LeaseTooShort();
error InsufficientBalance();
error Exists();
error Nope();

contract BeranamesRegistry is
    Ownable2Step,
    Pausable,
    ERC721Enumerable,
    Multicall
{
    using SafeERC20 for IERC20;

    struct Name {
        bytes32 name;
        uint256 expiry;
        address whois;
        string metadataURI;
    }

    uint256 constant GRACE_PERIOD = 30 days;
    IAddressesProvider public addressesProvider;

    uint private _id;
    mapping(bytes32 => uint256) public nameIds;
    mapping(uint256 => Name) public names; // keccak256(abi.encode(🐻⛓️)) => Name
    mapping(bytes32 => bool) public minted; // keccak256(abi.encode(🐻⛓️)) => true

    constructor(
        IAddressesProvider addressesProvider_
    ) ERC721("Beranames", unicode"🐻🪪") {
        addressesProvider = addressesProvider_;
        _pause();
    }

    function totalSupply() public view override returns (uint256) {
        return _id;
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        return names[id].metadataURI;
    }

    function priceOracle() public view returns (IPriceOracle) {
        return IPriceOracle(addressesProvider.PRICE_ORACLE());
    }

    function fundsManager() public view returns (IFundsManager) {
        return IFundsManager(addressesProvider.FUNDS_MANAGER());
    }

    function mintToAuctionHouse(
        string[][] calldata singleEmojis // [["😀",["😁"],["😂"], ["🤣"], ...]
    ) external onlyOwner {
        for (uint i = 0; i < singleEmojis.length; i++) {
            mintInternal(
                singleEmojis[i],
                100,
                address(0),
                "",
                addressesProvider.AUCTION_HOUSE()
            );
        }
    }

    function mintNative(
        string[] calldata chars,
        uint256 duration,
        address whois,
        string calldata metadataURI,
        address to
    ) external payable returns (uint) {
        uint price = priceOracle().price(chars, duration, address(0));
        payable(addressesProvider.FUNDS_MANAGER()).transfer(price);
        return mintInternal(chars, duration, whois, metadataURI, to);
    }

    function mintERC20(
        string[] calldata chars,
        uint256 duration,
        address whois,
        string calldata metadataURI,
        address to,
        IERC20 paymentAsset
    ) external returns (uint) {
        uint price = priceOracle().price(
            chars,
            duration,
            address(paymentAsset)
        );
        paymentAsset.safeTransferFrom(_msgSender(), address(this), price);
        paymentAsset.safeApprove(addressesProvider.FUNDS_MANAGER(), price);
        fundsManager().distributeFunds(paymentAsset, price);
        return mintInternal(chars, duration, whois, metadataURI, to);
    }

    function renewNative(
        string[] calldata chars,
        uint duration
    ) external payable {
        uint price = priceOracle().price(chars, duration, address(0));
        payable(addressesProvider.FUNDS_MANAGER()).transfer(price);
        renewInternal(chars, duration);
    }

    function renewERC20(
        string[] calldata chars,
        uint duration,
        IERC20 paymentAsset
    ) external payable {
        uint price = priceOracle().price(
            chars,
            duration,
            address(paymentAsset)
        );
        paymentAsset.safeTransferFrom(_msgSender(), address(this), price);
        paymentAsset.safeApprove(addressesProvider.FUNDS_MANAGER(), price);
        fundsManager().distributeFunds(paymentAsset, price);
        renewInternal(chars, duration);
    }

    /**  UPDATE NAME */
    function updateWhois(uint id, address aka) external {
        if (_msgSender() == ownerOf(id)) {
            names[id].whois = aka;
        }
    }

    function updateMetadataURI(
        uint256 id,
        string calldata metadataURI_
    ) external {
        if (_msgSender() == ownerOf(id)) {
            names[id].metadataURI = metadataURI_;
        }
    }

    /** INTERNAL */
    function mintInternal(
        string[] memory chars, // ["🐻", "🪪"] || ["o", "o", "g", "a", "b", "o", "o", "g", "a"]
        uint256 duration, //years
        address whois,
        string memory metadataURI,
        address to
    ) internal whenNotPaused returns (uint id) {
        if (duration < 1) revert LeaseTooShort();
        bytes32 name = keccak256(abi.encode(chars));
        if (
            minted[name] &&
            names[nameIds[name]].expiry > block.timestamp - GRACE_PERIOD
        ) {
            revert Exists();
        } else {
            _burn(nameIds[name]);
        }
        minted[name] = true;
        id = _id;
        _id++;
        names[id] = Name({
            name: name,
            expiry: block.timestamp + duration * 365 days,
            whois: whois,
            metadataURI: metadataURI
        });
        address owner = to == address(0) ? _msgSender() : to;
        _safeMint(owner, id);
    }

    function renewInternal(
        string[] calldata chars,
        uint duration
    ) internal whenNotPaused {
        bytes32 _hash = keccak256(abi.encode(chars));
        if (!minted[_hash]) revert NoEntity();
        if (duration < 1) revert LeaseTooShort();
        uint256 id = nameIds[_hash];
        names[id].expiry += duration * 365 days;
    }
}
