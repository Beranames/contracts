import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";

import deployAddressesProviderFixture from "./utils/deployAddressesProvider";
import deployAuctionHouseFixture from "./utils/deployAuctionHouse";
import deployFundsManager from "./utils/deployFundsManager";
import deployRegistryFixture from "./utils/deployRegistry";
import { defaultAbiCoder, keccak256 } from "ethers/lib/utils";

describe("AuctionHouse", function () {
  let _registry: any;
  let _auctionHouse: any;
  let _fundsManager: any;
  let _team: any;
  let _foundation: any;
  let _treasury: any;
  let _owner: SignerWithAddress;
  let acc1: SignerWithAddress;

  async function setupFixture() {
    const fixtureData = await deployAddressesProviderFixture();
    const { provider, owner, otherAccount } = fixtureData;
    const { auctionHouse } = await loadFixture(deployAuctionHouseFixture);
    const { manager } = await loadFixture(deployFundsManager);
    const { registry } = await loadFixture(deployRegistryFixture);
    await provider.multicall([
      provider.interface.encodeFunctionData("setRegistry", [registry.address]),
      provider.interface.encodeFunctionData("setAuctionHouse", [
        auctionHouse.address,
      ]),
      provider.interface.encodeFunctionData("setFundsManager", [
        manager.address,
      ]),
    ]);

    return {
      provider,
      owner,
      otherAccount,
      manager,
      registry,
      auctionHouse,
      team: fixtureData.addresses.team,
      foundation: fixtureData.addresses.foundation,
      treasury: fixtureData.addresses.treasury,
    };
  }

  beforeEach(async function () {
    const {
      owner,
      otherAccount,
      auctionHouse,
      registry,
      manager,
      team,
      foundation,
      treasury,
    } = await loadFixture(setupFixture);
    _owner = owner;
    acc1 = otherAccount;
    _auctionHouse = auctionHouse;
    _registry = registry;
    _fundsManager = manager;
    _team = team;
    _foundation = foundation;
    _treasury = treasury;

    await _registry.togglePause();
    await _registry.mintToAuctionHouse([["😀"]]);
  });

  async function getTimestamp() {
    const timestamp = await time.latest();
    return timestamp;
  }

  async function createAuction(
    tokenId?: bigint,
    start?: number,
    end?: number,
    startPrice?: number
  ) {
    await _auctionHouse.createAuction(
      tokenId ?? getTokenId(),
      start ?? 0,
      end ?? 9999999999,
      startPrice ?? 0
    );
  }

  function getTokenId(chars?: Array<string>) {
    return BigInt(
      keccak256(defaultAbiCoder.encode(["string[]"], [chars ?? ["😀"]]))
    );
  }

  describe("Deployment", function () {
    it("Should be deployed", async function () {
      expect(_auctionHouse.address).to.be.properAddress;
    });
  });

  describe("Updates", function () {
    describe("Validations", function () {
      it("Should revert if not called by the owner", async function () {
        await expect(
          _auctionHouse
            .connect(acc1)
            .createAuction(getTokenId(), 0, 9999999999, 0)
        ).to.be.revertedWith("Ownable: caller is not the owner");
        await expect(
          _auctionHouse.connect(acc1).transferUnclaimed(getTokenId())
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });
    describe("createAuction", function () {
      describe("Validations", function () {
        it("Should revert if input data is incorrect", async function () {
          await expect(
            createAuction(undefined, 0, 1000, 0)
          ).to.be.revertedWithCustomError(_auctionHouse, "Nope");

          await expect(
            createAuction(
              getTokenId(),
              await getTimestamp(),
              (await getTimestamp()) + 10,
              0
            )
          ).to.be.revertedWithCustomError(_auctionHouse, "Nope");
        });
        it("Should revert if contract is not the owner of token", async function () {
          //   await _registry.mintNative(
          //     ["b", "e", "r", "a"],
          //     1,
          //     _owner.address,
          //     "",
          //     _owner.address,
          //     {
          //       value: parseEther("169"),
          //     }
          //   );
          //   await expect(createAuction(getTokenId(["b", "e", "r", "a"]))).to.be
          //     .reverted;
        });
      });
      it("Should create auction", async function () {
        await createAuction();
        expect((await _auctionHouse.auctions(getTokenId())).start).to.eq(0);
        expect((await _auctionHouse.auctions(getTokenId())).end).to.eq(
          9999999999
        );
        expect((await _auctionHouse.auctions(getTokenId())).startPrice).to.eq(
          0
        );
      });
    });
    describe("placeBid", function () {
      it("Should place bid if input data is correct", async function () {
        const tokenId = getTokenId();

        await createAuction();
        await _auctionHouse.placeBid(tokenId, { value: 100 });
        let auction = await _auctionHouse.auctions(tokenId);

        expect(auction.highestBid.bidder).to.eq(_owner.address);
        expect(auction.highestBid.amount).to.eq(100);
      });
      it("Should revert is input is incorrect", async function () {
        const tokenId = getTokenId();
        const end = (await getTimestamp()) + 10;
        await createAuction(undefined, 0, end, 101);
        await expect(
          _auctionHouse.placeBid(tokenId, { value: 100 })
        ).to.be.revertedWithCustomError(_auctionHouse, "Nope");

        await time.setNextBlockTimestamp(end);
        await expect(
          _auctionHouse.placeBid(tokenId, { value: 200 })
        ).to.be.revertedWithCustomError(_auctionHouse, "Nope");
      });
      it("Should transfer money back to previous bidder", async function () {
        const tokenId = getTokenId();

        await createAuction();
        await _auctionHouse.placeBid(tokenId, { value: 100 });

        await expect(
          _auctionHouse.connect(acc1).placeBid(tokenId, { value: 200 })
        ).to.changeEtherBalances(
          [acc1, _auctionHouse, _owner],
          [-200, 100, 100]
        );
      });
      it("Should emit BidPlaced event", async function () {
        const tokenId = getTokenId();

        await createAuction();

        await expect(_auctionHouse.placeBid(tokenId, { value: 100 }))
          .to.emit(_auctionHouse, "BidPlaced")
          .withArgs(tokenId, _owner.address, 100);
      });
    });
    describe("claim", function () {
      describe("Validations", function () {
        it("Should revert if caller is not a highest bidder", async function () {
          await createAuction();
          await _auctionHouse.placeBid(getTokenId(), { value: 100 });

          await expect(
            _auctionHouse.connect(acc1).claim(getTokenId())
          ).to.be.revertedWithCustomError(_auctionHouse, "Nope");
        });
        it("Should revert if auction hasn't already finished", async function () {
          await createAuction();

          await expect(
            _auctionHouse.claim(getTokenId())
          ).to.be.revertedWithCustomError(_auctionHouse, "Nope");
        });
      });
      it("Should transfer token to highest bidder", async function () {
        await createAuction(
          undefined,
          undefined,
          (await getTimestamp()) + 10,
          undefined
        );
        await time.setNextBlockTimestamp((await getTimestamp()) + 5);
        await _auctionHouse.placeBid(getTokenId(), { value: 100 });
        await time.setNextBlockTimestamp((await getTimestamp()) + 11);

        await _auctionHouse.claim(getTokenId());
        expect(await _registry.balanceOf(_owner.address)).to.eq(1);
      });
      it("Should distribute money through funds manager", async function () {
        const ts = await getTimestamp();
        await createAuction(undefined, undefined, ts + 10, undefined);
        await time.setNextBlockTimestamp(ts + 5);
        await _auctionHouse.placeBid(getTokenId(), { value: 10_000 });
        await time.setNextBlockTimestamp(ts + 11);
        const highestBid = (await _auctionHouse.auctions(getTokenId()))
          .highestBid;

        await expect(_auctionHouse.claim(getTokenId())).to.changeEtherBalances(
          [_auctionHouse, _fundsManager, _team, _foundation, _treasury],
          [-highestBid.amount, 0, 0, 0, 10_000]
        );
      });
      it("Should emit Claimed event if success", async function () {
        const ts = await getTimestamp();
        await createAuction(undefined, undefined, ts + 10, undefined);
        await time.setNextBlockTimestamp(ts + 5);
        await _auctionHouse.placeBid(getTokenId(), { value: 100 });
        await time.setNextBlockTimestamp(ts + 11);

        await expect(_auctionHouse.claim(getTokenId()))
          .to.emit(_auctionHouse, "Claimed")
          .withArgs(getTokenId(), _owner.address);
      });
    });
    describe("transferUnclaimed", function () {
      describe("Validations", function () {
        it("Should revert if start of auction later than now", async function () {
          const ts = (await getTimestamp()) + 10;
          await createAuction(undefined, ts);
          await expect(
            _auctionHouse.transferUnclaimed(getTokenId())
          ).to.be.revertedWithCustomError(_auctionHouse, "Nope");
        });
        it("Should revert if auction has been already ended", async function () {
          const ts = (await getTimestamp()) + 10;
          await createAuction(undefined, undefined, ts);
          await time.setNextBlockTimestamp(ts + 10);
          await expect(
            _auctionHouse.transferUnclaimed(getTokenId())
          ).to.be.revertedWithCustomError(_auctionHouse, "Nope");
        });
        it("Should revert if auction highest bidder in zero address", async function () {
          const ts = (await getTimestamp()) + 10;
          await createAuction();
          await _auctionHouse.placeBid(getTokenId(), { value: 100 });
          await expect(
            _auctionHouse.transferUnclaimed(getTokenId())
          ).to.be.revertedWithCustomError(_auctionHouse, "Nope");
        });
      });
      it("Should successfully transfer token", async function () {
        await createAuction();
        await _auctionHouse.transferUnclaimed(getTokenId());

        expect(await _registry.balanceOf(_owner.address)).to.eq(1);
      });
    });
  });
});
