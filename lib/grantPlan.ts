import { SupabaseClient } from '@supabase/supabase-js';

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export function planUpdates(plan: string): Record<string, unknown> {
  const updates: Record<string, unknown> = { plan, plan_updated_at: new Date().toISOString() };
  if (plan === 'one-time') {
    updates.analysis_credits = 1;
    updates.max_conversations = 150;
  } else if (plan === 'monthly') {
    updates.monthly_syncs_remaining = 4;
    updates.subscription_end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }
  return updates;
}

// Guest checkout: finds the auth user by email, creating one if none exists
// yet. Returns the user id, or null if Supabase couldn't resolve/create it.
export async function resolveUserIdByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${SITE_URL}/auth/callback?next=/app` },
  });
  if (error || !data?.user) return null;
  return data.user.id;
}

// Sends the actual branded sign-in email via the configured SMTP.
export async function sendLoginLink(supabase: SupabaseClient, email: string): Promise<void> {
  await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${SITE_URL}/auth/callback?next=/app` },
  });
}
