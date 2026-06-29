import { Sidebar } from '@/components/layout/Sidebar';
import { Toaster } from 'sonner';
import { DemoBanner } from '@/components/layout/DemoBanner';
import { isDemoMode } from '@/lib/demo-mode';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const demo = await isDemoMode();
  return (
    <>
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed bottom-0 right-0 z-0"
        style={{
          width: '700px',
          height: '500px',
          background:
            'radial-gradient(ellipse at 100% 100%, rgba(247,201,72,0.055) 0%, rgba(247,201,72,0.025) 35%, rgba(247,201,72,0.008) 60%, transparent 80%)',
        }}
      />
      <DemoBanner />
      <Sidebar />
      <div className={`lg:pl-[220px] pb-16 lg:pb-0 min-h-full flex flex-col relative z-10 ${demo ? 'pt-[42px]' : ''}`}>
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
