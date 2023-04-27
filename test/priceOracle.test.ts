import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect, should } from "chai";
import deployPriceOracle from "./utils/deployPriceOracle";

describe("PriceOracle", function () {
    let _oracle: any
    let _owner: any
    let _otherAccount: any

    let utf8Encode = new TextEncoder()

    async function deploy() {
        const { oracle, owner, otherAccount } = await loadFixture(deployPriceOracle)
        _oracle = oracle
        _owner = owner
        _otherAccount = otherAccount
    }

    this.beforeEach(async function () {
        await deploy();
    })

    describe("Deployment", function () {
        it("Should deploy with proper address", async function () {
            await deploy()
            expect(_oracle.address).to.be.properAddress
        })
        it("Should init correct data on deployment", async function () {
            let beraBytes = utf8Encode.encode("🐻")
            let licenseBytes = utf8Encode.encode("🪪")
            expect(await _oracle.isEmoji(beraBytes)).to.eq(true)
            expect(await _oracle.isEmoji(licenseBytes)).to.eq(true)
        })
    })

    describe("Updates", function () {
        describe("setEmojis", function() {
            it("Should set emojis", async function () {
                let emojis = ["🐻‍❄️", "🫶"]
                await _oracle.setEmojis(emojis)
    
                expect(await _oracle.isEmoji(utf8Encode.encode("🐻‍❄️"))).to.eq(true)
                expect(await _oracle.isEmoji(utf8Encode.encode("🫶"))).to.eq(true)
            })

            it("Should revert if caller is not an owner", async function () {
                await expect(_oracle.connect(_otherAccount).setEmojis(["🦶"])).to.be.revertedWith("Ownable: caller is not the owner")
            })
        })
    })
})