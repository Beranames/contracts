import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";

import { ethers } from "hardhat";

import deployAddressesProviderFixture from "./utils/deployAddressesProvider";

describe("AuctionHouse", function () {
    let registry: any
    let fundsManager: any
    let addressesProvider: any
    let auctionHouse: any
    let owner: SignerWithAddress
    let acc1: SignerWithAddress

    beforeEach(async function () {
        const { addresses, provider } = await loadFixture(deployAddressesProviderFixture);
        registry = addresses.registry;
        fundsManager = addresses.fundsManager;
        addressesProvider = provider;

        [owner, acc1] = await ethers.getSigners()
        const AuctionHouse = await ethers.getContractFactory("AuctionHouse", owner)
        auctionHouse = await AuctionHouse.deploy(provider.address)
        await auctionHouse.deployed()
    })

    describe("Deployment", function () {
        it("Should be deployed", async function () {
            expect(auctionHouse.address).to.be.properAddress
        })

        it("Should have correct addresses provider address", async function () {
            expect(await auctionHouse.addressesProvider()).to.equal(addressesProvider.address)
        })
    })

    describe("Updates", function () {
        describe("Validations", function () {
            it("Should revert if not called by the owner", async function () {
                await expect(auctionHouse.connect(acc1).createAuction(0, 0, 0, 0))
                    .to.be.revertedWith("Ownable: caller is not the owner")
                await expect(auctionHouse.connect(acc1).transferUnclaimed(0))
                    .to.be.revertedWith("Ownable: caller is not the owner")
            })
        })
        describe("placeBid", function() {
        })
    })
})