'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { getSupabase } from '@/lib/supabase';
import { ChatRoom, ChatMessage } from '@/lib/types';
import { MeProfile } from './CommunityContent';

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function senderLabel(m: ChatMessage, meId: string, knownSenders: Record<string, string>): string {
  if (m.user_id === meId) return 'You';
  if (m.users?.display_username) return m.users.display_username;
  if (m.users?.full_name) return m.users.full_name;
  return knownSenders[m.user_id] || 'Member';
}

export function ChatRooms({ me }: { me: MeProfile }) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Sender names for senders seen in the initial fetch (which joins user info),
  // so realtime-delivered messages (which don't carry the join) can still show
  // a real name instead of falling back to "Member". State, not a ref, since
  // it's read during render.
  const [knownSenders, setKnownSenders] = useState<Record<string, string>>({});

  const fetchRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const res = await fetch('/api/community/rooms');
      const data = await res.json();
      setRooms(Array.isArray(data) ? data : []);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    const run = () => { fetchRooms(); };
    run();
  }, [fetchRooms]);

  useEffect(() => {
    const run = () => {
      if (!activeRoom) return;

      setLoadingMessages(true);
      fetch(`/api/community/rooms/${activeRoom.id}/messages`)
        .then((r) => r.json())
        .then((data: ChatMessage[]) => {
          const list = Array.isArray(data) ? data : [];
          setKnownSenders((prev) => {
            const next = { ...prev };
            list.forEach((m) => {
              const label = m.users?.display_username || m.users?.full_name;
              if (label) next[m.user_id] = label;
            });
            return next;
          });
          setMessages(list);
          setLoadingMessages(false);
        })
        .catch(() => setLoadingMessages(false));
    };
    run();

    if (!activeRoom) return;

    const supabase = getSupabase();
    const channel = supabase
      .channel(`room-${activeRoom.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${activeRoom.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeRoom]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const openRoom = (room: ChatRoom) => setActiveRoom(room);

  const toggleJoin = async (room: ChatRoom, e: React.MouseEvent) => {
    e.stopPropagation();
    const method = room.joined ? 'DELETE' : 'POST';
    setRooms((prev) => prev.map((r) => r.id === room.id
      ? { ...r, joined: !r.joined, member_count: r.member_count + (r.joined ? -1 : 1) }
      : r));
    try {
      await fetch(`/api/community/rooms/${room.id}/join`, { method });
    } catch {
      toast.error('Could not update membership. Try again.');
      fetchRooms();
    }
  };

  const send = async () => {
    if (!input.trim() || sending || !activeRoom) return;
    setSending(true);
    const content = input.trim();
    setInput('');
    try {
      const res = await fetch(`/api/community/rooms/${activeRoom.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Could not send message');
        setInput(content);
      } else if (!rooms.find((r) => r.id === activeRoom.id)?.joined) {
        setRooms((prev) => prev.map((r) => r.id === activeRoom.id ? { ...r, joined: true } : r));
      }
    } catch {
      toast.error('Network error. Try again.');
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  if (activeRoom) {
    return (
      <div className="flex flex-col h-[calc(100vh-260px)] min-h-[420px] bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#1A1A28] shrink-0">
          <button
            onClick={() => setActiveRoom(null)}
            className="text-white/40 hover:text-white/70 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-lg">{activeRoom.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[#E8E8F0]">{activeRoom.name}</p>
            <p className="text-[10px] font-mono text-white/30">{activeRoom.member_count} member{activeRoom.member_count !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-5 h-5 border-2 border-[#F7C948]/30 border-t-[#F7C948] rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[12px] text-white/30 font-mono">No messages yet — say hello 👋</p>
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.user_id === me.id;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className="flex items-baseline gap-2 mb-0.5 px-1">
                      <span className="text-[10px] font-semibold text-white/50">{senderLabel(m, me.id, knownSenders)}</span>
                      <span className="text-[9px] font-mono text-white/20">{timeLabel(m.created_at)}</span>
                    </div>
                    <div className={`rounded-xl px-3.5 py-2 text-[12.5px] leading-relaxed ${
                      mine ? 'bg-[#F7C948]/10 border border-[#F7C948]/20 text-[#F0E8D0]' : 'bg-[#0A0A0F] border border-[#1E1E2E] text-white/80'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-t border-[#1A1A28] shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Message the room…"
            maxLength={2000}
            className="flex-1 bg-[#0A0A0F] border border-[#2A2A3A] rounded-lg px-3 py-2.5 text-[12px] text-[#F0F0F5] placeholder-[#3A3A55] focus:outline-none focus:border-[#F7C948]/40 transition-colors"
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="w-9 h-9 shrink-0 rounded-lg bg-[#F7C948] text-[#0A0A0F] flex items-center justify-center hover:bg-[#E6B830] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9-7-9-7v14zm0 0V5" transform="rotate(90 12 12)" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {loadingRooms ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[110px] bg-[#111118] border border-[#1E1E2E] rounded-xl animate-pulse" />
        ))
      ) : rooms.length === 0 ? (
        <div className="col-span-full bg-[#111118] border border-[#1E1E2E] rounded-xl p-12 text-center">
          <p className="text-[12px] text-white/40 font-mono">No rooms yet</p>
        </div>
      ) : (
        rooms.map((room) => (
          <div
            key={room.id}
            onClick={() => openRoom(room)}
            className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 cursor-pointer hover:border-[#2A2A3A] transition-colors flex flex-col gap-3"
          >
            <div className="flex items-start justify-between">
              <span className="text-2xl">{room.icon}</span>
              <button
                onClick={(e) => toggleJoin(room, e)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  room.joined
                    ? 'border-[#1E1E2E] text-white/40 hover:border-[#2A2A3A]'
                    : 'border-[#F7C948]/30 text-[#F7C948] hover:border-[#F7C948]/50'
                }`}
              >
                {room.joined ? 'Joined' : 'Join'}
              </button>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#E8E8F0] mb-1">{room.name}</p>
              <p className="text-[11px] text-white/40 leading-snug">{room.description}</p>
            </div>
            <p className="text-[10px] font-mono text-white/25 mt-auto">
              {room.member_count} member{room.member_count !== 1 ? 's' : ''}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
