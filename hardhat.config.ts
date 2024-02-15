import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.22",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    // hardhat: {
    //   forking: {
    //     url: "https://faucet.0xhoneyjar.xyz/rpc",
    //     blockNumber: 112288,
    //   },
    //   chainId: 80085,
    // accounts: [process.env.PRIVATE_KEY || ""],
    // },
    artio_testnet: {
      url: "https://artio.rpc.berachain.com",
      chainId: 80085,
      accounts: [process.env.PRIVATE_KEY || ""],
    },
  },
  etherscan: {
    apiKey: {
      artio_testnet: "artio_testnet", // apiKey is not required, just set a placeholder
    },
    customChains: [
      {
        network: "artio_testnet",
        chainId: 80085,
        urls: {
          apiURL:
            "https://api.routescan.io/v2/network/testnet/evm/80085/etherscan",
          browserURL: "https://artio.beratrail.io",
        },
      },
    ],
  },
};

export default config;
