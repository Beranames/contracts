import { ethers } from "hardhat";
import getEmojiBatch from "../../scripts/emojis/getBatchEmojis";

async function deployPriceOracle() {
    const [owner, otherAccount] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("PriceOracle");
    const oracle = await factory.deploy();
    const emojiGenerator = getEmojiBatch();
    while (true) {
        const batch = emojiGenerator.next();
        if (batch.done) break;
        await oracle.setEmojis(batch.value);
    }
    return { oracle, owner, otherAccount };
}

export default deployPriceOracle;
