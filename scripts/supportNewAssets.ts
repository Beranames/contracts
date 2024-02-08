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
    "0x64F412f821086253204645174c456b7532BA4527"
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

  await price.setAssetOracle(constants.AddressZero, aggregatorBERA.address);
  await price.setAssetOracle(
    "0x7EeCA4205fF31f947EdBd49195a7A88E6A91161B",
    aggregatorHONEY.address
  );
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
