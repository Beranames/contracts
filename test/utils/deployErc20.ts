import { ethers } from "hardhat";

async function deployERC20() {
    const [owner, otherAccount] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("TestErc20");
    const erc20 = await factory.deploy(
        "Beratoken", 
        "BRT",
        BigInt("90000000000000000000"),
        owner.address
        );

    return { erc20, owner, otherAccount };
}

export default deployERC20;
