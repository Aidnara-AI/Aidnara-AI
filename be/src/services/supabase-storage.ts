import { parseSignedUploadRequest } from '../lib/requests';
import { buildStoragePath, validateProofUpload, type UploadCandidate } from './storage';

type StorageBucket = {
  createSignedUploadUrl(path: string): Promise<{ data: { signedUrl: string; path: string } | null; error: Error | null }>;
  getPublicUrl(path: string): { data: { publicUrl: string } };
};

type SupabaseStorageClient = {
  storage: {
    from(bucket: string): StorageBucket;
  };
};

const bucketByKind = {
  'campaign-cover': 'campaign-covers',
  proof: 'proofs',
  certificate: 'certificates',
} as const;

export async function createSupabaseSignedUpload(supabase: SupabaseStorageClient, body: unknown) {
  const { kind, file } = parseSignedUploadRequest(body);
  const path = buildUploadPath(kind, file);
  const bucket = supabase.storage.from(bucketByKind[kind]);
  const { data, error } = await bucket.createSignedUploadUrl(path);

  if (error) throw error;
  if (!data) throw new Error('Signed upload URL was not created');

  return {
    path: data.path,
    uploadUrl: data.signedUrl,
    publicUrl: bucket.getPublicUrl(data.path).data.publicUrl,
  };
}

function buildUploadPath(kind: keyof typeof bucketByKind, file: UploadCandidate) {
  if (kind === 'proof') return validateProofUpload(file);
  return buildStoragePath(kind, file.name);
}
