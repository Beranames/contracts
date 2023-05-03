import { ethers } from "hardhat";
import { AddressesProvider } from "../../typechain-types";

const addresses = {
    registry: "0x0000000000000000000000000000000000000001",
    oracle: "0x0000000000000000000000000000000000000002",
    fundsManager: "0x0000000000000000000000000000000000000003",
    auctionHouse: "0x0000000000000000000000000000000000000004",
    validator: "0x0000000000000000000000000000000000000005",
    team: "0x0000000000000000000000000000000000000006",
    foundation: "0x0000000000000000000000000000000000000007",
};

async function* deploy(): AsyncGenerator<AddressesProvider, AddressesProvider, AddressesProvider> {
    // Contracts are deployed using the first signer/account by default
    let provider;
    const factory = await ethers.getContractFactory("AddressesProvider");
    while (true) {
        if (!provider) {
            provider = await factory.deploy(
                addresses.registry,
                addresses.oracle,
                addresses.fundsManager,
                addresses.auctionHouse,
                addresses.validator,
                addresses.team,
                addresses.foundation
            );
        }
        yield provider;
    }
}
const deployer = deploy();

async function deployAddressesProviderFixture() {
    const [owner, otherAccount] = await ethers.getSigners();
    let provider = (await deployer.next()).value;
    return { addresses, provider, owner, otherAccount };
}

export default deployAddressesProviderFixture;
