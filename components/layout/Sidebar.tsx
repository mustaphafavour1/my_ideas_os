'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import {
  House,
  Lightbulb,
  ChartBar,
  Chats,
  Sparkle,
  Tray,
  Lightning,
  Gear,
  List,
  X,
  Users,
  User,
} from '@phosphor-icons/react';

const MAIN_NAV = [
  { href: '/',              label: 'Dashboard',      Icon: House },
  { href: '/ideas',         label: 'Ideas',           Icon: Lightbulb },
  { href: '/analytics',     label: 'Analytics',       Icon: ChartBar },
  { href: '/conversations', label: 'Conversations',   Icon: Chats },
  { href: '/insights',      label: 'Insights',        Icon: Sparkle },
];

const MORE_NAV = [
  { href: '/inbox',     label: 'Inbox',     Icon: Tray },
  { href: '/signals',   label: 'Signals',   Icon: Lightning },
  { href: '/community', label: 'Community', Icon: Users },
  { href: '/settings',  label: 'Settings',  Icon: Gear },
];

const ALL_NAV = [...MAIN_NAV, ...MORE_NAV];

function isActive(href: string, pathname: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMoreOpen(false); }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [moreOpen]);

  const anyMoreActive = [...MORE_NAV, { href: '/profile' }].some((item) => isActive(item.href, pathname));

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[220px] bg-[#0A0A0F] border-r border-[#1E1E2E] z-40">
        {/* Logo */}
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
          {ALL_NAV.map(({ href, label, Icon }) => {
            const active = isActive(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 relative group ${
                  active
                    ? 'text-[#F7C948] bg-[#F7C948]/8'
                    : 'text-[#6A6A80] hover:text-[#D0D0DA] hover:bg-[#1E1E2E]/60'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#F7C948] rounded-r"
                  />
                )}
                <Icon size={18} weight={active ? 'fill' : 'regular'} />
                <span className="font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-3 border-t border-[#1E1E2E] pt-2">
          <Link
            href="/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 relative group ${
              isActive('/profile', pathname)
                ? 'text-[#F7C948] bg-[#F7C948]/8'
                : 'text-[#6A6A80] hover:text-[#D0D0DA] hover:bg-[#1E1E2E]/60'
            }`}
          >
            <User size={18} weight={isActive('/profile', pathname) ? 'fill' : 'regular'} />
            <span className="font-medium">Profile</span>
          </Link>
          <p className="text-[#4A4A60] text-[10px] font-mono px-3 pt-1">v0.1.0</p>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0F]/95 backdrop-blur-md border-t border-[#1E1E2E]">
        <div className="flex" ref={popoverRef}>
          {/* Main 5 tabs */}
          {MAIN_NAV.map(({ href, label, Icon }) => {
            const active = isActive(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                  active ? 'text-[#F7C948]' : 'text-[#4A4A60]'
                }`}
              >
                <Icon size={18} weight={active ? 'fill' : 'regular'} />
                <span>{label}</span>
              </Link>
            );
          })}

          {/* Hamburger — 6th tab */}
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
              moreOpen || anyMoreActive ? 'text-[#F7C948]' : 'text-[#4A4A60]'
            }`}
          >
            {moreOpen ? <X size={18} /> : <List size={18} />}
            <span>More</span>
          </button>

          {/* More popover */}
          <AnimatePresence>
            {moreOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full right-0 mb-2 mr-2 bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden shadow-xl min-w-[160px]"
              >
                {[...MORE_NAV, { href: '/profile', label: 'Profile', Icon: User }].map(({ href, label, Icon }) => {
                  const active = isActive(href, pathname);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-4 py-3 text-[13px] transition-colors ${
                        active
                          ? 'text-[#F7C948] bg-[#F7C948]/8'
                          : 'text-[#6A6A80] hover:text-[#D0D0DA] hover:bg-[#1A1A28]'
                      }`}
                    >
                      <Icon size={16} weight={active ? 'fill' : 'regular'} />
                      <span className="font-medium">{label}</span>
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </>
  );
}
