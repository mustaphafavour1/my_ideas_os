import { sendMagicLink } from './actions';

export const metadata = {
  title: 'Sign in — Idea OS',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; next?: string }>;
}) {
  const { sent, error, next } = await searchParams;

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-display text-2xl text-[#F0F0F5]">Idea OS</span>
          <p className="mt-2 text-sm text-[#9090A8]">Sign in to your dashboard</p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-6 text-center">
            <p className="text-[#F0F0F5] font-medium">Check your email</p>
            <p className="mt-1.5 text-sm text-[#9090A8]">
              We sent a magic link. Click it to sign in — no password needed.
            </p>
          </div>
        ) : (
          <form
            action={sendMagicLink}
            className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-6 flex flex-col gap-4"
          >
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
                className="w-full rounded-lg bg-[#0A0A0F] border border-[#2A2A3A] px-3 py-2.5 text-sm text-[#F0F0F5] placeholder-[#4A4A5A] focus:outline-none focus:border-[#F7C948]/50 transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">
                {decodeURIComponent(error)}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-[#F7C948] text-[#0A0A0F] text-sm font-semibold py-2.5 hover:bg-[#F7C948]/90 transition-colors"
            >
              Send magic link
            </button>

            <p className="text-center text-xs text-[#4A4A5A]">
              No account yet?{' '}
              <a href="/" className="text-[#9090A8] hover:text-[#F0F0F5] transition-colors">
                Join the waitlist
              </a>
            </p>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-[#4A4A5A]">
          Want to explore first?{' '}
          <a href="/demo" className="text-[#9090A8] hover:text-[#F0F0F5] transition-colors">
            Try the demo
          </a>
        </p>
      </div>
    </div>
  );
}
