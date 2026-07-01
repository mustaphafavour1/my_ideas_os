'use server';

import { createSupabaseServerClient } from '@/lib/auth';
import { redirect } from 'next/navigation';

export type MagicLinkState = { error: string; debug: string } | null;

export async function sendMagicLink(
  _prev: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  const email = formData.get('email') as string;
  const next  = (formData.get('next') as string) || '/app';
  if (!email) return { error: 'Please enter your email address.', debug: '' };

  const supabase = await createSupabaseServerClient();
  const origin   = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    console.error('[sendMagicLink]', error);
    const raw      = typeof error.message === 'string' ? error.message.trim() : '';
    const friendly = (raw && raw !== '{}')
      ? raw
      : 'Could not send the link. Please check your email address and try again.';
    return { error: friendly, debug: raw };
  }

  redirect('/login?sent=1');
}
