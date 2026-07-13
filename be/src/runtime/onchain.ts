import { readServerEnv } from '../config/env';
import { fail, ok } from '../lib/http';
import {
  validateCertificateEvent,
  validateDonationEvent,
  validateProofEvent,
  type CertificateEventExpectation,
  type DonationEventExpectation,
  type ProofEventExpectation,
} from '../services/onchain';

export async function validateDonationTransactionRuntime(expectation: DonationEventExpectation, env = readServerEnv()) {
  try {
    return ok(await validateDonationEvent(toOnchainOptions(env), expectation));
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Donation transaction validation failed');
  }
}

export async function validateProofTransactionRuntime(expectation: ProofEventExpectation, env = readServerEnv()) {
  try {
    return ok(await validateProofEvent(toOnchainOptions(env), expectation));
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Proof transaction validation failed');
  }
}

export async function validateCertificateTransactionRuntime(expectation: CertificateEventExpectation, env = readServerEnv()) {
  try {
    return ok(await validateCertificateEvent(toOnchainOptions(env), expectation));
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Certificate transaction validation failed');
  }
}

function toOnchainOptions(env: ReturnType<typeof readServerEnv>) {
  return {
    rpcUrl: env.rpcUrl,
    contractAddress: env.contractAddress,
    chainId: env.chainId,
  };
}
