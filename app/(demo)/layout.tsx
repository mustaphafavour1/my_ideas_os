import { Sidebar } from '@/components/layout/Sidebar';
import { Toaster } from 'sonner';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div
        className="pointer-events-none fixed bottom-0 right-0 z-0"
        style={{
          width: '700px',
          height: '500px',
          background:
            'radial-gradient(ellipse at 100% 100%, rgba(247,201,72,0.055) 0%, rgba(247,201,72,0.025) 35%, rgba(247,201,72,0.008) 60%, transparent 80%)',
        }}
      />
      {/* Demo banner */}
      <div className="fixed top-0 inset-x-0 z-[60] flex items-center justify-between gap-4 px-5 py-2.5 bg-[#F7C948] text-[#0A0A0F]">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-mono uppercase tracking-widest font-semibold">Demo mode</span>
          <span className="text-[11px] opacity-60">— You&apos;re exploring sample data. Nothing here is real.</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/"
            className="h-7 px-4 rounded-full bg-[#0A0A0F]/10 hover:bg-[#0A0A0F]/20 text-[11px] font-semibold transition-colors"
          >
            Join waitlist
          </a>
          <a
            href="/login"
            className="h-7 px-4 rounded-full bg-[#0A0A0F]/15 hover:bg-[#0A0A0F]/25 text-[11px] font-semibold transition-colors"
          >
            Sign in
          </a>
        </div>
      </div>
      <Sidebar />
      <div className="lg:pl-[220px] pb-16 lg:pb-0 min-h-full flex flex-col relative z-10 pt-[42px]">
        {children}
      </div>
      <Toaster
        position="bottom-right"
        theme="dark"
        closeButton
        toastOptions={{
          style: {
            background: '#111118',
            border: '1px solid #1E1E2E',
            color: '#F0F0F5',
          },
        }}
      />
    </>
  );
}
