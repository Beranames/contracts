import { ethers } from "hardhat";
import { constants } from "ethers";
import getEmojiBatch from "./emojis/getBatchEmojis";
import { AddressesProvider, AuctionHouse, BeranamesRegistry, FundsManager, PriceOracle } from "../typechain-types";

const deployAddressesProvider = async (): Promise<AddressesProvider> => {
    const addressesProviderFactory = await ethers.getContractFactory("AddressesProvider");
    const addressesProvider = await addressesProviderFactory.deploy(
        constants.AddressZero, // registry
        constants.AddressZero, // priceOracle
        constants.AddressZero, // fundsManager
        constants.AddressZero, // auctionHouse
        constants.AddressZero, // validator
        constants.AddressZero, // team
        constants.AddressZero // foundation
    );
    await addressesProvider.deployed();
    console.log(`AddressesProvider deployed at: ${(addressesProvider as unknown as { address: string }).address}`);
    return addressesProvider;
};

const deployPriceOracle = async (): Promise<PriceOracle> => {
    const price = await ethers.getContractFactory("PriceOracle");
    const priceOracle = await price.deploy();
    await priceOracle.deployed();
    console.log("PriceOracle deployed to:", (priceOracle as unknown as { address: string }).address);
    const emojiGenerator = getEmojiBatch();
    while (true) {
        const batch = emojiGenerator.next();
        if (batch.done) break;
        await priceOracle.setEmojis(batch.value);
    }
    return priceOracle;
};

const deployAuctionhouse = async (addressesProviderAddress: string): Promise<AuctionHouse> => {
    const auctionhouseFactory = await ethers.getContractFactory("AuctionHouse");
    const auctionhouse = await auctionhouseFactory.deploy(addressesProviderAddress);
    await auctionhouse.deployed();
    console.log("AuctionHouse deployed to:", (auctionhouse as unknown as { address: string }).address);
    return auctionhouse;
};

const deployFundsManager = async (addressesProvider: string): Promise<FundsManager> => {
    const fundsMangerFactory = await ethers.getContractFactory("FundsManager");
    const fundsManager = await fundsMangerFactory.deploy(addressesProvider);
    await fundsManager.deployed();
    console.log("FundsManager deployed to:", (fundsManager as unknown as { address: string }).address);
    return fundsManager;
};

const deployRegistry = async (addressesProvider: string): Promise<BeranamesRegistry> => {
    const registryFactory = await ethers.getContractFactory("BeranamesRegistry");
    const registry = await registryFactory.deploy(addressesProvider);
    await registry.deployed();
    console.log("Registry deployed to:", (registry as unknown as { address: string }).address);
    return registry;
};

async function main() {
    const addressesProvider = await deployAddressesProvider();
    const price = await deployPriceOracle();
    const auctionHouse = await deployAuctionhouse(addressesProvider.address);
    const fundsManager = await deployFundsManager(addressesProvider.address);
    const registry = await deployRegistry(addressesProvider.address);
    const setAddresses = await addressesProvider.multicall([
        addressesProvider.interface.encodeFunctionData("setPriceOracle", [price.address]),
        addressesProvider.interface.encodeFunctionData("setAuctionHouse", [auctionHouse.address]),
        addressesProvider.interface.encodeFunctionData("setFundsManager", [fundsManager.address]),
        addressesProvider.interface.encodeFunctionData("setRegistry", [registry.address]),
    ]);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
