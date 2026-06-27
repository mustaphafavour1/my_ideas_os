'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function DemoButton() {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/demo')
      .then((r) => r.json())
      .then((d) => setActive(!!d.active))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const toggle = async () => {
    setLoading(true);
    try {
      if (active) {
        const res = await fetch('/api/demo', { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        toast.success(`Demo cleared — ${data.cleared} ideas removed`);
        setActive(false);
      } else {
        const res = await fetch('/api/demo', { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        toast.success(`Demo loaded — ${data.seeded} ideas added`);
        setActive(true);
      }
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) return null;

  return (
    <div className="px-5 py-3 border-t border-[#1E1E2E]">
      <button
        onClick={toggle}
        disabled={loading}
        title={active ? 'Click to clear demo data' : 'Click to load demo ideas'}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-mono transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          active
            ? 'bg-[#F7C948]/12 border border-[#F7C948]/30 text-[#F7C948]'
            : 'bg-transparent border border-[#1E1E2E] text-[#4A4A60] hover:text-[#8888A0] hover:border-[#2A2A3A]'
        }`}
      >
        <span>Demo mode</span>
        <span className={`w-2 h-2 rounded-full transition-colors ${
          loading ? 'bg-[#4A4A60] animate-pulse' : active ? 'bg-[#F7C948]' : 'bg-[#2A2A3A]'
        }`} />
      </button>
    </div>
  );
}
