'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/ideas',
    label: 'Ideas',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: '/suggestions',
    label: 'Suggestions',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    href: '/inbox',
    label: 'Inbox',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[220px] bg-[#0A0A0F] border-r border-[#1E1E2E] z-40">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#1E1E2E]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#F7C948] flex items-center justify-center shrink-0">
              <span className="text-[#0A0A0F] font-bold text-xs">IO</span>
            </div>
            <div>
              <span className="text-[#F0F0F5] font-semibold text-sm tracking-tight">Idea OS</span>
              <p className="text-[#4A4A60] text-[10px] font-mono">favour</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 relative group ${
                  isActive
                    ? 'text-[#F7C948] bg-[#F7C948]/8'
                    : 'text-[#8888A0] hover:text-[#F0F0F5] hover:bg-[#1E1E2E]/60'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#F7C948] rounded-r"
                  />
                )}
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-[#1E1E2E]">
          <p className="text-[#4A4A60] text-[10px] font-mono">v0.1.0 — local</p>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0F]/95 backdrop-blur-md border-t border-[#1E1E2E]">
        <div className="flex">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-[#F7C948]' : 'text-[#4A4A60]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
