import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import deployAddressesProviderFixture from "./utils/deployAddressesProvider";

describe("AddressesProvider", function () {
  describe("Deployment", function () {
    it("Should set the right addresses", async function () {
      const { addresses, provider } = await loadFixture(
        deployAddressesProviderFixture
      );

      expect(await provider.REGISTRY()).to.equal(addresses.registry);
      expect(await provider.PRICE_ORACLE()).to.equal(addresses.oracle);
      expect(await provider.FUNDS_MANAGER()).to.equal(addresses.fundsManager);
      expect(await provider.AUCTION_HOUSE()).to.equal(addresses.auctionHouse);
      expect(await provider.TEAM()).to.equal(addresses.team);
      expect(await provider.FOUNDATION()).to.equal(addresses.foundation);
      expect(await provider.TREASURY()).to.equal(addresses.treasury);
    });

    it("Should set the right owner", async function () {
      const { owner, provider } = await loadFixture(
        deployAddressesProviderFixture
      );
      expect(await provider.owner()).to.equal(owner.address);
    });
  });

  describe("Updates", function () {
    describe("Validations", function () {
      it("Should revert if not called by the owner", async function () {
        const { otherAccount, provider } = await loadFixture(
          deployAddressesProviderFixture
        );
        const p = provider.connect(otherAccount);

        await expect(p.setRegistry(otherAccount.address)).to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
        await expect(p.setPriceOracle(otherAccount.address)).to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
        await expect(
          p.setFundsManager(otherAccount.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");
        await expect(
          p.setAuctionHouse(otherAccount.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");
        await expect(p.setTeam(otherAccount.address)).to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
        await expect(p.setFoundation(otherAccount.address)).to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
      });
    });

    describe("Events", function () {
      it("Should emit an event when updating REGISTRY", async function () {
        const { otherAccount, provider } = await loadFixture(
          deployAddressesProviderFixture
        );
        await expect(provider.setRegistry(otherAccount.address))
          .to.emit(provider, "Update")
          .withArgs("REGISTRY", otherAccount.address);
      });
      it("Should emit an event when updating PRICE_ORACLE", async function () {
        const { otherAccount, provider } = await loadFixture(
          deployAddressesProviderFixture
        );
        await expect(provider.setPriceOracle(otherAccount.address))
          .to.emit(provider, "Update")
          .withArgs("PRICE_ORACLE", otherAccount.address);
      });
      it("Should emit an event when updating FUNDS_MANAGER", async function () {
        const { otherAccount, provider } = await loadFixture(
          deployAddressesProviderFixture
        );
        await expect(provider.setFundsManager(otherAccount.address))
          .to.emit(provider, "Update")
          .withArgs("FUNDS_MANAGER", otherAccount.address);
      });
      it("Should emit an event when updating AUCTION_HOUSE", async function () {
        const { otherAccount, provider } = await loadFixture(
          deployAddressesProviderFixture
        );
        await expect(provider.setAuctionHouse(otherAccount.address))
          .to.emit(provider, "Update")
          .withArgs("AUCTION_HOUSE", otherAccount.address);
      });
      it("Should emit an event when updating TEAM", async function () {
        const { otherAccount, provider } = await loadFixture(
          deployAddressesProviderFixture
        );
        await expect(provider.setTeam(otherAccount.address))
          .to.emit(provider, "Update")
          .withArgs("TEAM", otherAccount.address);
      });
      it("Should emit an event when updating FOUNDATION", async function () {
        const { otherAccount, provider } = await loadFixture(
          deployAddressesProviderFixture
        );
        await expect(provider.setFoundation(otherAccount.address))
          .to.emit(provider, "Update")
          .withArgs("FOUNDATION", otherAccount.address);
      });
      it("Should emit an event when updating TREASURY", async function () {
        const { addresses, otherAccount, provider } = await loadFixture(
          deployAddressesProviderFixture
        );
        await expect(provider.setTreasury(otherAccount.address))
          .to.emit(provider, "Update")
          .withArgs("TREASURY", otherAccount.address);
        // Reset
        await expect(provider.setTreasury(addresses.treasury))
          .to.emit(provider, "Update")
          .withArgs("TREASURY", addresses.treasury);
      });
    });
  });
});
