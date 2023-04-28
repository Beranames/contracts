import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import deployAddressesProviderFixture from "./utils/deployAddressesProvider";
import deployFundsManagerFixture from "./utils/deployFundsManager";
import deployPriceOracleFixture from "./utils/deployPriceOracle";
import deployRegistryFixture from "./utils/deployRegistry";
import deployAuctionHouseFixture from "./utils/deployAuctionHouse";
import { parseEther } from "ethers/lib/utils";

describe("BeranamesRegistry", function () {
    async function setupFixture() {
        const fixtureData = await deployAddressesProviderFixture();
        const { provider, owner, otherAccount } = fixtureData;
        const { oracle } = await loadFixture(deployPriceOracleFixture);
        const { manager } = await loadFixture(deployFundsManagerFixture);
        const { auctionHouse } = await loadFixture(deployAuctionHouseFixture);
        const { registry } = await loadFixture(deployRegistryFixture);
        await provider.multicall([
            provider.interface.encodeFunctionData("setRegistry", [registry.address]),
            provider.interface.encodeFunctionData("setPriceOracle", [oracle.address]),
            provider.interface.encodeFunctionData("setFundsManager", [manager.address]),
            provider.interface.encodeFunctionData("setAuctionHouse", [auctionHouse.address]),
        ]);

        return { provider, owner, otherAccount, oracle, manager, auctionHouse, registry };
    }

    describe("Deployment", function () {
        it("Should set the correct addresses provider", async function () {
            const { registry, provider } = await loadFixture(setupFixture);
            expect(await registry.addressesProvider()).to.equal(provider.address);
        });
        it("Should set the correct owner", async function () {
            const { registry, owner } = await loadFixture(setupFixture);
            expect(await registry.owner()).to.equal(owner.address);
        });
        it("Should pause the contract", async function () {
            const { registry } = await loadFixture(setupFixture);
            expect(await registry.paused()).to.equal(true);
        });
    });

    describe("Admin Functions", function () {
        it("Should allow the owner to unpause the contract", async function () {
            const { registry, owner } = await loadFixture(setupFixture);
            await registry.connect(owner).togglePause();
            expect(await registry.paused()).to.equal(false);
        });
        it("Should not allow non-owners to unpause the contract", async function () {
            const { registry, otherAccount } = await loadFixture(setupFixture);
            await expect(registry.connect(otherAccount).togglePause()).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });
        it("Should allow the owner to pause the contract", async function () {
            const { registry, owner } = await loadFixture(setupFixture);
            await registry.connect(owner).togglePause();
            await registry.connect(owner).togglePause();
            expect(await registry.paused()).to.equal(true);
        });
        it("Should not allow non-owners to pause the contract", async function () {
            const { registry, otherAccount } = await loadFixture(setupFixture);
            await expect(registry.connect(otherAccount).togglePause()).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });
        it("Should allow the owner to mint to the auction house", async function () {
            const { registry } = await loadFixture(setupFixture);
            await expect(registry.mintToAuctionHouse([["🐻"], ["⛓️"]])).to.not.be.reverted;
        });
        it("Should not allow  non-owners to mint to the auction house", async function () {
            const { registry, otherAccount } = await loadFixture(setupFixture);
            const r = registry.connect(otherAccount);
            await expect(r.mintToAuctionHouse([["🐻‍❄️"]])).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Entrypoints", function () {
        describe("mintNative", function () {
            it("Should not allow to mint if registry is paused", async function () {
                const { registry, owner } = await loadFixture(setupFixture);
                await expect(
                    registry.mintNative(["o", "o", "g", "a"], 1, owner.address, "https://example.com", owner.address)
                ).to.be.revertedWith("Pausable: paused");
            });
            it("Should not allow to mint if call is malformed", async function () {
                const { registry, owner } = await loadFixture(setupFixture);
                await registry.togglePause();
                await expect(
                    registry.mintNative(["oo", "o", "g", "a"], 1, owner.address, "https://example.com", owner.address)
                ).to.be.revertedWithCustomError(registry, "Nope");
            });

            it("Should not allow to mint if price is not paid", async function () {
                const { registry, owner } = await loadFixture(setupFixture);
                await registry.togglePause();
                await expect(
                    registry.mintNative(["o", "o", "g", "a"], 1, owner.address, "https://example.com", owner.address, {
                        value: parseEther("79"),
                    })
                ).to.be.reverted;
            });
            it("Should allow to mint if price is paid", async function () {
                const { registry, owner } = await loadFixture(setupFixture);
                await registry.togglePause();
                await expect(
                    registry.mintNative(["o", "o", "g", "a"], 1, owner.address, "https://example.com", owner.address, {
                        value: parseEther("80"),
                    })
                ).to.not.be.reverted;
            });
        });
    });
});
