import { ethers } from "hardhat";
import deployAddressesProviderFixture from "./deployAddressesProvider";

async function deployAuctionHouseFixture(
    registry?: string,
) {
    const { provider } = await deployAddressesProviderFixture(registry);
    const [owner, otherAccount] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("AuctionHouse");
    const auctionHouse = await factory.deploy(provider.address);

    return { provider, auctionHouse, owner, otherAccount };
}

export default deployAuctionHouseFixture;
