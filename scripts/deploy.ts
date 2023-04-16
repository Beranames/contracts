import { ethers } from "hardhat";
import { BeranamesRegistry, PriceOracle } from "../typechain-types";
import getEmojiBatch from "./emojis/getBatchEmojis";

async function main() {
    const price = await ethers.getContractFactory("PriceOracle");
    const priceOracle: ethers.Contract<PriceOracle> = await price.deploy();
    await priceOracle.deployed();
    console.log("priceOracle deployed to:", priceOracle.address);
    const emojiGenerator = getEmojiBatch();
    while (true) {
        const batch = emojiGenerator.next();
        if (!batch.done) {
            await priceOracle.setEmojis(batch.value);
        } else {
            console.log("done");
            break;
        }
    }
    // const fundsMangerFactory = await ethers.getContractFactory("FundsManager");
    // const fundsManager: ethers.Contract<FundsManager> = await fundsMangerFactory.deploy();
    const registryFactory = await ethers.getContractFactory("BeranamesRegistry");
    const registry: ethers.Contract<BeranamesRegistry> = await registryFactory.deploy(
        priceOracle.address,
        ethers.constants.AddressZero
    );
    await registry.deployed();
    console.log("registry deployed to:", registry.address);

    const isEmoji = await registry.isSingleEmoji("🐻");
    console.log("isSingleEmoji: 🐻", isEmoji);
    const isEmoji2 = await registry.isSingleEmoji("⛓️");
    console.log("isSingleEmoji: ⛓️", isEmoji2);
    // await Promise.all(
    //     emojisTest.map(async (seq) => {
    //         const voucherData1: BeranamesRegistry.MintVoucherStruct = {
    //             name: seq,
    //             duration: 365 * 24 * 3600,
    //             whois: registry.address,
    //             metadataURI: "https://s3.jksdfnkjsdnfkjsdfn.com",
    //             to: deployer.address,
    //             paymentAsset: ethers.constants.AddressZero,
    //             paymentAmount: ethers.constants.WeiPerEther,
    //         };
    //         const signedVoucher1 = await signMintVoucher(voucherData1, registry.address);
    //         const tx = await registry.mintWithTicket(voucherData1, signedVoucher1);
    //         await tx.wait();
    //     })
    // );
    // const voucherData1: BeranamesRegistry.MintVoucherStruct = {
    //     name: "🐻‍❄️👨‍👨‍👧‍👧",
    //     duration: 365 * 24 * 3600,
    //     whois: registry.address,
    //     metadataURI: "https://s3.jksdfnkjsdnfkjsdfn.com",
    //     to: deployer.address,
    //     paymentAsset: ethers.constants.AddressZero,
    //     paymentAmount: ethers.constants.WeiPerEther,
    // };
    // const signedVoucher1 = await signMintVoucher(voucherData1, registry.address);
    // // console.log("signedVoucher:", signedVoucher);
    // const tx = await registry.mint(voucherData1, signedVoucher1);
    // await tx.wait();
    // const voucherData2: BeranamesRegistry.MintVoucherStruct = {
    //     name: "🐻🪪 henlo",
    //     duration: 365 * 24 * 3600,
    //     whois: registry.address,
    //     metadataURI: "https://s3.jksdfnkjsdnfkjsdfn.com",
    //     to: deployer.address,
    //     paymentAsset: ethers.constants.AddressZero,
    //     paymentAmount: ethers.constants.WeiPerEther,
    // };
    // const signedVoucher2 = await signMintVoucher(voucherData2, registry.address);
    // // console.log("signedVoucher:", signedVoucher);
    // const tx2 = await registry.mint(voucherData2, signedVoucher2);
    // await tx2.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
