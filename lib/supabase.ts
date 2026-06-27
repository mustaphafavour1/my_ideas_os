import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _publicClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_publicClient) {
    _publicClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _publicClient;
}

// Named export for backwards compat with any client-side use
export const supabase = {
  get from() { return getSupabase().from.bind(getSupabase()); },
};

export function createServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
