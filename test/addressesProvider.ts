import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { constants } from "ethers";
import deployAddressesProviderFixture from "./utils/deployAddressesProvider";

describe("AddressesProvider", function () {
    describe("Deployment", function () {
        it("Should set the right addresses", async function () {
            const { addresses, provider } = await loadFixture(deployAddressesProviderFixture);

            expect(await provider.REGISTRY()).to.equal(addresses.registry);
            expect(await provider.PRICE_ORACLE()).to.equal(addresses.oracle);
            expect(await provider.FUNDS_MANAGER()).to.equal(addresses.fundsManager);
            expect(await provider.AUCTION_HOUSE()).to.equal(addresses.auctionHouse);
            expect(await provider.VALIDATOR()).to.equal(addresses.validator);
            expect(await provider.TEAM_WALLET()).to.equal(addresses.team);
            expect(await provider.FOUNDATION_WALLET()).to.equal(addresses.foundation);
        });

        it("Should set the right owner", async function () {
            const { provider, owner } = await loadFixture(deployAddressesProviderFixture);

            expect(await provider.owner()).to.equal(owner.address);
        });
    });

    describe("Updates", function () {
        describe("Validations", function () {
            it("Should revert if not called by the owner", async function () {
                const { provider, otherAccount } = await loadFixture(deployAddressesProviderFixture);
                const p = provider.connect(otherAccount);

                await expect(p.setRegistry(otherAccount.address)).to.be.revertedWith(
                    "Ownable: caller is not the owner"
                );
                await expect(p.setPriceOracle(otherAccount.address)).to.be.revertedWith(
                    "Ownable: caller is not the owner"
                );
                await expect(p.setFundsManager(otherAccount.address)).to.be.revertedWith(
                    "Ownable: caller is not the owner"
                );
                await expect(p.setAuctionHouse(otherAccount.address)).to.be.revertedWith(
                    "Ownable: caller is not the owner"
                );
                await expect(p.setValidator(otherAccount.address)).to.be.revertedWith(
                    "Ownable: caller is not the owner"
                );
                await expect(p.setTeamWallet(otherAccount.address)).to.be.revertedWith(
                    "Ownable: caller is not the owner"
                );
                await expect(p.setFoundationWallet(otherAccount.address)).to.be.revertedWith(
                    "Ownable: caller is not the owner"
                );
            });
        });

        describe("Events", function () {
            it("Should emit an event when updating REGISTRY", async function () {
                const { provider, otherAccount } = await loadFixture(deployAddressesProviderFixture);
                await expect(provider.setRegistry(otherAccount.address))
                    .to.emit(provider, "Update")
                    .withArgs("REGISTRY", otherAccount.address);
            });
            it("Should emit an event when updating PRICE_ORACLE", async function () {
                const { provider, otherAccount } = await loadFixture(deployAddressesProviderFixture);
                await expect(provider.setPriceOracle(otherAccount.address))
                    .to.emit(provider, "Update")
                    .withArgs("PRICE_ORACLE", otherAccount.address);
            });
            it("Should emit an event when updating FUNDS_MANAGER", async function () {
                const { provider, otherAccount } = await loadFixture(deployAddressesProviderFixture);
                await expect(provider.setFundsManager(otherAccount.address))
                    .to.emit(provider, "Update")
                    .withArgs("FUNDS_MANAGER", otherAccount.address);
            });
            it("Should emit an event when updating AUCTION_HOUSE", async function () {
                const { provider, otherAccount } = await loadFixture(deployAddressesProviderFixture);
                await expect(provider.setAuctionHouse(otherAccount.address))
                    .to.emit(provider, "Update")
                    .withArgs("AUCTION_HOUSE", otherAccount.address);
            });
            it("Should emit an event when updating VALIDATOR", async function () {
                const { provider, otherAccount } = await loadFixture(deployAddressesProviderFixture);
                await expect(provider.setValidator(otherAccount.address))
                    .to.emit(provider, "Update")
                    .withArgs("VALIDATOR", otherAccount.address);
            });
            it("Should emit an event when updating TEAM_WALLET", async function () {
                const { provider, otherAccount } = await loadFixture(deployAddressesProviderFixture);
                await expect(provider.setTeamWallet(otherAccount.address))
                    .to.emit(provider, "Update")
                    .withArgs("TEAM_WALLET", otherAccount.address);
            });
            it("Should emit an event when updating FOUNDATION_WALLET", async function () {
                const { provider, otherAccount } = await loadFixture(deployAddressesProviderFixture);
                await expect(provider.setFoundationWallet(otherAccount.address))
                    .to.emit(provider, "Update")
                    .withArgs("FOUNDATION_WALLET", otherAccount.address);
            });
        });
    });
});
