import { ethers, utils } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import deployAddressesProviderFixture from "./utils/deployAddressesProvider";
import deployFundsManagerFixture from "./utils/deployFundsManager";
import deployPriceOracleFixture from "./utils/deployPriceOracle";
import deployRegistryFixture from "./utils/deployRegistry";
import deployAuctionHouseFixture from "./utils/deployAuctionHouse";
import { defaultAbiCoder, keccak256, parseEther } from "ethers/lib/utils";
import { network } from "hardhat";
import deployERC20 from "./utils/deployErc20";

describe("BeranamesRegistry", function () {
  async function setupFixture() {
    const fixtureData = await deployAddressesProviderFixture();
    const { provider, owner, otherAccount } = fixtureData;
    const { oracle, aggregator1Address, agg3_14Address } =
      await deployPriceOracleFixture();
    const { manager } = await deployFundsManagerFixture();
    const { auctionHouse } = await deployAuctionHouseFixture();
    const { registry } = await deployRegistryFixture();
    await provider.multicall([
      provider.interface.encodeFunctionData("setRegistry", [registry.address]),
      provider.interface.encodeFunctionData("setPriceOracle", [oracle.address]),
      provider.interface.encodeFunctionData("setFundsManager", [
        manager.address,
      ]),
      provider.interface.encodeFunctionData("setAuctionHouse", [
        auctionHouse.address,
      ]),
    ]);

    // await oracle.setAssetOracle(erc20.address, agg3_14Address);

    return {
      provider,
      owner,
      otherAccount,
      oracle,
      manager,
      auctionHouse,
      registry,
    };
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
    it("Should set the contract to whitelist-mode", async function () {
      const { registry } = await loadFixture(setupFixture);
      expect(await registry.whitelistEnabled()).to.equal(true);
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
      await expect(
        registry.connect(otherAccount).togglePause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("Should allow the owner to pause the contract", async function () {
      const { registry, owner } = await loadFixture(setupFixture);
      await registry.connect(owner).togglePause();
      await registry.connect(owner).togglePause();
      expect(await registry.paused()).to.equal(true);
    });
    it("Should not allow non-owners to pause the contract", async function () {
      const { registry, otherAccount } = await loadFixture(setupFixture);
      await expect(
        registry.connect(otherAccount).togglePause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("Should allow the owner to mint to the auction house", async function () {
      const { registry } = await loadFixture(setupFixture);
      await expect(registry.mintToAuctionHouse([["🐻"], ["😄"], ["🤪"]])).to.not
        .be.reverted;
    });
    it("Should not allow non-owners to mint to the auction house", async function () {
      const { registry, otherAccount } = await loadFixture(setupFixture);
      const r = registry.connect(otherAccount);
      await expect(r.mintToAuctionHouse([["🐻‍❄️"]])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
    it("Should allow the owner to to toggle whitelist", async function () {
      const { registry, owner } = await loadFixture(setupFixture);
      await expect(registry.connect(owner).toggleWhitelist()).to.not.be
        .reverted;
    });
    it("Should not allow the non-owners to to toggle whitelist", async function () {
      const { registry, otherAccount } = await loadFixture(setupFixture);
      const r = registry.connect(otherAccount);
      await expect(r.toggleWhitelist()).to.be.reverted;
    });
    it("Should allow the owner to set whitelisted addresses", async function () {
      const { registry, owner, otherAccount } = await loadFixture(setupFixture);
      await expect(
        registry.connect(owner).setWhitelisted([otherAccount.address], true)
      ).to.not.be.reverted;
    });
    it("Should not allow the non-owners to set whitelisted addresses", async function () {
      const { registry, otherAccount } = await loadFixture(setupFixture);
      const r = registry.connect(otherAccount);
      await expect(r.setWhitelisted([otherAccount.address], true)).to.be
        .reverted;
    });
  });

  describe("Fields", function () {
    it("Should allow to get total supply", async function () {
      const { registry } = await loadFixture(setupFixture);
      expect(await registry.totalSupply()).to.eq(0);
    });
    it("Should allow to get metadata URI of token by id", async function () {
      const { registry } = await loadFixture(setupFixture);
      expect(await registry.tokenURI(0)).to.eq("");
    });
    it("Should allow to get funds manager", async function () {
      const { registry, manager } = await loadFixture(setupFixture);
      expect(await registry.fundsManager()).to.eq(manager.address);
    });
    it("Should allow to get whitelisted-mode", async function () {
      const { registry } = await loadFixture(setupFixture);
      expect(await registry.whitelistEnabled()).to.not.be.reverted;
    });
  });

  describe("Modifiers", function () {
    it("Should not allow to proceed if duration is invalid", async function () {
      const { registry, owner } = await loadFixture(setupFixture);
      await registry.togglePause();
      await registry.toggleWhitelist();

      await expect(
        registry.mintNative(
          ["o", "o", "g", "a"],
          0,
          owner.address,
          "",
          owner.address,
        )
      ).to.be.revertedWithCustomError(registry, "LeaseTooShort");
    });
  });

  describe("Entrypoints", function () {
    describe("mintNative", function () {
      it("Should not allow to mint if registry is paused", async function () {
        const { registry, owner } = await loadFixture(setupFixture);
        await expect(
          registry.mintNative(
            ["o", "o", "g", "a"],
            1,
            owner.address,
            "https://example.com",
            owner.address
          )
        ).to.be.revertedWith("Pausable: paused");
      });
      it("Should not allow to mint if registry is in whitelist-mode", async function () {
        const { registry, owner } = await loadFixture(setupFixture);
        await registry.togglePause();
        await expect(
          registry.mintNative(
            ["o", "o", "g", "a"],
            1,
            owner.address,
            "https://example.com",
            owner.address
          )
        ).to.be.reverted;
      });
      it("Should allow to mint if registry is in whitelist-mode and caller is whitelisted", async function () {
        const { registry, otherAccount } = await loadFixture(setupFixture);
        await registry.togglePause();
        await registry.setWhitelisted([otherAccount.address], true);
        const r = registry.connect(otherAccount);
        await expect(
          r.mintNative(
            ["o", "o", "g", "a"],
            1,
            otherAccount.address,
            "https://example.com",
            otherAccount.address,
            {
              value: parseEther("169"),
            }
          )
        ).to.not.be.reverted;
      });
      it("Should not allow to mint if call is malformed", async function () {
        const { registry, owner } = await loadFixture(setupFixture);
        await registry.togglePause();
        await registry.toggleWhitelist();
        await expect(
          registry.mintNative(
            ["oo", "g", "a"],
            1,
            owner.address,
            "https://example.com",
            owner.address
          )
        ).to.be.revertedWithCustomError(registry, "Nope");
        await expect(
          registry.mintNative(
            ["ooga"],
            1,
            owner.address,
            "https://example.com",
            owner.address
          )
        ).to.be.revertedWithCustomError(registry, "Nope");
      });

      it("Should not allow to mint if price is not paid", async function () {
        const { registry, owner } = await loadFixture(setupFixture);
        await registry.togglePause();
        await registry.toggleWhitelist();
        await expect(
          registry.mintNative(
            ["o", "o", "g", "a"],
            1,
            owner.address,
            "https://example.com",
            owner.address,
            {
              value: parseEther("0"),
            }
          )
        ).to.be.reverted;
      });
      it("Should allow to mint if price is paid", async function () {
        const { registry, owner } = await loadFixture(setupFixture);
        await registry.togglePause();
        await registry.toggleWhitelist();

        await expect(
          registry.mintNative(
            ["o", "o", "g", "a"],
            1,
            owner.address,
            "https://example.com",
            owner.address,
            {
              value: parseEther("169.1"),
            }
          )
        ).to.not.be.reverted;
      });
      it("Should not-allow to mint if exists", async function () {
        const { registry, owner } = await loadFixture(setupFixture);
        await registry.togglePause();
        await registry.toggleWhitelist();

        await registry.mintNative(
          ["o", "o", "g", "a"],
          1,
          owner.address,
          "https://example.com",
          owner.address,
          {
            value: parseEther("169"),
          }
        );
        await expect(
          registry.mintNative(
            ["o", "o", "g", "a"],
            1,
            owner.address,
            "https://example.com",
            owner.address,
            {
              value: parseEther("169"),
            }
          )
        ).to.be.revertedWithCustomError(registry, "Exists");
      });
      it("Should not allow to mint if within GRACE_PERIOD", async function () {
        const { registry, owner } = await loadFixture(setupFixture);
        await registry.togglePause();
        await registry.toggleWhitelist();

        await registry.mintNative(
          ["o", "o", "g", "a"],
          1,
          owner.address,
          "https://example.com",
          owner.address,
          {
            value: parseEther("169"),
          }
        );
        await network.provider.send("evm_increaseTime", [86400 * (365 + 29)]);
        await expect(
          registry.mintNative(
            ["o", "o", "g", "a"],
            1,
            owner.address,
            "https://example.com",
            owner.address,
            {
              value: parseEther("169"),
            }
          )
        ).to.be.revertedWithCustomError(registry, "Exists");
      });
      it("Should allow to mint if beyond expiry + GRACE_PERIOD", async function () {
        const { registry, owner } = await loadFixture(setupFixture);
        await registry.togglePause();
        await registry.toggleWhitelist();

        await registry.mintNative(
          ["o", "o", "g", "a"],
          1,
          owner.address,
          "https://example.com",
          owner.address,
          {
            value: parseEther("169"),
          }
        );
        await network.provider.send("evm_increaseTime", [86400 * (365 + 30)]);
        await expect(
          registry.mintNative(
            ["o", "o", "g", "a"],
            1,
            owner.address,
            "https://example.com",
            owner.address,
            {
              value: parseEther("169"),
            }
          )
        ).to.not.be.reverted;
      });
    });
    describe("renewNative", function () {
      it("Should not allow to renew if beyond GRACE_PERIOD", async function () {
        const { registry, owner } = await loadFixture(setupFixture);
        await registry.togglePause();
        await registry.toggleWhitelist();

        await registry.mintNative(
          ["o", "o", "g", "a"],
          1,
          owner.address,
          "https://example.com",
          owner.address,
          {
            value: parseEther("169"),
          }
        );
        await network.provider.send("evm_increaseTime", [
          86400 * (365 * 2 + 31),
        ]);
        await expect(
          registry.renewNative(["o", "o", "g", "a"], 1, {
            value: parseEther("169"),
          })
        ).to.be.reverted;
      });
      it("Should allow to renew also if in GRACE_PERIOD", async function () {
        const { registry, owner } = await loadFixture(setupFixture);
        await registry.togglePause();
        await registry.toggleWhitelist();

        await registry.mintNative(
          ["o", "o", "g", "a"],
          1,
          owner.address,
          "https://example.com",
          owner.address,
          {
            value: parseEther("169"),
          }
        );
        await network.provider.send("evm_increaseTime", [86400 * (365 + 29)]);
        await expect(
          registry.renewNative(["o", "o", "g", "a"], 1, {
            value: parseEther("169"),
          })
        ).to.not.be.reverted;
      });
      it("Should allow to renew if brefore expiry", async function () {
        const { registry, owner } = await loadFixture(setupFixture);
        await registry.togglePause();
        await registry.toggleWhitelist();

        await registry.mintNative(
          ["o", "o", "g", "a"],
          1,
          owner.address,
          "https://example.com",
          owner.address,
          {
            value: parseEther("169"),
          }
        );
        await expect(
          registry.renewNative(["o", "o", "g", "a"], 1, {
            value: parseEther("169"),
          })
        ).to.not.be.reverted;
      });

      it("Should not allow to renew if token hasn't been minted yet", async function () {
        const { registry } = await loadFixture(setupFixture);
        await expect(
          registry.renewNative(["o", "o", "g", "a"], 1, {
            value: parseEther("169"),
          })
        ).to.be.revertedWithCustomError(registry, "Nope");
      });
    });

    describe("updateWhois", function () {
      it("Should not allow to update whois if sender is not an owner of token", async function () {
        const { registry, owner, otherAccount } = await loadFixture(
          setupFixture
        );

        const chars = ["o", "o", "g", "a"];

        await registry.togglePause();
        await registry.toggleWhitelist();

        await registry.mintNative(
          chars,
          1,
          owner.address,
          "www.google.com",
          owner.address,
          {
            value: parseEther("169"),
          }
        );

        const id = BigInt(
          keccak256(defaultAbiCoder.encode(["string[]"], [chars]))
        );

        await expect(
          registry.connect(otherAccount).updateWhois(id, otherAccount.address)
        ).to.be.revertedWithCustomError(registry, "Nope");
      });

      it("Should allow to change whois", async function () {
        const { registry, owner, otherAccount } = await loadFixture(
          setupFixture
        );

        const chars = ["o", "o", "g", "a", "🦆", "🐷"];

        await registry.togglePause();
        await registry.toggleWhitelist();

        await registry.mintNative(
          chars,
          1,
          owner.address,
          "www.google.com",
          owner.address,
          {
            value: parseEther("31.25"),
          }
        );

        const id = BigInt(
          keccak256(defaultAbiCoder.encode(["string[]"], [chars]))
        );

        await expect(registry.updateWhois(id, otherAccount.address)).to.not.be
          .reverted;
        let names = await registry.reverseLookup(otherAccount.address);
        console.log(names);
        for (let i = 0; i < names.length; i++) {
          const name = names[i];
          for (let j = 0; j < name.length; j++) {
            expect(name[j]).to.eq(chars[j]);
          }
        }
      });
    });

    describe("updateMetadataURI", function () {
      it("Should allow to update metadataURI", async function () {
        const { registry, owner } = await loadFixture(setupFixture);

        const chars = ["o", "o", "g", "a"];
        await registry.togglePause();
        await registry.toggleWhitelist();

        await registry.mintNative(
          chars,
          1,
          owner.address,
          "www.google.com",
          owner.address,
          {
            value: parseEther("169"),
          }
        );

        const id = BigInt(
          keccak256(defaultAbiCoder.encode(["string[]"], [chars]))
        );

        await expect(registry.updateMetadataURI(id, "www.yahoo.com")).to.not.be
          .reverted;
        expect((await registry.names(id)).metadataURI).to.eq("www.yahoo.com");
      });
      it("Should not allow to update metadata if caller is not an owner of token", async function () {
        const { registry, owner, otherAccount } = await loadFixture(
          setupFixture
        );

        const chars = ["o", "o", "g", "a"];
        await registry.togglePause();
        await registry.toggleWhitelist();

        await registry.mintNative(
          chars,
          1,
          owner.address,
          "www.google.com",
          owner.address,
          {
            value: parseEther("169"),
          }
        );

        const id = BigInt(
          keccak256(defaultAbiCoder.encode(["string[]"], [chars]))
        );

        await expect(
          registry.connect(otherAccount).updateMetadataURI(id, "www.yahoo.com")
        ).to.be.revertedWithCustomError(registry, "Nope");
      });
    });
  });
});
