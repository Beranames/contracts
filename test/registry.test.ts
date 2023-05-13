import { ethers, utils } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import deployAddressesProviderFixture from "./utils/deployAddressesProvider";
import deployFundsManagerFixture from "./utils/deployFundsManager";
import deployPriceOracleFixture from "./utils/deployPriceOracle";
import deployRegistryFixture from "./utils/deployRegistry";
import deployAuctionHouseFixture from "./utils/deployAuctionHouse";
import { AbiCoder, defaultAbiCoder, keccak256, parseEther } from "ethers/lib/utils";
import { network } from "hardhat";
import deployERC20 from "./utils/deployErc20";

describe("BeranamesRegistry", function () {
    async function setupFixture() {
        const fixtureData = await deployAddressesProviderFixture();
        const { provider, owner, otherAccount } = fixtureData;
        const { oracle } = await loadFixture(deployPriceOracleFixture);
        const { manager } = await loadFixture(deployFundsManagerFixture);
        const { auctionHouse } = await loadFixture(deployAuctionHouseFixture);
        const { registry } = await loadFixture(deployRegistryFixture);
        const { erc20 } = await loadFixture(deployERC20);
        await provider.multicall([
            provider.interface.encodeFunctionData("setRegistry", [registry.address]),
            provider.interface.encodeFunctionData("setPriceOracle", [oracle.address]),
            provider.interface.encodeFunctionData("setFundsManager", [manager.address]),
            provider.interface.encodeFunctionData("setAuctionHouse", [auctionHouse.address]),
        ]);

        return { provider, owner, otherAccount, oracle, manager, auctionHouse, registry, erc20 };
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
            await expect(registry.mintToAuctionHouse([["🐻"], ["😄"], ["🤪"]])).to.not.be.reverted;
        });
        it("Should not allow  non-owners to mint to the auction house", async function () {
            const { registry, otherAccount } = await loadFixture(setupFixture);
            const r = registry.connect(otherAccount);
            await expect(r.mintToAuctionHouse([["🐻‍❄️"]])).to.be.revertedWith("Ownable: caller is not the owner");
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
    });

    describe("Modifiers", function () {
        it("Should not allow to proceed if duration is invalid", async function () {
            const { registry, owner, erc20 } = await loadFixture(setupFixture);
            await registry.togglePause();

            await expect(
                registry.mintERC20(["o", "o", "g", "a"], 0, owner.address, "", owner.address, erc20.address)
            ).to.be.revertedWithCustomError(registry, "LeaseTooShort");
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
                    registry.mintNative(["oo", "g", "a"], 1, owner.address, "https://example.com", owner.address)
                ).to.be.revertedWithCustomError(registry, "Nope");
                await expect(
                    registry.mintNative(["ooga"], 1, owner.address, "https://example.com", owner.address)
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
            it("Should not-allow to mint if exists", async function () {
                const { registry, owner } = await loadFixture(setupFixture);
                await registry.togglePause();
                await registry.mintNative(
                    ["o", "o", "g", "a"],
                    1,
                    owner.address,
                    "https://example.com",
                    owner.address,
                    {
                        value: parseEther("80"),
                    }
                );
                await expect(
                    registry.mintNative(["o", "o", "g", "a"], 1, owner.address, "https://example.com", owner.address, {
                        value: parseEther("80"),
                    })
                ).to.be.revertedWithCustomError(registry, "Exists");
            });
            it("Should not allow to mint if within GRACE_PERIOD", async function () {
                const { registry, owner } = await loadFixture(setupFixture);
                await registry.togglePause();
                await registry.mintNative(
                    ["o", "o", "g", "a"],
                    1,
                    owner.address,
                    "https://example.com",
                    owner.address,
                    {
                        value: parseEther("80"),
                    }
                );
                await network.provider.send("evm_increaseTime", [86400 * (365 + 29)]);
                await expect(
                    registry.mintNative(["o", "o", "g", "a"], 1, owner.address, "https://example.com", owner.address, {
                        value: parseEther("80"),
                    })
                ).to.be.revertedWithCustomError(registry, "Exists");
            });
            it("Should allow to mint if beyond expiry + GRACE_PERIOD", async function () {
                const { registry, owner } = await loadFixture(setupFixture);
                await registry.togglePause();
                await registry.mintNative(
                    ["o", "o", "g", "a"],
                    1,
                    owner.address,
                    "https://example.com",
                    owner.address,
                    {
                        value: parseEther("80"),
                    }
                );
                await network.provider.send("evm_increaseTime", [86400 * (365 + 30)]);
                await expect(
                    registry.mintNative(["o", "o", "g", "a"], 1, owner.address, "https://example.com", owner.address, {
                        value: parseEther("80"),
                    })
                ).to.not.be.reverted;
            });
        });
        describe("renewNative", function () {
            it("Should allow to renew", async function () {
                const { registry, owner } = await loadFixture(setupFixture);
                await registry.togglePause();
                await registry.mintNative(
                    ["o", "o", "g", "a"],
                    1,
                    owner.address,
                    "https://example.com",
                    owner.address,
                    {
                        value: parseEther("80"),
                    }
                );
                await network.provider.send("evm_increaseTime", [86400 * (365 * 2 + 31)]);
                await expect(registry.renewNative(["o", "o", "g", "a"], 1, { value: parseEther("80") })).to.not.be
                    .reverted;
            });
            it("Should allow to renew also if remainder == 0", async function () {
                const { registry, owner } = await loadFixture(setupFixture);
                await registry.togglePause();
                await registry.mintNative(
                    ["o", "o", "g", "a"],
                    1,
                    owner.address,
                    "https://example.com",
                    owner.address,
                    {
                        value: parseEther("80"),
                    }
                );
                await network.provider.send("evm_increaseTime", [86400 * (365 + 31)]);
                await expect(registry.renewNative(["o", "o", "g", "a"], 1, { value: parseEther("80") })).to.not.be
                    .reverted;
            });
            it("Should not allow to renew if token is not expired", async function () {
                const { registry, owner } = await loadFixture(setupFixture);
                await registry.togglePause();
                await registry.mintNative(
                    ["o", "o", "g", "a"],
                    1,
                    owner.address,
                    "https://example.com",
                    owner.address,
                    {
                        value: parseEther("80"),
                    }
                );
                await expect(
                    registry.renewNative(["o", "o", "g", "a"], 1, { value: parseEther("80") })
                ).to.be.revertedWithCustomError(registry, "Nope");
            });

            it("Should not allow to renew if token hasn't been minted yet", async function () {
                const { registry } = await loadFixture(setupFixture);
                await expect(
                    registry.renewNative(["o", "o", "g", "a"], 1, { value: parseEther("80") })
                ).to.be.revertedWithCustomError(registry, "Nope");
            });
        });

        describe("mintERC20", function () {
            it("Should not allow to mint if registry is paused", async function () {
                const { registry, owner, erc20 } = await loadFixture(setupFixture);

                await expect(
                    registry.mintERC20(
                        ["o", "o", "g", "a"],
                        1,
                        owner.address,
                        "https://www.google.com",
                        owner.address,
                        erc20.address
                    )
                ).to.be.revertedWith("Pausable: paused");
            });

            it("Should allow to mint ERC20", async function () {
                const { registry, owner, erc20 } = await loadFixture(setupFixture);
                await registry.togglePause();

                await erc20.approve(registry.address, BigInt("90000000000000000000"));

                await expect(
                    registry.mintERC20(
                        ["o", "o", "g", "a"],
                        1,
                        owner.address,
                        "https://www.google.com",
                        owner.address,
                        erc20.address
                    )
                ).to.not.be.reverted;
            });
        });

        describe("renewERC20", function () {
            it("Should allow to renew ERC20", async function () {
                const { registry, owner, erc20 } = await loadFixture(setupFixture);
                await registry.togglePause();
                await erc20.approve(registry.address, BigInt("90000000000000000000"));

                await registry.mintERC20(
                    ["o", "o", "g", "a"],
                    1,
                    owner.address,
                    "https://www.google.com",
                    owner.address,
                    erc20.address
                );

                await network.provider.send("evm_increaseTime", [86400 * (365 + 30)]);

                await erc20.approve(registry.address, BigInt("90000000000000000000"));

                await expect(registry.renewERC20(["o", "o", "g", "a"], 1, erc20.address)).to.not.be.reverted;
            });
            it("Should correctly apply the pricing curve when renewing ERC20", async function () {
                const { registry, owner, erc20 } = await loadFixture(setupFixture);
                await registry.togglePause();
                await erc20.approve(registry.address, BigInt(1e24));

                await registry.mintERC20(
                    ["o", "o", "g", "a"],
                    2,
                    owner.address,
                    "https://www.google.com",
                    owner.address,
                    erc20.address
                );

                await network.provider.send("evm_increaseTime", [86400 * 360]);

                await erc20.approve(registry.address, BigInt(1e24));

                // await expect(registry.renewERC20(["o", "o", "g", "a"], 4, erc20.address)).to.not.be.reverted;
                await registry.renewERC20(["o", "o", "g", "a"], 4, erc20.address);
            });
            it("Should not allow to renew if name is not minted", async function () {
                const { registry, erc20 } = await loadFixture(setupFixture);
                await registry.togglePause();
                await erc20.approve(registry.address, BigInt("90000000000000000000"));

                await expect(registry.renewERC20(["o", "o", "g", "a"], 1, erc20.address)).to.be.revertedWithCustomError(
                    registry,
                    "NoEntity"
                );
            });
        });

        describe("updateWhois", function () {
            it("Should not allow to update whois if sender is not an owner of token", async function () {
                const { registry, owner, otherAccount } = await loadFixture(setupFixture);

                const chars = ["o", "o", "g", "a"];

                await registry.togglePause();
                await registry.mintNative(chars, 1, owner.address, "www.google.com", owner.address, {
                    value: parseEther("80"),
                });

                const id = BigInt(keccak256(defaultAbiCoder.encode(["string[]"], [chars])));

                await expect(
                    registry.connect(otherAccount).updateWhois(id, otherAccount.address)
                ).to.be.revertedWithCustomError(registry, "Nope");
            });

            it("Should allow to change whois", async function () {
                const { registry, owner, otherAccount } = await loadFixture(setupFixture);

                const chars = ["o", "o", "g", "a"];

                await registry.togglePause();
                await registry.mintNative(chars, 1, owner.address, "www.google.com", owner.address, {
                    value: parseEther("80"),
                });

                const id = BigInt(keccak256(defaultAbiCoder.encode(["string[]"], [chars])));

                await expect(registry.updateWhois(id, otherAccount.address)).to.not.be.reverted;
            });
        });

        describe("updateMetadataURI", function () {
            it("Should allow to update metadataURI", async function () {
                const { registry, owner } = await loadFixture(setupFixture);

                const chars = ["o", "o", "g", "a"];
                await registry.togglePause();
                await registry.mintNative(chars, 1, owner.address, "www.google.com", owner.address, {
                    value: parseEther("80"),
                });

                const id = BigInt(keccak256(defaultAbiCoder.encode(["string[]"], [chars])));

                await expect(registry.updateMetadataURI(id, "www.yahoo.com")).to.not.be.reverted;
                expect((await registry.names(id)).metadataURI).to.eq("www.yahoo.com");
            });
            it("Should not allow to update metadata if caller is not an owner of token", async function () {
                const { registry, owner, otherAccount } = await loadFixture(setupFixture);

                const chars = ["o", "o", "g", "a"];
                await registry.togglePause();
                await registry.mintNative(chars, 1, owner.address, "www.google.com", owner.address, {
                    value: parseEther("80"),
                });

                const id = BigInt(keccak256(defaultAbiCoder.encode(["string[]"], [chars])));

                await expect(
                    registry.connect(otherAccount).updateMetadataURI(id, "www.yahoo.com")
                ).to.be.revertedWithCustomError(registry, "Nope");
            });
        });
    });
});
