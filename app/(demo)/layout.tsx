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
      {/* Demo banner — floating pill centered at top */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-4 py-2 bg-[#F7C948] text-[#0A0A0F] rounded-full shadow-lg whitespace-nowrap">
        <span className="text-[10px] font-mono uppercase tracking-widest font-semibold">Demo mode</span>
        <span className="text-[10px] opacity-50 hidden sm:inline">· sample data only</span>
        <span className="w-px h-3 bg-[#0A0A0F]/20" />
        <a
          href="/"
          className="text-[10px] font-semibold opacity-70 hover:opacity-100 transition-opacity"
        >
          Join waitlist
        </a>
        <a
          href="/login"
          className="h-6 px-3 rounded-full bg-[#0A0A0F]/15 hover:bg-[#0A0A0F]/25 text-[10px] font-semibold transition-colors"
        >
          Sign in
        </a>
      </div>
      <Sidebar />
      <div className="lg:pl-[220px] pb-16 lg:pb-0 min-h-full flex flex-col relative z-10">
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
