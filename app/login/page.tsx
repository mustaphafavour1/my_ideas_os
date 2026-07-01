import { LoginForm } from './LoginForm';

export const metadata = {
  title: 'Sign in — Idea OS',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; next?: string }>;
}) {
  const { sent, next } = await searchParams;

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
          <LoginForm next={next} />
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
