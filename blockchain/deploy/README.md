# Deployment Notes

## Target Network

- Network: BNB Smart Chain Testnet
- Chain ID: `97`
- Token: `tBNB`
- Explorer: `https://testnet.bscscan.com`

## Contract

- `contracts/AidnaraAidRegistry.sol`

## Required Environment Variables

```text
BNB_TESTNET_RPC_URL=
DEPLOYER_PRIVATE_KEY=
BSCSCAN_API_KEY=
```

## Deployment Output To Save

- contract address
- ABI
- deploy transaction hash
- BscScan testnet URL

## Frontend/Backend Env Updates

```text
NEXT_PUBLIC_CHAIN_ID=97
NEXT_PUBLIC_CONTRACT_ADDRESS=<deployed-contract-address>
```
