'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { ChatRooms } from '@/components/community/ChatRooms';
import { Leaderboard } from '@/components/community/Leaderboard';
import { TipsAndInfo } from '@/components/community/TipsAndInfo';

export interface MeProfile {
  id: string;
  display_username: string | null;
  show_on_leaderboard: boolean;
  avatar_url: string | null;
  full_name: string | null;
}

type Tab = 'rooms' | 'leaderboard' | 'tips';

const TABS: { id: Tab; label: string }[] = [
  { id: 'rooms', label: 'Chat Rooms' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'tips', label: 'Tips & Info' },
];

export function CommunityContent({ me }: { me: MeProfile }) {
  const [tab, setTab] = useState<Tab>('rooms');

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Community" subtitle="Connect with other idea builders" />

      <main className="flex-1 px-4 lg:px-8 pt-10 pb-10 max-w-6xl mx-auto w-full flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-6 border-b border-[#1E1E2E]">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-[12px] font-semibold transition-colors relative cursor-pointer ${
                tab === t.id ? 'text-[#F7C948]' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F7C948] rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0">
          {tab === 'rooms' && <ChatRooms me={me} />}
          {tab === 'leaderboard' && <Leaderboard me={me} />}
          {tab === 'tips' && <TipsAndInfo />}
        </div>
      </main>
    </div>
  );
}
