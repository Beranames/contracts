import { ethers } from "hardhat";
import { constants, BigNumber } from "ethers";
import getEmojiBatch from "./emojis/getBatchEmojis";
import {
  AddressesProvider,
  AuctionHouse,
  BeranamesRegistry,
  FundsManager,
  PriceOracle,
} from "../typechain-types";

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
    `AddressesProvider deployed at: ${
      (addressesProvider as unknown as { address: string }).address
    }`
  );
  return addressesProvider;
};

const deployPriceOracle = async (): Promise<PriceOracle> => {
  const price = await ethers.getContractFactory("PriceOracle");
  const priceOracle = await price.deploy();
  await priceOracle.deployed();
  console.log(
    "PriceOracle deployed to:",
    (priceOracle as unknown as { address: string }).address
  );
  const emojiGenerator = getEmojiBatch();
  while (true) {
    const batch = emojiGenerator.next();
    if (batch.done) break;
    await priceOracle.setEmojis(batch.value);
  }
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

async function main() {
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
  const setAddressesRx = await setAddresses.wait();
  gasUsed = gasUsed.add(setAddressesRx.gasUsed);
  // setup emojis in price oracle and mint singles to auction house
  const emojiGenerator = getEmojiBatch();
  while (true) {
    const batch = emojiGenerator.next();
    if (batch.done) break;
    // price oracle
    const setTx = await price.setEmojis(batch.value);
    const setRx = await setTx.wait();
    gasUsed = gasUsed.add(setRx.gasUsed);
    // mint to auction house
    const mintTx = await registry.mintToAuctionHouse(
      batch.value.reduce((a, b) => a.concat([[b]]), [] as Array<Array<string>>)
    );
    const mintRx = await mintTx.wait();
    gasUsed = gasUsed.add(mintRx.gasUsed);
  }
  console.log(`GAS USED: ${gasUsed.toString()}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
