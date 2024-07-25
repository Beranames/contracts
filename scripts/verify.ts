import { getContractFactory } from "@nomiclabs/hardhat-ethers/types";
import { AbiCoder, defaultAbiCoder } from "ethers/lib/utils";
import hre from "hardhat";
import { constants } from "ethers";

const ADDRESSES_PROVIDER_ADDRESS = '0x75B66beE0e22bA5B9a381a988c5567bAfEC2A37b';
const PRICE_ORACLE_ADDRESS = '0x8EFA8b8Af06A7183134AD8C66Fc2B0D7C1fe6B41';
const AUCTION_HOUSE_ADDRESS = '0x6E4Bd3cEb3F74b0e75Fa9a4B6aF46bF90327b8A2';
const FUNDS_MANAGER_ADDRESS = '0xf8FC1Af1F1C70Eff84cB1076FF0B079282F767dd';
const REGISTRY_ADDRESS = '0x85998BdFa1A1b49044C1780B543Bc42190B0cC4c';

const verifyContracts = async () => {
  // verify AddressesProvider
  await hre.run("verify:verify", {
    address: ADDRESSES_PROVIDER_ADDRESS,
    constructorArguments: [
      constants.AddressZero, // registry
      constants.AddressZero, // priceOracle
      constants.AddressZero, // fundsManager
      constants.AddressZero, // auctionHouse
      constants.AddressZero, // team
      constants.AddressZero, // foundation
      constants.AddressZero, // treasury
    ],
  });
  // verify PriceOracle
  await hre.run("verify:verify", {
    address: PRICE_ORACLE_ADDRESS,
    constructorArguments: [],
  });
  // verify AuctionHouse
  await hre.run("verify:verify", {
    address: AUCTION_HOUSE_ADDRESS,
    constructorArguments: [ADDRESSES_PROVIDER_ADDRESS],
  });
  // verify FundsManager
  await hre.run("verify:verify", {
    address: FUNDS_MANAGER_ADDRESS,
    constructorArguments: [ADDRESSES_PROVIDER_ADDRESS],
  });
  // verify BeranamesRegistry
  await hre.run("verify:verify", {
    address: REGISTRY_ADDRESS,
    constructorArguments: [ADDRESSES_PROVIDER_ADDRESS],
  });
};

verifyContracts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
