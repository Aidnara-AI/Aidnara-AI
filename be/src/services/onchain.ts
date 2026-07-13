import { ethers } from 'ethers';

export const aidnaraEventAbi = [
  'event CampaignCreated(uint256 indexed campaignId, address indexed owner, string metadataURI, uint256 targetAmount)',
  'event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount)',
  'event ProofSubmitted(uint256 indexed campaignId, bytes32 indexed proofHash, string proofURI)',
  'event CertificateIssued(uint256 indexed campaignId, address indexed recipient, bytes32 indexed certificateHash, string certificateType)',
  'event FundsWithdrawn(uint256 indexed campaignId, address indexed owner, uint256 amount)',
] as const;

export type OnchainValidationOptions = {
  rpcUrl: string;
  contractAddress: string;
  chainId: number;
};

export type DonationEventExpectation = {
  txHash: string;
  campaignId: bigint | number | string;
  donorAddress: string;
  amount: bigint | number | string;
};

export type ProofEventExpectation = {
  txHash: string;
  campaignId: bigint | number | string;
  proofHash: string;
};

export type CertificateEventExpectation = {
  txHash: string;
  campaignId: bigint | number | string;
  recipientAddress: string;
  certificateHash: string;
};

export async function validateDonationEvent(options: OnchainValidationOptions, expectation: DonationEventExpectation) {
  const event = await findContractEvent(options, expectation.txHash, 'DonationReceived');

  assertBigIntEquals(event.args.campaignId, expectation.campaignId, 'campaignId mismatch');
  assertAddressEquals(event.args.donor, expectation.donorAddress, 'donor mismatch');
  assertBigIntEquals(event.args.amount, expectation.amount, 'amount mismatch');

  return event;
}

export async function validateProofEvent(options: OnchainValidationOptions, expectation: ProofEventExpectation) {
  const event = await findContractEvent(options, expectation.txHash, 'ProofSubmitted');

  assertBigIntEquals(event.args.campaignId, expectation.campaignId, 'campaignId mismatch');
  if (event.args.proofHash.toLowerCase() !== expectation.proofHash.toLowerCase()) {
    throw new Error('proofHash mismatch');
  }

  return event;
}

export async function validateCertificateEvent(
  options: OnchainValidationOptions,
  expectation: CertificateEventExpectation,
) {
  const event = await findContractEvent(options, expectation.txHash, 'CertificateIssued');

  assertBigIntEquals(event.args.campaignId, expectation.campaignId, 'campaignId mismatch');
  assertAddressEquals(event.args.recipient, expectation.recipientAddress, 'recipient mismatch');
  if (event.args.certificateHash.toLowerCase() !== expectation.certificateHash.toLowerCase()) {
    throw new Error('certificateHash mismatch');
  }

  return event;
}

async function findContractEvent(options: OnchainValidationOptions, txHash: string, eventName: string) {
  const provider = new ethers.JsonRpcProvider(options.rpcUrl, options.chainId);
  const receipt = await provider.getTransactionReceipt(txHash);

  if (!receipt) throw new Error('Transaction receipt not found');
  if (receipt.status !== 1) throw new Error('Transaction failed');

  const contractAddress = options.contractAddress.toLowerCase();
  const iface = new ethers.Interface(aidnaraEventAbi);

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== contractAddress) continue;

    const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
    if (parsed?.name === eventName) return parsed;
  }

  throw new Error(`${eventName} event not found`);
}

function assertAddressEquals(actual: string, expected: string, message: string) {
  if (actual.toLowerCase() !== expected.toLowerCase()) throw new Error(message);
}

function assertBigIntEquals(actual: bigint, expected: bigint | number | string, message: string) {
  if (actual !== BigInt(expected)) throw new Error(message);
}
