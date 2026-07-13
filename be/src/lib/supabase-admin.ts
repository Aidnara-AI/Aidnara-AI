import { createClient } from '@supabase/supabase-js';
import { readServerEnv } from '../config/env';

export function createSupabaseAdmin(env = readServerEnv()) {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
