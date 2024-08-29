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
    // hardhat local node
    hardhat: {
      chainId: 1337,
    },
    bartio_testnet: {
      url: "https://bartio.rpc.berachain.com/",
      chainId: 80084,
      accounts: [process.env.PRIVATE_KEY || ""],
    }
  },
  etherscan: {
    apiKey: {
      bartio_testnet: "bartio_testnet", // apiKey is not required, just set a placeholder
    },
    customChains: [
      {
        network: "bartio_testnet",
        chainId: 80084,
        urls: {
          apiURL:
            "https://api.routescan.io/v2/network/testnet/evm/80084/etherscan",
          browserURL: "https://bartio.beratrail.io",
        },
      },
    ],
  },
};

export default config;
