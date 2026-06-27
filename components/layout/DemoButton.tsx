'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function DemoButton() {
  const [loading, setLoading] = useState<'seed' | 'clear' | null>(null);
  const router = useRouter();

  const seed = async () => {
    setLoading('seed');
    try {
      const res = await fetch('/api/demo', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to seed demo');
      toast.success(`Demo loaded — ${data.seeded} ideas added`, { duration: 4000 });
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const clear = async () => {
    setLoading('clear');
    try {
      const res = await fetch('/api/demo', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to clear demo');
      toast.success(`Demo cleared — ${data.cleared} ideas removed`, { duration: 4000 });
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="px-5 py-3 border-t border-[#1E1E2E]">
      <p className="text-[#4A4A60] text-[9px] font-mono uppercase tracking-widest mb-2">Demo</p>
      <div className="flex gap-1.5">
        <button
          onClick={seed}
          disabled={!!loading}
          className="flex-1 text-[10px] font-mono text-[#4A4A60] hover:text-[#F7C948] hover:bg-[#F7C948]/8 border border-[#1E1E2E] hover:border-[#F7C948]/20 rounded-md py-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading === 'seed' ? '…' : 'Load'}
        </button>
        <button
          onClick={clear}
          disabled={!!loading}
          className="flex-1 text-[10px] font-mono text-[#4A4A60] hover:text-[#F87171] hover:bg-[#F87171]/8 border border-[#1E1E2E] hover:border-[#F87171]/20 rounded-md py-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading === 'clear' ? '…' : 'Clear'}
        </button>
      </div>
    </div>
  );
}
