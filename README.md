# NexMLMarketplace

## Overview
The **NexMLMarketplace** smart contract is designed to facilitate the buying, renting, and reviewing of machine learning models on the Ethereum blockchain. It leverages the OpenZeppelin library for access control and security features, ensuring a robust and secure marketplace environment.

## Key Features
- **Model Uploading**: Users can upload machine learning models with associated metadata, including IPFS hashes for storage.
- **Model Purchasing**: Users can purchase models listed for sale, transferring ownership and funds securely.
- **Model Renting**: Users can rent models for a specified price, allowing temporary access to the models.
- **Model Rating**: Users can rate models and leave comments, contributing to the model's reputation.
- **User Profiles**: Users can set a Decentralized Identifier (DID) and maintain a reputation score based on their interactions.

## Contract Structure

### Events
The contract emits several events to log important actions:
- `ModelUploaded`: Triggered when a new model is uploaded.
- `ModelPurchased`: Triggered when a model is purchased.
- `ModelRented`: Triggered when a model is rented.
- `ModelRated`: Triggered when a model is rated.

### Structs
- **Model**: Represents a machine learning model with properties such as owner, IPFS hash, sale/rent status, prices, and ratings.
- **Review**: Contains details about a review, including the reviewer's address, rating, and comment.
- **User**: Represents a user with a DID, their reviews, and a reputation score.

### Storage
The contract maintains several mappings for efficient data management:
- `models`: Maps model IDs to their respective Model structs.
- `modelReviews`: Stores reviews for each model.
- `users`: Maps user addresses to their respective User structs.
- `modelsByUser`: Tracks models uploaded by each user.
- `modelsRented`: Keeps track of users who have rented each model.
- `hasReviewed`: Tracks whether a user has reviewed a specific model.

### Modifiers
- `modelExists`: Ensures that a model ID exists in the marketplace.
- `isModelOwner`: Checks if the caller is the owner of the specified model.

## Functions

### Model Management
- **uploadModel**: Allows users to upload a new model, specifying its IPFS hash, rental and sale status, and prices.
- **updateModelState**: Enables model owners to update the details of their models.

### Transactions
- **purchaseModel**: Facilitates the purchase of a model, transferring ownership and funds.
- **rentModel**: Allows users to rent a model, transferring the rental fee to the owner.

### Reviews
- **rateModel**: Lets users rate a model and leave a comment, updating the model's rating statistics.

### Data Retrieval
- **getModel**: Retrieves detailed information about a specific model, including its average rating.
- **getAllModelIds**: Returns a list of all model IDs in the marketplace.
- **getUserProfile**: Provides information about a user's profile, including their DID and reputation.

### User Management
- **setDID**: Allows users to set their Decentralized Identifier (DID).

## Tests Documentation

This document provides an overview of the tests implemented for the `NexMLMarketplace` smart contract. The tests are structured using Mocha and Chai, and they cover various functionalities of the contract.

### Test Structure

### 1. Deployment Tests
- **Test Case**: Should deploy the contract
  - **Description**: Verifies that the contract is deployed successfully and the address is not null.

### 2. Model Upload Tests
- **Test Case**: Should upload a model successfully
  - **Description**: Tests the successful upload of a model with valid parameters.
  
- **Test Case**: Should revert if IPFS hash is empty
  - **Description**: Ensures that uploading a model with an empty IPFS hash reverts the transaction with an appropriate error message.

- **Test Case**: Should revert if `forSale` is true and `salePrice` is zero
  - **Description**: Checks that the transaction reverts when a model is marked for sale but the sale price is zero.

- **Test Case**: Should revert if `forRent` is true and `rentPrice` is zero
  - **Description**: Ensures that the transaction reverts when a model is marked for rent but the rent price is zero.

- **Test Case**: Should work if `forRent` is true and `rentPrice` is non-zero
  - **Description**: Tests that a model can be uploaded successfully when it is marked for rent with a valid rent price.

- **Test Case**: Should work if `forSale` is true and `salePrice` is non-zero
  - **Description**: Tests that a model can be uploaded successfully when it is marked for sale with a valid sale price.

- **Test Case**: Should emit model uploaded event when uploaded
  - **Description**: Verifies that the correct event is emitted upon successful model upload.

- **Test Case**: Should add model ID to the user's list
  - **Description**: Checks that the uploaded model ID is correctly added to the user's list of models.

- **Test Case**: Should allow multiple models to be uploaded by the same user
  - **Description**: Tests that a user can upload multiple models and that they are stored correctly.

### 3. Update Model State Tests
- **Test Case**: Should allow the model owner to update the model state
  - **Description**: Verifies that the owner of a model can update its state successfully.

- **Test Case**: Should revert if a non-owner tries to update the model state
  - **Description**: Ensures that only the owner can update the model state, reverting the transaction for non-owners.

- **Test Case**: Should revert if the model does not exist
  - **Description**: Tests that updating a non-existent model reverts the transaction.

### 4. Purchase Model Tests
- **Test Case**: Should allow a user to purchase a model
  - **Description**: Verifies that a user can successfully purchase a model.

- **Test Case**: Should revert if the price sent is incorrect
  - **Description**: Ensures that the transaction reverts if the price sent does not match the model's sale price.

- **Test Case**: Should revert if the model is not for sale
  - **Description**: Tests that purchasing a model that is not for sale reverts the transaction.

- **Test Case**: Should revert if the owner tries to purchase their own model
  - **Description**: Ensures that the model owner cannot purchase their own model.

- **Test Case**: Should revert if the model does not exist
  - **Description**: Tests that attempting to purchase a non-existent model reverts the transaction.

### 5. Rent Model Tests
- **Test Case**: Should allow a user to rent a model successfully
  - **Description**: Verifies that a user can successfully rent a model.

- **Test Case**: Should revert if the price sent is incorrect
  - **Description**: Ensures that the transaction reverts if the price sent does not match the model's rent price.

- **Test Case**: Should revert if the model is not for rent
  - **Description**: Tests that renting a model that is not available for rent reverts the transaction.

- **Test Case**: Should revert if the owner tries to rent their own model
  - **Description**: Ensures that the model owner cannot rent their own model.

- **Test Case**: Should revert if the model does not exist
  - **Description**: Tests that attempting to rent a non-existent model reverts the transaction.

### 6. Rate Model Tests
- **Test Case**: Should allow a user to rate a model successfully
  - **Description**: Verifies that a user can successfully rate a model.

- **Test Case**: Should revert if the user tries to rate the same model twice
  - **Description**: Ensures that a user cannot rate the same model more than once.

- **Test Case**: Should allow multiple users to rate the same model
  - **Description**: Tests that different users can rate the same model independently.

- **Test Case**: Should revert if the rating is out of bounds
  - **Description**: Ensures that ratings outside the valid range (1-5) revert the transaction.

- **Test Case**: Should revert if the model does not exist
  - **Description**: Tests that attempting to rate a non-existent model reverts the transaction.

### 7. Set DID Tests
- **Test Case**: Should allow a user to set their DID
  - **Description**: Verifies that a user can successfully set their Decentralized Identifier (DID).

- **Test Case**: Should revert if the DID is empty
  - **Description**: Ensures that setting an empty DID reverts the transaction.

- **Test Case**: Should allow updating the DID
  - **Description**: Tests that a user can update their DID successfully.

