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
      ppy = BigInt(16);
      break;
    case 2:
      ppy = BigInt(8);
      break;
    case 3:
      ppy = BigInt(4);
      break;
    case 4:
      ppy = BigInt(2);
      break;
    default:
      ppy = BigInt(1);
      break;
  }
  console.log(chars, ppy.toString());
  return ppy;
}

function price(chars: Array<string>, duration: bigint) {
  const ppy_ = ppy(chars);
  let result = ppy_;
  let ppy_discounted: bigint 
  ppy_discounted = ppy_
  switch (duration) {
    case BigInt(1):
      ppy_discounted = ppy_discounted;
    case BigInt(2):
      ppy_discounted = ppy_discounted * BigInt(95) / BigInt(100);
      break;
    case BigInt(3):
      ppy_discounted = ppy_discounted * BigInt(85) / BigInt(100);
      break;
    case BigInt(4):
      ppy_discounted = ppy_discounted * BigInt(70) / BigInt(100);
      break;
    default:
      ppy_discounted = ppy_discounted * BigInt(60) / BigInt(100);
      break;
  }
  console.log(chars, ppy_.toString(), ppy_discounted.toString());
  return ppy_discounted * duration;
}

describe("PriceOracle", function () {
  let _oracle: any;
  let _owner: any;
  let _otherAccount: any;

  let toUtf8Encode = ethers.utils.toUtf8Bytes;

  async function deploy() {
    const { oracle, owner, otherAccount } = await loadFixture(
      deployPriceOracle
    );
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
        await expect(
          _oracle.connect(_otherAccount).setEmojis(["🦶"])
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("countEmojisAndCheckForInvalidCharacters", function () {
      it("Should successfully count emojis", async function () {
        expect(
          await _oracle.countEmojisAndCheckForInvalidCharacters(["🐻", "🪪"])
        ).to.eq(2);
        expect(
          await _oracle.countEmojisAndCheckForInvalidCharacters([
            "🐻",
            "🪪",
            "🐻‍❄️",
            "🫶",
          ])
        ).to.eq(4);
      });
      it("Should check for invalid chars", async function () {
        expect(_oracle.countEmojisAndCheckForInvalidCharacters(["🐻", "🪪", ""]))
          .to.be.reverted;
        expect(
          _oracle.countEmojisAndCheckForInvalidCharacters(["🐻", "🪪", " "])
        ).to.be.reverted;
        expect(
          _oracle.countEmojisAndCheckForInvalidCharacters(["🐻", "🪪", "."])
        ).to.be.reverted;
      });
    });

    describe("price", function () {
      it("Should return correct price", async function () {
        // testing b
        expect(await _oracle.price(["b"], 1)).to.eq(
          ppy(["b"])
        );
        expect(await _oracle.price(["b"], 2)).to.eq(
          price(["b"], BigInt(2))
        );
        expect(await _oracle.price(["b"], 3)).to.eq(
          price(["b"], BigInt(3))
        );
        expect(await _oracle.price(["b"], 4)).to.eq(
          price(["b"], BigInt(4))
        );
        expect(await _oracle.price(["b"], 5)).to.eq(
          price(["b"], BigInt(5))
        );
        expect(await _oracle.price(["b"], 10)).to.eq(
          price(["b"], BigInt(10))
        );

        // testing be
        expect(await _oracle.price(["b", "e"], 1)).to.eq(
          ppy(["b", "e"])
        );
        expect(await _oracle.price(["b", "e"], 2)).to.eq(
          price(["b", "e"], BigInt(2))
        );
        expect(await _oracle.price(["b", "e"], 3)).to.eq(
          price(["b", "e"], BigInt(3))
        );
        expect(await _oracle.price(["b", "e"], 4)).to.eq(
          price(["b", "e"], BigInt(4))
        );
        expect(await _oracle.price(["b", "e"], 5)).to.eq(
          price(["b", "e"], BigInt(5))
        );
        expect(await _oracle.price(["b", "e"], 10)).to.eq(
          price(["b", "e"], BigInt(10))
        );

        // testing ber
        expect(await _oracle.price(["b", "e", "r"], 1)).to.eq(
          ppy(["b", "e", "r"])
        );
        expect(await _oracle.price(["b", "e", "r"], 2)).to.eq(
          price(["b", "e", "r"], BigInt(2))
        );
        expect(await _oracle.price(["b", "e", "r"], 3)).to.eq(
          price(["b", "e", "r"], BigInt(3))
        );
        expect(await _oracle.price(["b", "e", "r"], 4)).to.eq(
          price(["b", "e", "r"], BigInt(4))
        );
        expect(await _oracle.price(["b", "e", "r"], 5)).to.eq(
          price(["b", "e", "r"], BigInt(5))
        );
        expect(await _oracle.price(["b", "e", "r"], 10)).to.eq(
          price(["b", "e", "r"], BigInt(10))
        );

        // testing bera
        expect(await _oracle.price(["b", "e", "r", "a"], 1)).to.eq(
          ppy(["b", "e", "r", "a"])
        );
        expect(await _oracle.price(["b", "e", "r", "a"], 2)).to.eq(
          price(["b", "e", "r", "a"], BigInt(2))
        );
        expect(await _oracle.price(["b", "e", "r", "a"], 3)).to.eq(
          price(["b", "e", "r", "a"], BigInt(3))
        );
        expect(await _oracle.price(["b", "e", "r", "a"], 4)).to.eq(
          price(["b", "e", "r", "a"], BigInt(4))
        );
        expect(await _oracle.price(["b", "e", "r", "a"], 5)).to.eq(
          price(["b", "e", "r", "a"], BigInt(5))
        );
        expect(await _oracle.price(["b", "e", "r", "a"], 10)).to.eq(
          price(["b", "e", "r", "a"], BigInt(10))
        );
        
        // emojis
        expect(await _oracle.price(["🦆", "🐷"], 1)).to.eq(
          ppy(["🦆", "🐷"])
        );
        expect(
          await _oracle.price(["o", "o", "g", "a", "🦆", "🐷"], 8)
        ).to.eq(price(["o", "o", "g", "a", "🦆", "🐷"], BigInt(8)));

        // revert single emoji
        await expect(_oracle.price(["🦆"], 1)).to.be.revertedWithCustomError(_oracle, "Nope");
      });
    });
  });
});
