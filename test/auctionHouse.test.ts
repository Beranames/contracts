import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
const { time } = require('@nomicfoundation/hardhat-network-helpers');

import deployAddressesProviderFixture from "./utils/deployAddressesProvider";
import deployAuctionHouseFixture from "./utils/deployAuctionHouse";
import deployRegistryFixture from "./utils/deployRegistry";

describe("AuctionHouse", function () {
    let _registry: any;
    let fundsManager: any;
    let _provider: any;
    let _auctionHouse: any;
    let _owner: SignerWithAddress;
    let acc1: SignerWithAddress;

    beforeEach(async function () {
        const { registry } = await loadFixture(deployRegistryFixture);
        _registry = registry;

        const { provider, auctionHouse, owner, otherAccount } = await deployAuctionHouseFixture(registry.address);
        _provider = provider;
        _auctionHouse = auctionHouse;
        _owner = owner;
        acc1 = otherAccount;

        await _registry.togglePause();
        await _registry.mintToAuctionHouse([["😀"]]);
    });

    function delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function getTimestampWith(blockNumber: number) {
        return (await ethers.provider.getBlock(blockNumber)).timestamp
    }

    async function getTimestamp() {
        const timestamp = await time.latest();
        return timestamp;
    }

    async function createAuction(
        tokenId?: number,
        start?: number,
        end?: number,
        startPrice?: number,
    ) {
        await _auctionHouse.createAuction(
            tokenId ?? 0,
            start ?? 0,
            end ?? 9999999999,
            startPrice ?? 0,
        );
    }

    describe("Deployment", function () {
        it("Should be deployed", async function () {
            expect(_auctionHouse.address).to.be.properAddress;
        });

        it("Should have correct addresses provider address", async function () {
            expect(await _auctionHouse.addressesProvider()).to.equal(_provider.address);
        });
    });

    describe("Updates", function () {
        describe("Validations", function () {
            it("Should revert if not called by the owner", async function () {
                await expect(_auctionHouse.connect(acc1).createAuction(0, 0, 0, 0))
                    .to.be.revertedWith("Ownable: caller is not the owner");
                await expect(_auctionHouse.connect(acc1).transferUnclaimed(0))
                    .to.be.revertedWith("Ownable: caller is not the owner");
            });
        });
        describe("createAuction", function () {
            it("Should create auction", async function () {
                await createAuction();

                expect((await _auctionHouse.auctions(0)).start).to.eq(0);
                expect((await _auctionHouse.auctions(0)).end).to.eq(9999999999);
                expect((await _auctionHouse.auctions(0)).startPrice).to.eq(0);
            });
            it("Should revert if input data is incorrect", async function () {
                await expect(createAuction(0, 0, 1000, 0)).to.be.revertedWithCustomError(_auctionHouse, "Nope");

                await createAuction(0, 0, await getTimestamp() + 10, 0);
                await expect(createAuction(0, 0, await getTimestamp() + 10, 0)).to.be.revertedWithCustomError(_auctionHouse, "Nope");
            });
        });
        describe("placeBid", function () {
            it("Should place bid if input data is correct", async function () {
                const tokenId = 0;

                await createAuction();
                await _auctionHouse.placeBid(tokenId, { value: 100 });
                let auction = await _auctionHouse.auctions(tokenId);

                expect(auction.highestBid.bidder).to.eq(_owner.address);
                expect(auction.highestBid.amount).to.eq(100);
            });
            it("Should revert is input is incorrect", async function () {
                const tokenId = 0;
                const end = (await getTimestamp()) + 10;
                await createAuction(0, 0, end, 101);
                await expect(_auctionHouse.placeBid(tokenId, { value: 100 }))
                    .to.be.revertedWithCustomError(_auctionHouse, "Nope");

                await time.setNextBlockTimestamp(end);
                await expect(_auctionHouse.placeBid(tokenId, { value: 200 }))
                    .to.be.revertedWithCustomError(_auctionHouse, "Nope");
            });
            it("Should transfer money back to previous bidder", async function () {
                const tokenId = 0;

                await createAuction();
                await _auctionHouse.placeBid(tokenId, { value: 100 });

                await expect(_auctionHouse.connect(acc1).placeBid(tokenId, { value: 200 }))
                    .to.changeEtherBalances(
                        [acc1, _auctionHouse, _owner],
                        [-200, 100, 100]
                    );
            });
            it("Should emit BidPlaced event", async function () {
                const tokenId = 0;

                await createAuction();

                await expect(_auctionHouse.placeBid(tokenId, { value: 100 }))
                    .to.emit(_auctionHouse, "BidPlaced")
                    .withArgs(tokenId, _owner.address, 100);
            });
        });
        describe("claim", function () {
            describe("Validations", function () {
                it("Should revert if caller is not a highest bidder", async function () {
                    await createAuction();
                    await _auctionHouse.placeBid(0, { value: 100 });

                    await expect(_auctionHouse.connect(acc1).claim(0))
                        .to.be.revertedWithCustomError(_auctionHouse, "Nope");
                });
                it("Should revert if auction hasn't already finished", async function () {
                    await createAuction();

                    await expect(_auctionHouse.claim(0))
                        .to.be.revertedWithCustomError(_auctionHouse, "Nope");
                });
            });
            it("Should transfer token to highest bidder", async function () {
                const ts = await getTimestamp();
                await createAuction(
                    undefined,
                    undefined,
                    ts + 10,
                    undefined
                );
                await time.setNextBlockTimestamp(ts + 5);
                await _auctionHouse.placeBid(0, { value: 100 });
                await time.setNextBlockTimestamp(ts + 11);

                await expect(_auctionHouse.claim(0))
                    .to.emit(_auctionHouse, "Claimed")
                    .withArgs(0, _owner.address);
            });
        });
    });
});