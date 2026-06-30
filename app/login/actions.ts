'use server';

import { createSupabaseServerClient } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function sendMagicLink(formData: FormData) {
  const email = formData.get('email') as string;
  const next = (formData.get('next') as string) || '/app';
  if (!email) return;

  const supabase = await createSupabaseServerClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    const message =
      (typeof error.message === 'string' && error.message.trim() && error.message !== '{}')
        ? error.message
        : 'Could not send link. Please try again or check your email address.';
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }

  redirect('/login?sent=1');
}
