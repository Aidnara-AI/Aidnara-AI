# Blockchain

Smart contract workspace for Aidnara AI.

## Responsibility

- Campaign registry.
- Donation handling.
- Proof hash registry.
- Certificate hash registry.
- Withdrawal rules.

## Suggested Stack

- Solidity
- Hardhat or Thirdweb
- BNB Smart Chain Testnet

## Network

- Testnet chain ID: `97`
- Testnet token: `tBNB`
- Testnet explorer: `https://testnet.bscscan.com`
- Mainnet chain ID: `56`
- Mainnet token: `BNB`
- Mainnet explorer: `https://bscscan.com`

## MVP Contract Functions

- `createCampaign(string metadataURI, uint256 targetAmount)`
- `donate(uint256 campaignId)`
- `submitProof(uint256 campaignId, string proofURI, bytes32 proofHash)`
- `issueCertificate(uint256 campaignId, address recipient, string certificateType, string certificateURI, bytes32 certificateHash)`
- `verifyCertificate(bytes32 certificateHash)`
- `withdraw(uint256 campaignId, uint256 amount)`
