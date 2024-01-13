import { ethers } from "hardhat";

async function deployAggregator() {
  const [owner, otherAccount] = await ethers.getSigners();
  const factory = await ethers.getContractFactory("MockAggregatorV3");
  const agg = await factory.deploy(8, 1e8);

  return { agg, owner, otherAccount };
}

export default deployAggregator;
