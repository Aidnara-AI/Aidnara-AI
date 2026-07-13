import { fail, ok } from '../lib/http';
import { createSupabaseAdmin } from '../lib/supabase-admin';
import { createSupabaseSignedUpload } from '../services/supabase-storage';

export async function prepareSupabaseSignedUpload(body: unknown, supabase = createSupabaseAdmin()) {
  try {
    return ok(await createSupabaseSignedUpload(supabase, body));
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Signed upload failed');
  }
}
