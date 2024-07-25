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
import { formatEther, parseEther } from "ethers/lib/utils";

const HONEY_ADDRESS = '0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03'

const deployAddressesProvider = async (): Promise<AddressesProvider> => {
  const addressesProviderFactory = await ethers.getContractFactory(
    "AddressesProvider"
  );

  const addressesProvider = await addressesProviderFactory.deploy(
    constants.AddressZero, // registry
    constants.AddressZero, // priceOracle
    constants.AddressZero, // fundsManager
    constants.AddressZero, // auctionHouse
    constants.AddressZero, // team
    constants.AddressZero, // foundation
    constants.AddressZero // treasury
  );
  await addressesProvider.deployed();
  console.log(
    `AddressesProvider deployed at: ${(addressesProvider as unknown as { address: string }).address
    }`
  );
  return addressesProvider;
};

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

const deployPriceOracle = async (): Promise<PriceOracle> => {
  const price = await ethers.getContractFactory("PriceOracle");
  const priceOracle = await price.deploy();
  await priceOracle.deployed();
  console.log(
    "PriceOracle deployed to:",
    (priceOracle as unknown as { address: string }).address
  );

  const aggregatorBera = await deployMockAggregatorV3(
    BigNumber.from(18),
    parseEther("69.420")
  );

  const aggregatorHoney = await deployMockAggregatorV3(
    BigNumber.from(18),
    parseEther("100")
  );

  await priceOracle.setAssetOracle(constants.AddressZero, aggregatorBera.address);
  await priceOracle.setAssetOracle(HONEY_ADDRESS, aggregatorHoney.address);
  return priceOracle;
};

const deployAuctionhouse = async (
  addressesProviderAddress: string
): Promise<AuctionHouse> => {
  const auctionhouseFactory = await ethers.getContractFactory("AuctionHouse");

  const auctionhouse = await auctionhouseFactory.deploy(
    addressesProviderAddress
  );
  await auctionhouse.deployed();
  console.log(
    "AuctionHouse deployed to:",
    (auctionhouse as unknown as { address: string }).address
  );

  return auctionhouse;
};

const deployFundsManager = async (
  addressesProvider: string
): Promise<FundsManager> => {
  const fundsMangerFactory = await ethers.getContractFactory("FundsManager");

  const fundsManager = await fundsMangerFactory.deploy(addressesProvider);
  await fundsManager.deployed();
  console.log(
    "FundsManager deployed to:",
    (fundsManager as unknown as { address: string }).address
  );
  return fundsManager;
};

const deployRegistry = async (
  addressesProvider: string
): Promise<BeranamesRegistry> => {
  const registryFactory = await ethers.getContractFactory("BeranamesRegistry");

  const registry = await registryFactory.deploy(addressesProvider);
  await registry.deployed();
  console.log(
    "Registry deployed to:",
    (registry as unknown as { address: string }).address
  );
  return registry;
};

const setEmojisOnPriceAndmintToAuctionHouse = async (
  price: PriceOracle,
  registry: BeranamesRegistry,
  startBatch: number
) => {
  const emojiGenerator = getEmojiBatch();
  let batchNumber = 1;
  while (true) {
    if (batchNumber < startBatch) {
      batchNumber++;
      continue;
    }
    const batch = emojiGenerator.next();
    if (batch.done) break;
    // set emojis
    const px = await price.setEmojis(batch.value);
    await px.wait();
    console.log(`Batch ${batchNumber} correclty set on price oracle`);
    // mint to auction house
    // try {
    //   await registry.mintToAuctionHouse(
    //     batch.value.reduce(
    //       (a, b) => a.concat([[b]]),
    //       [] as Array<Array<string>>
    //     )
    //   );
    // } catch (e) {
    //   console.log(`Batch ${batchNumber} failed to mint to auction house`);
    //   console.log(e);

    //   const errExists = registry.interface.getSighash("Exists()");
    //   console.log(errExists);
    //   // registry.interface.decodeErrorResult(e.data);
    //   return;
    // }

    console.log(`Batch ${batchNumber} correclty minted to auction house`);
    batchNumber++;
  }
  console.log(`Emojis minted to auction house`);
};

async function main() {
  const signers = await ethers.getSigners();
  const balanceBefore = await ethers.provider.getBalance(signers[0].address);
  const addressesProvider = await deployAddressesProvider();
  const price = await deployPriceOracle();
  const auctionHouse = await deployAuctionhouse(addressesProvider.address);
  const fundsManager = await deployFundsManager(addressesProvider.address);
  const registry = await deployRegistry(addressesProvider.address);

  let teamAddress = process.env.TEAM_ADDRESS || constants.AddressZero;
  let foundationAddress =
    process.env.FOUNDATION_ADDRESS || constants.AddressZero;
  let treasuryAddress = process.env.TREASURY_ADDRESS || constants.AddressZero;
  let gasUsed = BigNumber.from(0);

  const setAddresses = await addressesProvider.multicall([
    addressesProvider.interface.encodeFunctionData("setPriceOracle", [
      price.address,
    ]),
    addressesProvider.interface.encodeFunctionData("setAuctionHouse", [
      auctionHouse.address,
    ]),
    addressesProvider.interface.encodeFunctionData("setFundsManager", [
      fundsManager.address,
    ]),
    addressesProvider.interface.encodeFunctionData("setRegistry", [
      registry.address,
    ]),
    addressesProvider.interface.encodeFunctionData("setTeam", [teamAddress]),
    addressesProvider.interface.encodeFunctionData("setFoundation", [
      foundationAddress,
    ]),
    addressesProvider.interface.encodeFunctionData("setTreasury", [
      treasuryAddress,
    ]),
  ]);

  console.log(`AddressesProvider updated with new addresses`);
  const setAddressesRx = await setAddresses.wait();
  gasUsed = gasUsed.add(setAddressesRx.gasUsed);

  // mint singles to auction house
  const emojiGenerator = getEmojiBatch();
  while (true) {
    const batch = emojiGenerator.next();
    if (batch.done) break;
    // mint to auction house
    const mintTx = await registry.mintToAuctionHouse(
      batch.value.reduce((a, b) => a.concat([[b]]), [] as Array<Array<string>>)
    );
    const mintRx = await mintTx.wait();
    gasUsed = gasUsed.add(mintRx.gasUsed);
  }
  console.log(`Emojis set and minted to auction house`);
  const unpauseTx = await registry.togglePause();
  const unpauseRx = await unpauseTx.wait();
  console.log(`Registry unpaused`);
  gasUsed = gasUsed.add(unpauseRx.gasUsed);
  console.log(`GAS USED: ${gasUsed.toString()}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.log('hello')
  console.error(error);
  process.exitCode = 1;
});
