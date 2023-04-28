import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect, should } from "chai";
import { ethers } from "hardhat";
import deployPriceOracle from "./utils/deployPriceOracle";

describe("PriceOracle", function () {
    let _oracle: any;
    let _owner: any;
    let _otherAccount: any;

    let toUtf8Encode = ethers.utils.toUtf8Bytes;

    async function deploy() {
        const { oracle, owner, otherAccount } = await loadFixture(deployPriceOracle);
        _oracle = oracle;
        _owner = owner;
        _otherAccount = otherAccount;
    }

    this.beforeEach(async function () {
        await deploy();
    });

    describe("Deployment", function () {
        it("Should deploy with proper address", async function () {
            await deploy();
            expect(_oracle.address).to.be.properAddress;
        });
        it("Should init correct data on deployment", async function () {
            let beraBytes = toUtf8Encode("🐻");
            let licenseBytes = toUtf8Encode("🪪");
            expect(await _oracle.isEmoji(beraBytes)).to.eq(true);
            expect(await _oracle.isEmoji(licenseBytes)).to.eq(true);
        });
    });

    describe("Updates", function () {
        describe("setEmojis", function () {
            it("Should set emojis", async function () {
                let emojis = ["🐻‍❄️", "🫶"];
                await _oracle.setEmojis(emojis);

                expect(await _oracle.isEmoji(toUtf8Encode("🐻‍❄️"))).to.eq(true);
                expect(await _oracle.isEmoji(toUtf8Encode("🫶"))).to.eq(true);
            });

            it("Should revert if caller is not an owner", async function () {
                await expect(_oracle.connect(_otherAccount).setEmojis(["🦶"])).to.be.revertedWith(
                    "Ownable: caller is not the owner"
                );
            });
        });

        describe("countEmojis", function () {
            it("Should successfully count emojis", async function () {
                expect(await _oracle.countEmojis(["🐻", "🪪"])).to.eq(2);
            });
            it("Should revert if incorrect input", async function () {
                await expect(_oracle.countEmojis(["🐻‍❄️", "🫶"])).to.be.revertedWithCustomError(_oracle, "Nope");
            });
        });

        describe("dollarPriceForNamePerYear", function () {
            it("Should return a correct price", async function () {
                let emojis = ["🐻‍❄️", "🫶", "🎃", "💩", "😮"];
                await _oracle.setEmojis(emojis);
                expect(await _oracle.dollarPriceForNamePerYear(["🐻‍❄️", "🫶"])).to.eq(BigInt((690 * 1e18 * 69) / 100));
                expect(await _oracle.dollarPriceForNamePerYear(["🐻‍❄️", "🫶", "🎃"])).to.eq(
                    BigInt((450 * 1e18 * 69) / 100)
                );
                expect(await _oracle.dollarPriceForNamePerYear(["🫶", "🐻‍❄️", "🎃", "💩"])).to.eq(
                    BigInt((80 * 1e18 * 69) / 100)
                );
                expect(await _oracle.dollarPriceForNamePerYear(["🐻‍❄️", "🫶", "🎃", "💩", "😮"])).to.eq(
                    BigInt((25 * 1e18 * 69) / 100)
                );
                expect(await _oracle.dollarPriceForNamePerYear(["b", "e", "r", "a", "🐻‍❄️"])).to.eq(
                    BigInt((25 * 1e18 * 25) / 100)
                );
                expect(await _oracle.dollarPriceForNamePerYear(["o"])).to.eq(BigInt(999 * 1e18));
            });

            it("Should revert if input length == 1", async function () {
                await expect(_oracle.dollarPriceForNamePerYear(["🐻"])).to.be.revertedWithCustomError(_oracle, "Nope");
            });
        });

        describe("price", function () {
            it("Should return correct price", async function () {
                await _oracle.setEmojis(["🦆", "🐷"]);
                let asset = ethers.constants.AddressZero;

                function exponent(duration: bigint) {
                    return duration - BigInt(1) + BigInt(110) ** duration / BigInt(100) ** duration;
                }

                expect(await _oracle.price(["b", "e", "r", "a"], 1, asset)).to.eq(BigInt(Math.floor(80 * 1e18)));

                expect(await _oracle.price(["🦆", "🐷"], 1, asset)).to.eq(BigInt((690 * 1e18 * 69) / 100));

                expect(await _oracle.price(["🦆", "🐷"], 3, asset)).to.eq(
                    BigInt((690 * 1e18 * 69) / 100) * exponent(BigInt(3))
                );
            });
        });

        describe("setAssetOracle", function () {
            it("Should set oracle address to priceFeed mapping", async function () {
                let assetAddress = "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4";
                let oracleAddress = _oracle.address;
                await _oracle.setAssetOracle(assetAddress, oracleAddress);

                expect(await _oracle.priceFeeds(assetAddress)).to.eq(oracleAddress);
            });
            it("Should revert if caller is not an owner", async function () {
                let assetAddress = "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4";
                let oracleAddress = _oracle.address;
                await expect(
                    _oracle.connect(_otherAccount).setAssetOracle(assetAddress, oracleAddress)
                ).to.be.revertedWith("Ownable: caller is not the owner");
            });
        });
    });
});
