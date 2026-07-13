// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AidnaraAidRegistry {
    struct Campaign {
        address owner;
        string metadataURI;
        uint256 targetAmount;
        uint256 totalDonated;
        uint256 totalWithdrawn;
        bool active;
        uint256 createdAt;
    }

    struct Proof {
        uint256 campaignId;
        string proofURI;
        bytes32 proofHash;
        uint256 submittedAt;
    }

    struct Certificate {
        uint256 campaignId;
        address recipient;
        string certificateType;
        string certificateURI;
        bytes32 certificateHash;
        uint256 issuedAt;
        bool valid;
    }

    uint256 public nextCampaignId = 1;

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => Proof[]) private campaignProofs;
    mapping(bytes32 => Certificate) private certificates;
    mapping(bytes32 => bool) public certificateExists;

    event CampaignCreated(uint256 indexed campaignId, address indexed owner, string metadataURI, uint256 targetAmount);
    event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount);
    event ProofSubmitted(uint256 indexed campaignId, bytes32 indexed proofHash, string proofURI);
    event CertificateIssued(
        uint256 indexed campaignId,
        address indexed recipient,
        bytes32 indexed certificateHash,
        string certificateType
    );
    event FundsWithdrawn(uint256 indexed campaignId, address indexed owner, uint256 amount);

    modifier campaignExists(uint256 campaignId) {
        require(campaigns[campaignId].owner != address(0), "Campaign not found");
        _;
    }

    modifier onlyCampaignOwner(uint256 campaignId) {
        require(msg.sender == campaigns[campaignId].owner, "Not campaign owner");
        _;
    }

    function createCampaign(string calldata metadataURI, uint256 targetAmount) external returns (uint256 campaignId) {
        require(bytes(metadataURI).length > 0, "Metadata URI required");
        require(targetAmount > 0, "Target amount required");

        campaignId = nextCampaignId++;

        campaigns[campaignId] = Campaign({
            owner: msg.sender,
            metadataURI: metadataURI,
            targetAmount: targetAmount,
            totalDonated: 0,
            totalWithdrawn: 0,
            active: true,
            createdAt: block.timestamp
        });

        emit CampaignCreated(campaignId, msg.sender, metadataURI, targetAmount);
    }

    function donate(uint256 campaignId) external payable campaignExists(campaignId) {
        Campaign storage campaign = campaigns[campaignId];

        require(campaign.active, "Campaign inactive");
        require(msg.value > 0, "Donation required");

        campaign.totalDonated += msg.value;

        emit DonationReceived(campaignId, msg.sender, msg.value);
    }

    function submitProof(
        uint256 campaignId,
        string calldata proofURI,
        bytes32 proofHash
    ) external campaignExists(campaignId) onlyCampaignOwner(campaignId) {
        require(bytes(proofURI).length > 0, "Proof URI required");
        require(proofHash != bytes32(0), "Proof hash required");

        campaignProofs[campaignId].push(
            Proof({campaignId: campaignId, proofURI: proofURI, proofHash: proofHash, submittedAt: block.timestamp})
        );

        emit ProofSubmitted(campaignId, proofHash, proofURI);
    }

    function issueCertificate(
        uint256 campaignId,
        address recipient,
        string calldata certificateType,
        string calldata certificateURI,
        bytes32 certificateHash
    ) external campaignExists(campaignId) onlyCampaignOwner(campaignId) {
        require(recipient != address(0), "Recipient required");
        require(bytes(certificateType).length > 0, "Certificate type required");
        require(bytes(certificateURI).length > 0, "Certificate URI required");
        require(certificateHash != bytes32(0), "Certificate hash required");
        require(!certificateExists[certificateHash], "Certificate already exists");

        certificates[certificateHash] = Certificate({
            campaignId: campaignId,
            recipient: recipient,
            certificateType: certificateType,
            certificateURI: certificateURI,
            certificateHash: certificateHash,
            issuedAt: block.timestamp,
            valid: true
        });
        certificateExists[certificateHash] = true;

        emit CertificateIssued(campaignId, recipient, certificateHash, certificateType);
    }

    function verifyCertificate(bytes32 certificateHash) external view returns (Certificate memory certificate) {
        require(certificateExists[certificateHash], "Certificate not found");
        return certificates[certificateHash];
    }

    function withdraw(uint256 campaignId, uint256 amount)
        external
        campaignExists(campaignId)
        onlyCampaignOwner(campaignId)
    {
        require(amount > 0, "Amount required");
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.totalDonated - campaign.totalWithdrawn >= amount, "Insufficient campaign balance");

        campaign.totalWithdrawn += amount;

        (bool sent,) = payable(msg.sender).call{value: amount}("");
        require(sent, "Withdraw failed");

        emit FundsWithdrawn(campaignId, msg.sender, amount);
    }

    function getProofCount(uint256 campaignId) external view campaignExists(campaignId) returns (uint256) {
        return campaignProofs[campaignId].length;
    }

    function getProof(uint256 campaignId, uint256 proofIndex)
        external
        view
        campaignExists(campaignId)
        returns (Proof memory proof)
    {
        require(proofIndex < campaignProofs[campaignId].length, "Proof not found");
        return campaignProofs[campaignId][proofIndex];
    }
}
