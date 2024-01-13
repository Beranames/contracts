import { ethers } from "hardhat";
import { constants } from "ethers";

import getEmojiBatch from "../../scripts/emojis/getBatchEmojis";

async function deployPriceOracle() {
  const [owner, otherAccount] = await ethers.getSigners();
  const aggFactory = await ethers.getContractFactory("MockAggregatorV3");
  const agg1 = await aggFactory.deploy(8, 1e8);
  const agg3_14 = await aggFactory.deploy(10, 314e10);
  const factory = await ethers.getContractFactory("PriceOracle");
  const oracle = await factory.deploy();
  const emojiGenerator = getEmojiBatch();
  while (true) {
    const batch = emojiGenerator.next();
    if (batch.done) break;
    await oracle.setEmojis(batch.value);
  }
  await oracle.setAssetOracle(constants.AddressZero, agg1.address);

  return {
    oracle,
    aggregator1Address: agg1.address,
    agg3_14Address: agg3_14.address,
    owner,
    otherAccount,
  };
}

export default deployPriceOracle;
