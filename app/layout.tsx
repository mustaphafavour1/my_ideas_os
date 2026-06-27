import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Toaster } from 'sonner';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Idea OS',
  description: 'Personal idea intelligence dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="h-full bg-[#0A0A0F] text-[#F0F0F5] antialiased">
        <Sidebar />
        <div className="lg:pl-[220px] pb-16 lg:pb-0 min-h-full flex flex-col">
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
