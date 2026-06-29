import type { Metadata } from 'next';
import { Geist, Geist_Mono, Rancho, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Toaster } from 'sonner';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const rancho = Rancho({ weight: '400', variable: '--font-rancho', subsets: ['latin'] });
const jetbrainsMono = JetBrains_Mono({ variable: '--font-jetbrains-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Idea OS',
  description: 'Personal idea intelligence dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${rancho.variable} ${jetbrainsMono.variable} h-full`}>
      <head>
        {/* Apply theme/color/font before first paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var s = JSON.parse(localStorage.getItem('ideas-os-settings') || '{}');
            var h = document.documentElement;
            if (s.theme === 'light') h.setAttribute('data-theme', 'light');
            if (s.accentColor && s.accentColor !== '#F7C948') h.style.setProperty('--accent', s.accentColor);
            if (s.font === 'rancho') h.classList.add('font-rancho');
            else if (s.font === 'jetbrains') h.classList.add('font-jetbrains');
          } catch(e) {}
        ` }} />
      </head>
      <body className="h-full bg-[#0A0A0F] text-[#F0F0F5] antialiased">
        {/* Premium ambient glow — bottom-right corner */}
        <div
          className="pointer-events-none fixed bottom-0 right-0 z-0"
          style={{
            width: '700px',
            height: '500px',
            background: 'radial-gradient(ellipse at 100% 100%, rgba(247,201,72,0.055) 0%, rgba(247,201,72,0.025) 35%, rgba(247,201,72,0.008) 60%, transparent 80%)',
          }}
        />
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
      </body>
    </html>
  );
}
