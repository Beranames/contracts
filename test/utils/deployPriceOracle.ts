import { ethers } from "hardhat";

async function deployPriceOracle() {
    const [owner, otherAccount] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("PriceOracle");
    const oracle = await factory.deploy();
    await oracle.deployed();
    return { oracle, owner, otherAccount };
}

export default deployPriceOracle;