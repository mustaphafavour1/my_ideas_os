'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  House,
  Lightbulb,
  ChartBar,
  Sparkle,
  Tray,
  Lightning,
  Gear,
} from '@phosphor-icons/react';
import { DemoButton } from './DemoButton';

const NAV_ITEMS = [
  { href: '/',            label: 'Dashboard',  Icon: House },
  { href: '/ideas',       label: 'Ideas',       Icon: Lightbulb },
  { href: '/analytics',   label: 'Analytics',   Icon: ChartBar },
  { href: '/suggestions', label: 'Suggestions', Icon: Sparkle },
  { href: '/inbox',       label: 'Inbox',       Icon: Tray },
  { href: '/signals',     label: 'Signals',     Icon: Lightning },
  { href: '/settings',    label: 'Settings',    Icon: Gear },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[220px] bg-[#0A0A0F] border-r border-[#1E1E2E] z-40">
        {/* Logo — h-[71px] to match TopBar */}
        <div className="flex items-center px-5 h-[71px] border-b border-[#1E1E2E] shrink-0">
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
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 relative group ${
                  isActive
                    ? 'text-[#F7C948] bg-[#F7C948]/8'
                    : 'text-[#6A6A80] hover:text-[#D0D0DA] hover:bg-[#1E1E2E]/60'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#F7C948] rounded-r"
                  />
                )}
                <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
                <span className="font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>

        <DemoButton />

        <div className="px-5 py-3 border-t border-[#1E1E2E]">
          <p className="text-[#4A4A60] text-[10px] font-mono">v0.1.0</p>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0F]/95 backdrop-blur-md border-t border-[#1E1E2E]">
        <div className="flex">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-[#F7C948]' : 'text-[#4A4A60]'
                }`}
              >
                <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
