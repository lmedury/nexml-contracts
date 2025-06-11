// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract NexMLMarketplace is AccessControl, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.Bytes32Set;

    // Events
    event ModelUploaded(bytes32 indexed modelId, address indexed owner, string ipfsHash);
    event ModelPurchased(bytes32 indexed modelId, address indexed buyer, uint256 price);
    event ModelRented(bytes32 indexed modelId, address indexed buyer, uint256 price);
    event ModelRated(bytes32 indexed modelId, address indexed reviewer, uint256 rating, string comment);

    struct Review {
        address reviewer;
        uint256 rating;
        string comment;
    }

    // Structs
    struct Model {
        address owner;
        string ipfsHash; 
        bool forSale;
        bool forRent;
        uint256 salePrice;
        uint256 rentPrice; 
        uint256 ratingSum; 
        uint256 ratingCount; 
        mapping(bytes32 => Review[]) reviews;
    }

    struct User {
        string did; 
        mapping (bytes32 => Review[]) reviews;
        uint256 reputation; 
    }

    // Storage
    mapping(bytes32 => Model) public models; 
    mapping(bytes32 => Review[]) public modelReviews; 
    mapping(address => User) public users; 
    mapping(address => bytes32[]) public modelsByUser;
    mapping(bytes32 => address[]) public modelsRented;

    EnumerableSet.Bytes32Set private modelIds; // Set of all model IDs

    modifier modelExists(bytes32 modelId) {
        require(modelIds.contains(modelId), "Model does not exist");
        _;
    }

    modifier isModelOwner(bytes32 modelId) {
        require(models[modelId].owner == msg.sender, "Sender is not the model owner");
        _;
    }

    // Functions

    // Upload a new model
    function uploadModel(
        string memory ipfsHash,
        bool forRent,
        bool forSale,
        uint256 rentPrice,
        uint256 salePrice
    ) external returns (bytes32) {
        require(bytes(ipfsHash).length > 0, "IPFS hash is required");

        bytes32 modelId = keccak256(abi.encodePacked(msg.sender, block.timestamp));

        models[modelId].ipfsHash = ipfsHash;
        models[modelId].owner = msg.sender;
        models[modelId].forRent = forRent; 
        models[modelId].forSale = forSale; 
        models[modelId].salePrice = salePrice; 
        models[modelId].rentPrice = rentPrice;
        
        if (!forRent && !forSale){
            require(salePrice > 0, "Sale price is required");
        }

        modelIds.add(modelId);
        modelsByUser[msg.sender].push(modelId);

        emit ModelUploaded(modelId, msg.sender, ipfsHash);
        return modelId;
    }

    function updateModelState(bytes32 modelId, 
        string memory ipfsHash,
        bool forRent,
        bool forSale,
        uint256 rentPrice,
        uint256 salePrice) external isModelOwner(modelId) {
            models[modelId].ipfsHash = ipfsHash;
            models[modelId].forRent = forRent; 
            models[modelId].forSale = forSale; 
            models[modelId].salePrice = salePrice;
            models[modelId].rentPrice = rentPrice;
        }

    // Purchase a model
    function purchaseModel(bytes32 modelId) external payable nonReentrant modelExists(modelId) {
        Model storage model = models[modelId];
        require(msg.value == model.salePrice, "Incorrect price sent");
        require(msg.sender != model.owner, "Owner cannot purchase their own model");
        require(model.forSale == true, "Model is not for sale");

        payable(model.owner).transfer(msg.value);
        models[modelId].owner = msg.sender;
        emit ModelPurchased(modelId, msg.sender, msg.value);
    }

    function rentModel(bytes32 modelId) external payable nonReentrant modelExists(modelId) {
        Model storage model = models[modelId];
        require(msg.value == model.rentPrice, "Incorrect price sent");
        require(msg.sender != model.owner, "Owner cannot purchase their own model");
        require(model.forRent == true, "Model is not for renting");

        payable(model.owner).transfer(msg.value);
        modelsRented[modelId].push(msg.sender);
        emit ModelRented(modelId, msg.sender, msg.value);
    }

    // Rate a model
    function rateModel(bytes32 modelId, uint256 rating, string memory comment) external modelExists(modelId) {
        require(rating > 0 && rating <= 5, "Rating must be between 1 and 5");

        Model storage model = models[modelId];
        model.ratingSum += rating;
        model.ratingCount += 1;

        modelReviews[modelId].push(Review({
            reviewer: msg.sender,
            rating: rating,
            comment: comment
        }));

        emit ModelRated(modelId, msg.sender, rating, comment);
    }

    // Get model details
    function getModel(bytes32 modelId) external view modelExists(modelId) returns (
        string memory ipfsHash,
        address owner,
        bool forSale,
        bool forRent,
        uint256 salePrice,
        uint256 rentPrice,
        uint256 averageRating
    ) {
        Model storage model = models[modelId];
        uint256 avgRating = model.ratingCount > 0 ? model.ratingSum / model.ratingCount : 0;

        return (
            model.ipfsHash,
            model.owner,
            model.forSale,
            model.forRent,
            model.salePrice,
            model.rentPrice,
            avgRating
        );
    }

    // Get all model IDs
    function getAllModelIds() external view returns (bytes32[] memory) {
        return modelIds.values();
    }

    // Get user profile
    function getUserProfile(address userAddress) external view returns (string memory did, uint256 reputation, bytes32[] memory) {
        User storage user = users[userAddress];
        return (user.did, user.reputation, modelsByUser[msg.sender]);
    }

    // Assign a DID to a user
    function setDID(string memory did) external {
        require(bytes(did).length > 0, "DID is required");
        users[msg.sender].did = did;
    }
}
