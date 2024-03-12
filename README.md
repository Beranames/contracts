# Beranames 🐻🪪

Beranames is the Name Service for Berachain.

## Addresses

### Used for Galxe campaign

| Contract          | Address                                    |
| ----------------- | ------------------------------------------ |
| AddressesProvider | 0x089290B77b42CFc52122B9Bc2937BDF49bf61b43 |
| Registry          | 0x8D20B92B4163140F413AA52A4106fF9490bf2122 |
| AuctionHouse      | 0x467b99e285ee5422eD456F7B26F6F28e0a4372e1 |
| PriceOracle       | 0x64F412f821086253204645174c456b7532BA4527 |
| MockAggregatorV3  | 0x0805d57D722B4B6d1682cB0Ceef27840F02F2dEc |
| FundsManager      | 0xF38340147C6c4C7Af9aC167630200ab964A5a9dA |

### New Contracts to test integrations against

| Contract          | Address                                    |
| ----------------- | ------------------------------------------ |
| AddressesProvider | 0x089290B77b42CFc52122B9Bc2937BDF49bf61b43 |
| Registry          | 0x8D20B92B4163140F413AA52A4106fF9490bf2122 |
| AuctionHouse      | 0x467b99e285ee5422eD456F7B26F6F28e0a4372e1 |
| PriceOracle       | 0x64F412f821086253204645174c456b7532BA4527 |
| MockAggregatorV3  | 0x0805d57D722B4B6d1682cB0Ceef27840F02F2dEc |
| FundsManager      | 0xF38340147C6c4C7Af9aC167630200ab964A5a9dA |

## How to lookup names aliasing to an address

```ts
import { readContract } from "@wagmi/core";

import registryABI from "path/to/abi";
import config from "path/to/config";

const names = (await readContract(config, {
  address: "0xRegitryAddress",
  functionName: "reverseLookup",
  args: ["0xConnectedAccount"],
})) as Array<Array<string>>;

// names = [["o", "o", "g", "a", "🦆", "🐷"]]
```
