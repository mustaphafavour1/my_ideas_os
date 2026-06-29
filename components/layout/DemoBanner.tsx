import { cookies } from 'next/headers';
import { DEMO_COOKIE } from '@/lib/demo-mode';
import Link from 'next/link';

export async function DemoBanner() {
  const store = await cookies();
  if (store.get(DEMO_COOKIE)?.value !== '1') return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[60] flex items-center justify-between gap-4 px-5 py-2.5 bg-[#F7C948] text-[#0A0A0F]">
      <div className="flex items-center gap-2.5">
        <span className="text-[11px] font-mono uppercase tracking-widest font-semibold">Demo mode</span>
        <span className="text-[11px] opacity-60">— You&apos;re exploring sample data. Nothing here is real.</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/"
          className="h-7 px-4 rounded-full bg-[#0A0A0F]/10 hover:bg-[#0A0A0F]/20 text-[11px] font-semibold transition-colors"
        >
          Join waitlist
        </Link>
        <Link
          href="/api/demo?action=end"
          className="h-7 px-4 rounded-full bg-[#0A0A0F]/15 hover:bg-[#0A0A0F]/25 text-[11px] font-semibold transition-colors"
        >
          Exit demo
        </Link>
      </div>
    </div>
  );
}
