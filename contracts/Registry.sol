// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC721, ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {Multicall} from "@openzeppelin/contracts/utils/Multicall.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {IAddressesProvider} from "./interfaces/IAddressesProvider.sol";
import {IFundsManager} from "./interfaces/IFundsManager.sol";
import {IPriceOracle} from "./interfaces/IPriceOracle.sol";

contract BeranamesRegistry is Ownable2Step, Pausable, ERC721Enumerable {
    using EnumerableSet for EnumerableSet.UintSet;
    error NoEntity();
    error LeaseTooShort();
    error InsufficientBalance();
    error Exists();
    error Nope();

    struct Name {
        bytes32 name; // 0xf4fe277353fc5244a8efe452f368cac53d8d6a324aebf562e8f42899c0c325ff
        string[] chars; // ['l', 'o', '🐻']
        uint256 expiry; // time elapsed from 1970
        address whois; // owner
        string metadataURI; // ipfs://something
        uint256 minted_at; // time elapsed from 1970
    }

    event Mint(uint256 indexed id, string[] chars, address indexed to, uint256 expiry, string metadataURI);
    event UpdateWhois(uint256 indexed id, address aka);
    event UpdateMetadataURI(uint256 indexed id, string metadataURI);

    uint256 constant GRACE_PERIOD = 30 days;
    IAddressesProvider public addressesProvider;

    mapping(uint256 => Name) public names; // uintIdOf(['l', 'o', '🐻']) => Name
    mapping(bytes32 => bool) public minted; // bytes32Of(['l', 'o', '🐻']) => true
    mapping(address => EnumerableSet.UintSet) private namesByWhois; // (0x001 => [['l', 'o', '🐻'], ['l', 'o']])

    bool public whitelistEnabled; // set to true at deployment
    mapping(address => bool) private _wl;

    constructor(
        IAddressesProvider addressesProvider_
    ) ERC721("Beranames", unicode"🐻🪪") {
        addressesProvider = addressesProvider_;
        _pause();
        whitelistEnabled = true;
    }

    modifier validDuration(uint duration) {
        if (duration < 1) revert LeaseTooShort();
        _;
    }

    modifier onlyWhitelisted() {
        if (whitelistEnabled && !_wl[_msgSender()]) revert Nope();
        _;
    }

    function priceOracle() public view returns (IPriceOracle) {
        return IPriceOracle(addressesProvider.PRICE_ORACLE());
    }

    function fundsManager() public view returns (IFundsManager) {
        return IFundsManager(addressesProvider.FUNDS_MANAGER());
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        return names[id].metadataURI;
    }

    function chars(uint256 id) public view returns (string[] memory) {
        return names[id].chars;
    }

    function reverseLookup(
        address _whois
    ) public view returns (string[][] memory) {
        uint len = namesByWhois[_whois].length();
        string[][] memory aliases = new string[][](len);
        for (uint i = 0; i < len; ++i) {
            aliases[i] = chars(namesByWhois[_whois].at(i));
        }
        return aliases;
    }

    function mintToAuctionHouse(
        string[][] calldata singleEmojis // [["😀"],["😁"],["😂"], ["🤣"], ...]
    ) external onlyOwner {
        uint len = singleEmojis.length;
        for (uint i = 0; i < len; ++i) {
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
        string[] calldata _chars,
        uint256 duration,
        address whois,
        string calldata metadataURI,
        address to
    )
        external
        payable
        whenNotPaused
        onlyWhitelisted
        validDuration(duration)
        returns (uint)
    {
        uint price = priceOracle().price(_chars, duration);
        fundsManager().distributeNative{value: price}();
        return mintInternal(_chars, duration, whois, metadataURI, to);
    }

    /**
     * @dev In bArtio, only BERA payments
     */
    // function mintERC20(
    //     string[] calldata _chars,
    //     uint256 duration,
    //     address whois,
    //     string calldata metadataURI,
    //     address to,
    //     IERC20 paymentAsset
    // )
    //     external
    //     whenNotPaused
    //     onlyWhitelisted
    //     validDuration(duration)
    //     returns (uint)
    // {
    //     uint price = priceOracle().price(
    //         _chars,
    //         duration,
    //         address(paymentAsset)
    //     );
    //     paymentAsset.safeTransferFrom(_msgSender(), address(this), price);
    //     paymentAsset.approve(addressesProvider.FUNDS_MANAGER(), price);
    //     fundsManager().distributeERC20(paymentAsset, price);
    //     return mintInternal(_chars, duration, whois, metadataURI, to);
    // }

    function renewNative(
        string[] calldata _chars,
        uint duration
    ) external payable validDuration(duration) {
        bytes32 id = bytes32FromChars(_chars);
        if (!minted[id]) revert Nope();
        uint expiry = names[uint(id)].expiry;
        if (expiry + GRACE_PERIOD > block.timestamp) {
            uint remainder;
            if (expiry > block.timestamp) {
                remainder = (expiry - block.timestamp) / 365 days;
            }
            uint price = priceOracle().price(_chars, duration + remainder);
            if (remainder > 0) {
                price -= priceOracle().price(_chars, remainder);
            }
            fundsManager().distributeNative{value: price}();
            renewInternal(_chars, duration);
        } else revert Nope();
    }

    /**
     * @dev In bArtio, only BERA payments
     */
    // function renewERC20(
    //     string[] calldata _chars,
    //     uint duration,
    //     IERC20 paymentAsset
    // ) external payable validDuration(duration) {
    //     bytes32 id = bytes32FromChars(_chars);
    //     uint expiry = names[uint(id)].expiry;
    //     if (expiry + GRACE_PERIOD > block.timestamp) {
    //         uint remainder;
    //         if (expiry > block.timestamp) {
    //             remainder = (expiry - block.timestamp) / 365 days;
    //         }
    //         uint price = priceOracle().price(
    //             _chars,
    //             duration + remainder,
    //             address(paymentAsset)
    //         );
    //         if (remainder > 0) {
    //             price -= priceOracle().price(
    //                 _chars,
    //                 remainder,
    //                 address(paymentAsset)
    //             );
    //         }
    //         paymentAsset.safeTransferFrom(_msgSender(), address(this), price);
    //         paymentAsset.approve(addressesProvider.FUNDS_MANAGER(), price);
    //         fundsManager().distributeERC20(paymentAsset, price);
    //         renewInternal(_chars, duration);
    //     } else revert Nope();
    // }

    /**
     * @notice Update WHOIS for a name
     */
    function updateWhois(uint id, address _aka) external {
        if (_msgSender() == ownerOf(id)) {
            address currentWhois = names[id].whois;
            // remove from current whois
            namesByWhois[currentWhois].remove(id);
            names[id].whois = _aka;
            // add to new whois
            namesByWhois[_aka].add(id);
            emit UpdateWhois(id, _aka);
        } else revert Nope();
    }

    function updateMetadataURI(
        uint256 id,
        string calldata metadataURI_
    ) external {
        if (_msgSender() == ownerOf(id)) {
            names[id].metadataURI = metadataURI_;
            emit UpdateMetadataURI(id, metadataURI_);
        } else revert Nope();
    }

    /** ADMIN */
    function togglePause() external onlyOwner {
        paused() ? _unpause() : _pause();
    }

    /** INTERNAL */
    function mintInternal(
        string[] memory _chars, // ["🐻", "🪪"] || ["o", "o", "g", "a", "b", "o", "o", "g", "a"]
        uint256 duration, //years
        address whois,
        string memory metadataURI,
        address to
    ) internal validDuration(duration) returns (uint id) {
        bytes32 name = bytes32FromChars(_chars);
        id = uint(name);
        if (minted[name]) {
            if (names[id].expiry > block.timestamp - GRACE_PERIOD) {
                revert Exists();
            } else {
                _burn(id);
            }
        } else {
            minted[name] = true;
        }
        uint256 expiry = block.timestamp + duration * 365 days;
        names[id] = Name({
            name: name,
            chars: _chars,
            expiry: expiry,
            whois: whois,
            metadataURI: metadataURI,
            minted_at: block.timestamp
        });
        address owner = to == address(0) ? _msgSender() : to;
        _safeMint(owner, id);
        namesByWhois[owner].add(id);
        emit Mint(id, _chars, owner, expiry, metadataURI); // TODO: add expiry & metadataUri
        emit UpdateWhois(id, whois);
        emit UpdateMetadataURI(id, metadataURI);
    }

    function renewInternal(
        string[] calldata _chars,
        uint duration
    ) internal whenNotPaused validDuration(duration) {
        bytes32 name = bytes32FromChars(_chars);
        if (!minted[name]) revert NoEntity();
        names[uint(name)].expiry += duration * 365 days;
    }

    function toggleWhitelist() external onlyOwner {
        whitelistEnabled = !whitelistEnabled;
    }

    function setWhitelisted(
        address[] calldata accounts,
        bool status
    ) external onlyOwner {
        uint len = accounts.length;
        for (uint i = 0; i < len; ++i) {
            _wl[accounts[i]] = status;
        }
    }

    function bytes32FromChars(
        string[] memory _chars
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(_chars));
    }
}
