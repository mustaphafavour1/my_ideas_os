import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _publicClient: SupabaseClient | null = null;

// Cookie-based browser client — shares the same session as the server-side
// auth (lib/auth.ts) and defaults to the PKCE flow, so a client that's
// already logged in server-side is recognised here too, and magic links
// always resolve via /auth/callback?code=... instead of a URL hash.
export function getSupabase(): SupabaseClient {
  if (!_publicClient) {
    _publicClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _publicClient;
}

export function createServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
