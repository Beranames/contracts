import { ethers } from "hardhat";
import deployAddressesProviderFixture from "./deployAddressesProvider";

async function deplosyRegistryFixture() {
    const { provider } = await deployAddressesProviderFixture();
    const [owner, otherAccount] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("BeranamesRegistry");
    const registry = await factory.deploy(provider.address);

    return { provider, registry, owner, otherAccount };
}

export default deplosyRegistryFixture;
