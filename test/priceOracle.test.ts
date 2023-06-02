import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect, should } from "chai";
import { ethers } from "hardhat";
import deployPriceOracle from "./utils/deployPriceOracle";
import emojis from "../scripts/emojis/list";

function ppy(chars: Array<string>) {
    const emojiCount = chars.reduce((acc, char) => {
        if (emojis.includes(char)) return acc + 1;
        return acc;
    }, 0);
    let ppy: bigint;
    switch (chars.length) {
        case 1:
            ppy = BigInt(999);
            break;
        case 2:
            ppy = BigInt(690);
            break;
        case 3:
            ppy = BigInt(420);
            break;
        case 4:
            ppy = BigInt(169);
            break;
        default:
            ppy = BigInt(25);
            break;
    }
    ppy *= BigInt(1e18);
    if (chars.length == emojiCount) {
        ppy += (ppy * BigInt(69)) / BigInt(100);
    } else if (emojiCount > 0) {
        ppy += (ppy * BigInt(25)) / BigInt(100);
    }
    return ppy;
}

function price(chars: Array<string>, duration: bigint) {
    const ppy_ = ppy(chars);
    let result = ppy_;
    for (let i = 2; i <= Number(duration); ++i) {
        const x = BigInt(i);
        result += (ppy_ * BigInt(110) ** x) / BigInt(100) ** x;
    }
    console.log(`Chars: ${chars} duration: ${duration.toString()} => price: ${result.toString()}`);
    return result;
}

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

        describe("countEmojisAndCheckForInvalidCharacters", function () {
            it("Should successfully count emojis", async function () {
                expect(await _oracle.countEmojisAndCheckForInvalidCharacters(["🐻", "🪪"])).to.eq(2);
                expect(await _oracle.countEmojisAndCheckForInvalidCharacters(["🐻", "🪪", "🐻‍❄️", "🫶"])).to.eq(4);
            });
            it("Should check for invalid chars", async function () {
                expect(await _oracle.countEmojisAndCheckForInvalidCharacters(["🐻", "🪪", ""])).to.be.reverted;
                expect(await _oracle.countEmojisAndCheckForInvalidCharacters(["🐻", "🪪", " "])).to.be.reverted;
                expect(await _oracle.countEmojisAndCheckForInvalidCharacters(["🐻", "🪪", "."])).to.be.reverted;
            });
        });

        describe("dollarPriceForNamePerYear", function () {
            it("Should return a correct price", async function () {
                expect(await _oracle.dollarPriceForNamePerYear(["🐻‍❄️", "🫶"])).to.eq(ppy(["🐻‍❄️", "🫶"]));
                expect(await _oracle.dollarPriceForNamePerYear(["🐻‍❄️", "🫶", "🎃"])).to.eq(ppy(["🐻‍❄️", "🫶", "🎃"]));
                expect(await _oracle.dollarPriceForNamePerYear(["🫶", "🐻‍❄️", "🎃", "💩"])).to.eq(
                    ppy(["🫶", "🐻‍❄️", "🎃", "💩"])
                );
                expect(await _oracle.dollarPriceForNamePerYear(["🐻‍❄️", "🫶", "🎃", "💩", "😮"])).to.eq(
                    ppy(["🐻‍❄️", "🫶", "🎃", "💩", "😮"])
                );
                expect(await _oracle.dollarPriceForNamePerYear(["b", "e", "r", "a", "🐻‍❄️"])).to.eq(
                    ppy(["b", "e", "r", "a", "🐻‍❄️"])
                );
                expect(await _oracle.dollarPriceForNamePerYear(["o"])).to.eq(ppy(["o"]));
            });

            it("Should revert if single emoji", async function () {
                await expect(_oracle.dollarPriceForNamePerYear(["🐻"])).to.be.revertedWithCustomError(_oracle, "Nope");
            });
        });

        describe("price", function () {
            it("Should return correct price", async function () {
                let asset = ethers.constants.AddressZero;
                expect(await _oracle.price(["b", "e", "r", "a"], 1, asset)).to.eq(ppy(["b", "e", "r", "a"]));
                expect(await _oracle.price(["b", "e", "r", "a"], 3, asset)).to.eq(
                    price(["b", "e", "r", "a"], BigInt(3))
                );
                expect(await _oracle.price(["b", "e", "r", "a"], 4, asset)).to.eq(
                    price(["b", "e", "r", "a"], BigInt(4))
                );
                expect(await _oracle.price(["b", "e", "r", "a"], 5, asset)).to.eq(
                    price(["b", "e", "r", "a"], BigInt(5))
                );
                expect(await _oracle.price(["b", "e", "r", "a"], 6, asset)).to.eq(
                    price(["b", "e", "r", "a"], BigInt(6))
                );
                expect(await _oracle.price(["b", "e", "r", "a"], 7, asset)).to.eq(
                    price(["b", "e", "r", "a"], BigInt(7))
                );
                expect(await _oracle.price(["b", "e", "r", "a"], 10, asset)).to.eq(
                    price(["b", "e", "r", "a"], BigInt(10))
                );
                expect(await _oracle.price(["b", "e", "r", "a"], 20, asset)).to.eq(
                    price(["b", "e", "r", "a"], BigInt(20))
                );
                expect(await _oracle.price(["🦆", "🐷"], 1, asset)).to.eq(ppy(["🦆", "🐷"]));
                expect(await _oracle.price(["o", "o", "g", "a", "🦆", "🐷"], 8, asset)).to.eq(
                    price(["o", "o", "g", "a", "🦆", "🐷"], BigInt(8))
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
