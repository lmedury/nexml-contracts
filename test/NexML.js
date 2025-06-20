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

  describe("updateModelState", function () {
    it("Should allow the model owner to update the model state", async function () {
      const { marketplace, user1 } = await deployNexMLFixture();


      // User1 uploads a model
      const ipfsHash = "QmTestHash";
      const forRent = true;
      const forSale = true;
      const rentPrice = 1;
      const salePrice = 1;


      const tx = await marketplace
        .connect(user1)
        .uploadModel(ipfsHash, forRent, forSale, rentPrice, salePrice);


      const receipt = await tx.wait();
      const modelId = receipt.logs[0].args[0];


      // User1 updates the model state
      const newIpfsHash = "QmUpdatedHash";
      const newForRent = false;
      const newForSale = true;
      const newRentPrice = 2;
      const newSalePrice = 2;


      await marketplace
        .connect(user1)
        .updateModelState(modelId, newIpfsHash, newForRent, newForSale, newRentPrice, newSalePrice);


      // Fetch the updated model
      const model = await marketplace.getModel(modelId);


      // Verify the updated state
      expect(model.ipfsHash).to.equal(newIpfsHash);
      expect(model.forRent).to.equal(newForRent);
      expect(model.forSale).to.equal(newForSale);
      expect(model.rentPrice).to.equal(newRentPrice);
      expect(model.salePrice).to.equal(newSalePrice);
    });


    it("Should revert if a non-owner tries to update the model state", async function () {
      const { marketplace, user1, user2 } = await deployNexMLFixture();


      // User1 uploads a model
      const ipfsHash = "QmTestHash";
      const forRent = true;
      const forSale = true;
      const rentPrice = 1;
      const salePrice = 1;


      const tx = await marketplace
        .connect(user1)
        .uploadModel(ipfsHash, forRent, forSale, rentPrice, salePrice);


      const receipt = await tx.wait();
      const modelId = receipt.logs[0].args[0];
      //console.log("Model ID:", modelId);

      // User2 tries to update the model state
      const newIpfsHash = "QmUpdatedHash";
      const newForRent = false;
      const newForSale = true;
      const newRentPrice = 2;
      const newSalePrice = 2;


      await expect(
        marketplace
          .connect(user2)
          .updateModelState(modelId, newIpfsHash, newForRent, newForSale, newRentPrice, newSalePrice)
      ).to.be.revertedWith("Sender is not the model owner");
    });


    it("Should revert if the model does not exist", async function () {
      const { marketplace, user1 } = await deployNexMLFixture();


      // Generate a random modelId
      const fakeModelId = "0x2a81a3637e7cef75d250e8833c5f3ffabef50f97757fa5eadeb8b1eed11ce2fb";


      // Try to update a non-existent model
      const newIpfsHash = "QmUpdatedHash";
      const newForRent = false;
      const newForSale = true;
      const newRentPrice = 2;
      const newSalePrice = 2;


      await expect(
        marketplace
          .connect(user1)
          .updateModelState(fakeModelId, newIpfsHash, newForRent, newForSale, newRentPrice, newSalePrice)
      ).to.be.revertedWith("Model does not exist");
    });
  });

  describe("purchaseModel", function () {
    it("Should allow a user to purchase a model", async function () {
      const { marketplace, user1, user2 } = await deployNexMLFixture();


      // User1 uploads a model
      const ipfsHash = "QmTestHash";
      const forRent = false;
      const forSale = true;
      const rentPrice = 100; // Using integer prices
      const salePrice = 1000; // Using integer prices


      const tx = await marketplace
        .connect(user1)
        .uploadModel(ipfsHash, forRent, forSale, rentPrice, salePrice);


      const receipt = await tx.wait();
      const modelId = receipt.logs[0].args[0];


      // User2 purchases the model
      await expect(
        marketplace.connect(user2).purchaseModel(modelId, { value: salePrice })
      )
        .to.emit(marketplace, "ModelPurchased")
        .withArgs(modelId, user2.address, salePrice);


      // Verify ownership transfer
      const model = await marketplace.getModel(modelId);
      expect(model.owner).to.equal(user2.address);
    });


    it("Should revert if the price sent is incorrect", async function () {
      const { marketplace, user1, user2 } = await deployNexMLFixture();


      // User1 uploads a model
      const ipfsHash = "QmTestHash";
      const forRent = false;
      const forSale = true;
      const rentPrice = 100; // Using integer prices
      const salePrice = 1000; // Using integer prices


      const tx = await marketplace
        .connect(user1)
        .uploadModel(ipfsHash, forRent, forSale, rentPrice, salePrice);


      const receipt = await tx.wait();
      const modelId = receipt.logs[0].args[0];


      // User2 tries to purchase the model with the wrong price
      await expect(
        marketplace.connect(user2).purchaseModel(modelId, { value: 500 }) // Incorrect price
      ).to.be.revertedWith("Incorrect price sent");
    });


    it("Should revert if the model is not for sale", async function () {
      const { marketplace, user1, user2 } = await deployNexMLFixture();


      // User1 uploads a model
      const ipfsHash = "QmTestHash";
      const forRent = true;
      const forSale = false;
      const rentPrice = 100; // Using integer prices
      const salePrice = 1000; // Using integer prices


      const tx = await marketplace
        .connect(user1)
        .uploadModel(ipfsHash, forRent, forSale, rentPrice, salePrice);


      const receipt = await tx.wait();
      const modelId = receipt.logs[0].args[0];


      // User2 tries to purchase the model
      await expect(
        marketplace.connect(user2).purchaseModel(modelId, { value: salePrice })
      ).to.be.revertedWith("Model is not for sale");
    });


    it("Should revert if the owner tries to purchase their own model", async function () {
      const { marketplace, user1 } = await deployNexMLFixture();


      // User1 uploads a model
      const ipfsHash = "QmTestHash";
      const forRent = false;
      const forSale = true;
      const rentPrice = 100; // Using integer prices
      const salePrice = 1000; // Using integer prices


      const tx = await marketplace
        .connect(user1)
        .uploadModel(ipfsHash, forRent, forSale, rentPrice, salePrice);


      const receipt = await tx.wait();
      const modelId = receipt.logs[0].args[0];


      // User1 tries to purchase their own model
      await expect(
        marketplace.connect(user1).purchaseModel(modelId, { value: salePrice })
      ).to.be.revertedWith("Owner cannot purchase their own model");
    });


    it("Should revert if the model does not exist", async function () {
      const { marketplace, user2 } = await deployNexMLFixture();


      // Generate a random modelId
      const fakeModelId = "0x2a81a3637e7cef75d250e8833c5f3ffabef50f97757fa5eadeb8b1eed11ce2fb";


      // User2 tries to purchase a non-existent model
      await expect(
        marketplace.connect(user2).purchaseModel(fakeModelId, { value: 1000 }) // Any value
      ).to.be.revertedWith("Model does not exist");
    });
  });

  describe("rentModel", function () {
    it("Should allow a user to rent a model successfully", async function () {
      const { marketplace, user1, user2 } = await deployNexMLFixture();


      // User1 uploads a model
      const ipfsHash = "QmTestHash";
      const forRent = true;
      const forSale = false;
      const rentPrice = 100; // Integer price
      const salePrice = 0;


      const tx = await marketplace
        .connect(user1)
        .uploadModel(ipfsHash, forRent, forSale, rentPrice, salePrice);


      const receipt = await tx.wait();
      const modelId = receipt.logs[0].args[0];


      // User2 rents the model
      await expect(
        marketplace.connect(user2).rentModel(modelId, { value: rentPrice })
      )
        .to.emit(marketplace, "ModelRented")
        .withArgs(modelId, user2.address, rentPrice);


      // Verify that the model is added to the rented list
      const rentedModels = await marketplace.modelsRented(modelId, 0);
      expect(rentedModels).to.include(user2.address);
    });


    it("Should revert if the price sent is incorrect", async function () {
      const { marketplace, user1, user2 } = await deployNexMLFixture();


      // User1 uploads a model
      const ipfsHash = "QmTestHash";
      const forRent = true;
      const forSale = false;
      const rentPrice = 100; // Integer price
      const salePrice = 0;


      const tx = await marketplace
        .connect(user1)
        .uploadModel(ipfsHash, forRent, forSale, rentPrice, salePrice);


      const receipt = await tx.wait();
      const modelId = receipt.logs[0].args[0];


      // User2 tries to rent the model with the wrong price
      await expect(
        marketplace.connect(user2).rentModel(modelId, { value: 50 }) // Incorrect price
      ).to.be.revertedWith("Incorrect price sent");
    });


    it("Should revert if the model is not for rent", async function () {
      const { marketplace, user1, user2 } = await deployNexMLFixture();


      // User1 uploads a model
      const ipfsHash = "QmTestHash";
      const forRent = false; // Not for rent
      const forSale = true;
      const rentPrice = 100; // Integer price
      const salePrice = 1000;


      const tx = await marketplace
        .connect(user1)
        .uploadModel(ipfsHash, forRent, forSale, rentPrice, salePrice);


      const receipt = await tx.wait();
      const modelId = receipt.logs[0].args[0];


      // User2 tries to rent the model
      await expect(
        marketplace.connect(user2).rentModel(modelId, { value: rentPrice })
      ).to.be.revertedWith("Model is not for renting");
    });


    it("Should revert if the owner tries to rent their own model", async function () {
      const { marketplace, user1 } = await deployNexMLFixture();


      // User1 uploads a model
      const ipfsHash = "QmTestHash";
      const forRent = true;
      const forSale = false;
      const rentPrice = 100; // Integer price
      const salePrice = 0;


      const tx = await marketplace
        .connect(user1)
        .uploadModel(ipfsHash, forRent, forSale, rentPrice, salePrice);


      const receipt = await tx.wait();
      const modelId = receipt.logs[0].args[0];


      // User1 tries to rent their own model
      await expect(
        marketplace.connect(user1).rentModel(modelId, { value: rentPrice })
      ).to.be.revertedWith("Owner cannot purchase their own model");
    });


    it("Should revert if the model does not exist", async function () {
      const { marketplace, user2 } = await deployNexMLFixture();


      // Generate a random modelId
      const fakeModelId = "0x2a81a3637e7cef75d250e8833c5f3ffabef50f97757fa5eadeb8b1eed11ce2fb";


      // User2 tries to rent a non-existent model
      await expect(
        marketplace.connect(user2).rentModel(fakeModelId, { value: 100 }) // Any value
      ).to.be.revertedWith("Model does not exist");
    });
  });

  describe("rateModel", function () {
    it("Should allow a user to rate a model successfully", async function () {
      const { marketplace, user1, user2 } = await deployNexMLFixture();


      // User1 uploads a model
      const ipfsHash = "QmTestHash";
      const forRent = true;
      const forSale = false;
      const rentPrice = 100; // Integer price
      const salePrice = 200; // Integer price


      const tx = await marketplace
        .connect(user1)
        .uploadModel(ipfsHash, forRent, forSale, rentPrice, salePrice);


      const receipt = await tx.wait();
      const modelId = receipt.logs[0].args[0];


      // User2 rates the model
      const rating = 5;
      const comment = "Great model!";
      await expect(
        marketplace.connect(user2).rateModel(modelId, rating, comment)
      )
        .to.emit(marketplace, "ModelRated")
        .withArgs(modelId, user2.address, rating, comment);
    });


    it("Should revert if the user tries to rate the same model twice", async function () {
      const { marketplace, user1, user2 } = await deployNexMLFixture();


      // User1 uploads a model
      const ipfsHash = "QmTestHash";
      const forRent = true;
      const forSale = false;
      const rentPrice = 100; // Integer price
      const salePrice = 200; // Integer price


      const tx = await marketplace
        .connect(user1)
        .uploadModel(ipfsHash, forRent, forSale, rentPrice, salePrice);


      const receipt = await tx.wait();
      const modelId = receipt.logs[0].args[0];


      // User2 rates the model
      const rating = 5;
      const comment = "Great model!";
      await marketplace.connect(user2).rateModel(modelId, rating, comment);


      // User2 tries to rate the same model again
      await expect(
        marketplace.connect(user2).rateModel(modelId, rating, comment)
      ).to.be.revertedWith("You have already reviewed this model");
    });


    it("Should allow multiple users to rate the same model", async function () {
      const { marketplace, user1, user2, owner } = await deployNexMLFixture();


      // User1 uploads a model
      const ipfsHash = "QmTestHash";
      const forRent = true;
      const forSale = false;
      const rentPrice = 100; // Integer price
      const salePrice = 200; // Integer price


      const tx = await marketplace
        .connect(user1)
        .uploadModel(ipfsHash, forRent, forSale, rentPrice, salePrice);


      const receipt = await tx.wait();
      const modelId = receipt.logs[0].args[0];


      // User2 rates the model
      const rating1 = 4;
      const comment1 = "Good model!";
      await marketplace.connect(user2).rateModel(modelId, rating1, comment1);


      // Owner rates the model
      const rating2 = 5;
      const comment2 = "Excellent model!";
      const tx2 = await marketplace.connect(owner).rateModel(modelId, rating2, comment2);
      await expect(tx2)
        .to.emit(marketplace, "ModelRated")
        .withArgs(modelId, owner.address, rating2, comment2);

    });


    it("Should revert if the rating is out of bounds", async function () {
      const { marketplace, user1, user2 } = await deployNexMLFixture();


      // User1 uploads a model
      const ipfsHash = "QmTestHash";
      const forRent = true;
      const forSale = false;
      const rentPrice = 100; // Integer price
      const salePrice = 200; // Integer price


      const tx = await marketplace
        .connect(user1)
        .uploadModel(ipfsHash, forRent, forSale, rentPrice, salePrice);


      const receipt = await tx.wait();
      const modelId = receipt.logs[0].args[0];


      // User2 tries to rate the model with an invalid rating
      await expect(
        marketplace.connect(user2).rateModel(modelId, 6, "Invalid rating")
      ).to.be.revertedWith("Rating must be between 1 and 5");


      await expect(
        marketplace.connect(user2).rateModel(modelId, 0, "Invalid rating")
      ).to.be.revertedWith("Rating must be between 1 and 5");
    });


    it("Should revert if the model does not exist", async function () {
      const { marketplace, user2 } = await deployNexMLFixture();


      const fakeModelId = "0x2a81a3637e7cef75d250e8833c5f3ffabef50f97757fa5eadeb8b1eed11ce2fb";


      // User2 tries to rate a non-existent model
      await expect(
        marketplace.connect(user2).rateModel(fakeModelId, 5, "Non-existent model")
      ).to.be.revertedWith("Model does not exist");
    });
  });
  
  describe("setDID", function () {
    it("Should allow a user to set their DID", async function () {
      const { marketplace, user1 } = await deployNexMLFixture();


      const did = "did:example:123456789";
      await marketplace.connect(user1).setDID(did);


      const userProfile = await marketplace.getUserProfile(user1.address);
      expect(userProfile.did).to.equal(did);
    });


    it("Should revert if the DID is empty", async function () {
      const { marketplace, user1 } = await deployNexMLFixture();


      await expect(
        marketplace.connect(user1).setDID("")
      ).to.be.revertedWith("DID is required");
    });


    it("Should allow updating the DID", async function () {
      const { marketplace, user1 } = await deployNexMLFixture();


      const did1 = "did:example:123456789";
      const did2 = "did:example:987654321";


      // Set the first DID
      await marketplace.connect(user1).setDID(did1);
      let userProfile = await marketplace.getUserProfile(user1.address);
      expect(userProfile.did).to.equal(did1);


      // Update to the second DID
      await marketplace.connect(user1).setDID(did2);
      userProfile = await marketplace.getUserProfile(user1.address);
      expect(userProfile.did).to.equal(did2);
    });
  });

});
