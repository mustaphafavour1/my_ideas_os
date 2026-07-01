import type { Metadata } from 'next';
import { Geist, Geist_Mono, Rancho, JetBrains_Mono, Edu_SA_Beginner } from 'next/font/google';
import './globals.css';

const geistSans     = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono     = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const rancho        = Rancho({ weight: '400', variable: '--font-rancho', subsets: ['latin'] });
const jetbrainsMono = JetBrains_Mono({ variable: '--font-jetbrains-mono', subsets: ['latin'] });
const eduSA         = Edu_SA_Beginner({ weight: ['400', '500', '600', '700'], variable: '--font-edu-sa', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Idea OS',
  description: 'Personal idea intelligence dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${rancho.variable} ${jetbrainsMono.variable} ${eduSA.variable} h-full`}
    >
      <head>
        {/* Apply theme/color/font before first paint to avoid flash — app pages only */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              if (window.location.pathname === '/') return;
              var s = JSON.parse(localStorage.getItem('ideas-os-settings') || '{}');
              var h = document.documentElement;
              if (s.theme === 'light') h.setAttribute('data-theme', 'light');
              if (s.accentColor) {
                h.style.setProperty('--accent', s.accentColor);
                var hx = s.accentColor.replace('#','');
                h.style.setProperty('--accent-rgb',
                  parseInt(hx.slice(0,2),16)+','+parseInt(hx.slice(2,4),16)+','+parseInt(hx.slice(4,6),16));
              }
              if (s.font === 'rancho') h.classList.add('font-rancho');
              else if (s.font === 'jetbrains') h.classList.add('font-jetbrains');
            } catch(e) {}
          })();
        ` }} />
      </head>
      <body className="h-full bg-[#0A0A0F] text-[#F0F0F5] antialiased">
        {children}
      </body>
    </html>
  );
}
