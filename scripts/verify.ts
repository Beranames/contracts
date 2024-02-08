import { getContractFactory } from "@nomiclabs/hardhat-ethers/types";
import { AbiCoder, defaultAbiCoder } from "ethers/lib/utils";
import hre from "hardhat";
import { constants } from "ethers";

const verifyContracts = async () => {
  // verify AddressesProvider
  await hre.run("verify:verify", {
    address: "0x089290B77b42CFc52122B9Bc2937BDF49bf61b43",
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
    address: "0x64F412f821086253204645174c456b7532BA4527",
    constructorArguments: [],
  });
  // verify AuctionHouse
  await hre.run("verify:verify", {
    address: "0x467b99e285ee5422eD456F7B26F6F28e0a4372e1",
    constructorArguments: ["0x089290B77b42CFc52122B9Bc2937BDF49bf61b43"],
  });
  // verify FundsManager
  await hre.run("verify:verify", {
    address: "0xF38340147C6c4C7Af9aC167630200ab964A5a9dA",
    constructorArguments: ["0x089290B77b42CFc52122B9Bc2937BDF49bf61b43"],
  });
  // verify BeranamesRegistry
  await hre.run("verify:verify", {
    address: "0xA7B6A8616ed917637356c1C8ef984E663f74737f",
    constructorArguments: ["0x089290B77b42CFc52122B9Bc2937BDF49bf61b43"],
  });
};

verifyContracts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
