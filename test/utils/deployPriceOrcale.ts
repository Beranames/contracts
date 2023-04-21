import { ethers } from "hardhat";

async function deployPriceOracle() {
    const [owner, otherAccount] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("PriceOracle");
    const oracle = factory.deploy();
    return { oracle, owner, otherAccount };
}

export default deployPriceOracle();
