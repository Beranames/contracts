import { ethers } from "hardhat";

const globalProvider = null;

async function deployAddressesProviderFixture() {
    const addresses = {
        registry: "0x0000000000000000000000000000000000000001",
        oracle: "0x0000000000000000000000000000000000000002",
        fundsManager: "0x0000000000000000000000000000000000000003",
        auctionHouse: "0x0000000000000000000000000000000000000004",
        validator: "0x0000000000000000000000000000000000000005",
        team: "0x0000000000000000000000000000000000000006",
        foundation: "0x0000000000000000000000000000000000000007",
    };
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();
    let provider;
    if (!globalProvider) {
        const factory = await ethers.getContractFactory("AddressesProvider");
        provider = await factory.deploy(
            addresses.registry,
            addresses.oracle,
            addresses.fundsManager,
            addresses.auctionHouse,
            addresses.validator,
            addresses.team,
            addresses.foundation
        );
    } else {
        provider = globalProvider;
    }
    return { addresses, provider, owner, otherAccount };
}

export default deployAddressesProviderFixture;
