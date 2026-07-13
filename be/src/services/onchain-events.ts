import { ethers } from 'ethers';
import { aidnaraEventAbi, type OnchainValidationOptions } from './onchain';

export type EventRange = {
  fromBlock: number;
  toBlock: number | 'latest';
};

export type IndexedAidnaraEvent = {
  name: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  args: Record<string, string>;
};

export async function listAidnaraEvents(options: OnchainValidationOptions & EventRange) {
  const provider = new ethers.JsonRpcProvider(options.rpcUrl, options.chainId);
  const iface = new ethers.Interface(aidnaraEventAbi);
  const logs = await provider.getLogs({
    address: options.contractAddress,
    fromBlock: options.fromBlock,
    toBlock: options.toBlock,
  });

  return logs.flatMap((log) => {
    const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
    if (!parsed) return [];

    return [
      {
        name: parsed.name,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        logIndex: log.index,
        args: normalizeArgs(parsed.args),
      },
    ];
  });
}

function normalizeArgs(args: ethers.Result): Record<string, string> {
  const output: Record<string, string> = {};

  for (const key of Object.keys(args)) {
    if (/^\d+$/.test(key)) continue;
    const value = args[key];
    output[key] = typeof value === 'bigint' ? value.toString() : String(value);
  }

  return output;
}
