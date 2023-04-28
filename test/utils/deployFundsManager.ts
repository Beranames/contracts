import { ethers } from "hardhat";
import deployAddressesProviderFixture from "./deployAddressesProvider";

async function deployFundsManager() {
    const { provider } = await deployAddressesProviderFixture();
    const [owner, otherAccount] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("FundsManager");
    const manager = await factory.deploy(provider.address);

    return { provider, manager, owner, otherAccount };
}

export default deployFundsManager;
