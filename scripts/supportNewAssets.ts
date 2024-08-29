import { ethers } from "hardhat";
import { constants, BigNumber } from "ethers";
import getEmojiBatch from "./emojis/getBatchEmojis";
import {
  AddressesProvider,
  AuctionHouse,
  BeranamesRegistry,
  FundsManager,
  MockAggregatorV3,
  PriceOracle,
} from "../typechain-types";
import { parseEther } from "ethers/lib/utils";

const deployMockAggregatorV3 = async (
  decimals: BigNumber,
  price: BigNumber
): Promise<MockAggregatorV3> => {
  const mockAggregatorV3Factory = await ethers.getContractFactory(
    "MockAggregatorV3"
  );
  const mockAggregatorV3 = await mockAggregatorV3Factory.deploy(
    decimals,
    price
  );
  await mockAggregatorV3.deployed();
  console.log(
    "MockAggregatorV3 deployed to:",
    (mockAggregatorV3 as unknown as { address: string }).address
  );
  return mockAggregatorV3;
};

const main = async () => {
  const [deployer, ...rest] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const priceFactory = await ethers.getContractFactory("PriceOracle");
  const price = priceFactory.attach(
    "0x3b872E5DEE3cD8186E1F304514D1dc6Ac34d5d54" // price oracle address
  );

  // 1 BERA = 69420.00 USD
  const aggregatorBERA = await deployMockAggregatorV3(
    BigNumber.from(18),
    parseEther("69420")
  );

  // 1 HONEY = 1 USD
  const aggregatorHONEY = await deployMockAggregatorV3(
    BigNumber.from(18),
    parseEther("100")
  );

  // await price.setAssetOracle(constants.AddressZero, aggregatorBERA.address);
  // await price.setAssetOracle(
  //   "0x7EeCA4205fF31f947EdBd49195a7A88E6A91161B", // HONEY address
  //   // or 0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03 https://bartio.beratrail.io/token/0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03?chainid=80084
  //   aggregatorHONEY.address
  // );
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
