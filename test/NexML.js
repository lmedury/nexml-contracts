const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NexMLMarketplace", function () {
  async function deployNexMLFixture() {
    // Deploy the contract
    const [owner, user1, user2] = await ethers.getSigners();
    const NexMLMarketplace =
      await ethers.getContractFactory("NexMLMarketplace");
    const marketplace = await NexMLMarketplace.deploy();

    return { marketplace, owner, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should deploy the contract", async function () {
      const { marketplace } = await deployNexMLFixture();
      expect(marketplace.address).to.not.be.null;
    });
  });

  describe("uploadModel", function () {
    it("Should upload a model successfully", async function () {
      const ipfsHash = "QmTestHash123";
      const forRent = true;
      const forSale = false;
      const rentPrice = 1;
      const salePrice = 0;

      const { marketplace, owner } = await deployNexMLFixture();
      const tx = await marketplace.uploadModel(
        ipfsHash,
        forRent,
        forSale,
        rentPrice,
        salePrice,
      );
      await expect(tx).to.not.be.reverted;
    });

    it("Should revert if IPFS hash is empty", async function () {
      const { marketplace } = await deployNexMLFixture();
      await expect(
        marketplace.uploadModel("", true, false, 1, 0),
      ).to.be.revertedWith("IPFS hash is required");
    });

    it("Should revert if forSale is true and salePrice is zero", async function () {
      const { marketplace } = await deployNexMLFixture();
      await expect(
        marketplace.uploadModel("QmTestHash123", false, true, 0, 0),
      ).to.be.revertedWith("Sale price is required");
    });

    it("Should revert if forRent is true and rentPrize is zero", async function () {
      const { marketplace } = await deployNexMLFixture();
      await expect(
        marketplace.uploadModel("QmTestHash123", true, false, 0, 0),
      ).to.be.revertedWith("Rent price is required");
    });

    it("Should work if forRent is true and rentPrice is non-zero", async function () {
      const { marketplace } = await deployNexMLFixture();

      const tx = marketplace.uploadModel("QmTestHash123", true, false, 1, 0);
      await expect(tx).to.not.be.reverted;
    });

    it("Should work if forSale is true and salePrice is non-zero", async function () {
      const { marketplace } = await deployNexMLFixture();

      const tx = marketplace.uploadModel("QmTestHash123", false, true, 0, 1);
      await expect(tx).to.not.be.reverted;
    });

    it("Should emit model uploaded event when uploaded", async function () {
      const ipfsHash = "QmTestHash123";
      const forRent = true;
      const forSale = false;
      const rentPrice = 1;
      const salePrice = 0;

      const { marketplace, owner } = await deployNexMLFixture();
      const tx = await marketplace.uploadModel(
        ipfsHash,
        forRent,
        forSale,
        rentPrice,
        salePrice,
      );
      const receipt = await tx.wait();
      const logs = receipt.logs[0].args;

      const modelId = logs[0];
      expect(modelId).to.not.be.null;
      const model = await marketplace.models(modelId);
      expect(model.ipfsHash).to.equal(ipfsHash);
      expect(model.owner).to.equal(owner.address);
      expect(model.forRent).to.equal(forRent);
      expect(model.forSale).to.equal(forSale);
      expect(model.rentPrice).to.equal(rentPrice);
      expect(model.salePrice).to.equal(salePrice);
    });

    it("Should add model ID to the user's list", async function () {
      const ipfsHash = "QmTestHash123";
      const forRent = true;
      const forSale = false;
      const rentPrice = 1;
      const salePrice = 0;

      const { marketplace, owner } = await deployNexMLFixture();
      const tx = await marketplace.uploadModel(
        ipfsHash,
        forRent,
        forSale,
        rentPrice,
        salePrice,
      );
      const receipt = await tx.wait();
      const modelId = receipt.logs[0].args[0];
      //console.log(await marketplace.modelsByUser(owner.address, 0));
      const userModels = await marketplace.modelsByUser(owner.address, 0);
      expect(userModels).to.equal(modelId);
    });

    it("Should allow multiple models to be uploaded by the same user", async function () {
      const ipfsHash1 = "QmTestHash123";
      const ipfsHash2 = "QmTestHash456";

      const { marketplace, owner } = await deployNexMLFixture();
      await marketplace.uploadModel(ipfsHash1, true, false, 1, 0);
      await marketplace.uploadModel(ipfsHash2, false, true, 0, 2);

      const userModel1 = await marketplace.modelsByUser(owner.address, 0);
      const userModel2 = await marketplace.modelsByUser(owner.address, 1);
      expect(userModel1).to.not.be.null;
      expect(userModel2).to.not.be.null;
    });
  });
});
