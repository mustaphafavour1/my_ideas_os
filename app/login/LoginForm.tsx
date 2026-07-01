'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { sendMagicLink, type MagicLinkState } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full rounded-lg bg-[#F7C948] text-[#0A0A0F] text-sm font-semibold py-2.5 transition-all duration-150 flex items-center justify-center gap-2 ${
        pending
          ? 'opacity-70 cursor-not-allowed'
          : 'hover:bg-[#F7C948]/90 active:scale-[0.98] cursor-pointer'
      }`}
    >
      {pending && (
        <span className="w-3.5 h-3.5 border-2 border-[#0A0A0F]/30 border-t-[#0A0A0F] rounded-full animate-spin" />
      )}
      {pending ? 'Sending…' : 'Send magic link'}
    </button>
  );
}

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [state, action] = useActionState<MagicLinkState, FormData>(sendMagicLink, null);
  const [linkError, setLinkError] = useState(() =>
    initialError ? decodeURIComponent(initialError) : ''
  );

  useEffect(() => {
    if (state?.debug) {
      console.error('[Idea OS] Magic link error:', state.debug);
    }
  }, [state]);

  // Scrub ?error=... and any stray #access_token=... from the URL once,
  // right after reading it, so a refresh never re-shows the same error.
  useEffect(() => {
    if (initialError || window.location.hash) {
      const cleanSearch = next ? `?next=${encodeURIComponent(next)}` : '';
      window.history.replaceState(null, '', window.location.pathname + cleanSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayError = state?.error || linkError;

  return (
    <form action={action} className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-6 flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-medium text-[#9090A8] uppercase tracking-wider">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoFocus
          placeholder="you@example.com"
          onChange={() => linkError && setLinkError('')}
          className="w-full rounded-lg bg-[#0A0A0F] border border-[#2A2A3A] px-3 py-2.5 text-sm text-[#F0F0F5] placeholder-[#4A4A5A] focus:outline-none focus:border-[#F7C948]/50 transition-colors"
        />
      </div>

      {displayError && (
        <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">
          {displayError}
        </p>
      )}

      <SubmitButton />

      <p className="text-center text-xs text-[#4A4A5A]">
        No account yet?{' '}
        <a href="/" className="text-[#9090A8] hover:text-[#F0F0F5] transition-colors">
          Join the waitlist
        </a>
      </p>
    </form>
  );
}
