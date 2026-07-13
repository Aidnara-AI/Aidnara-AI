import { readServerEnv } from '../config/env';
import { fail, ok } from '../lib/http';
import { listAidnaraEvents, type EventRange } from '../services/onchain-events';

export async function syncAidnaraEventsRuntime(range: EventRange, env = readServerEnv()) {
  try {
    return ok(
      await listAidnaraEvents({
        rpcUrl: env.rpcUrl,
        contractAddress: env.contractAddress,
        chainId: env.chainId,
        ...range,
      }),
    );
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'On-chain event sync failed');
  }
}
