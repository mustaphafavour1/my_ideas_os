import { TopBar } from '@/components/layout/TopBar';

export default function DemoCommunityPage() {
  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Community" subtitle="Connect with other idea builders" />
      <main className="flex-1 flex flex-col items-center justify-center gap-4 pb-20">
        <div className="w-10 h-10 rounded-xl bg-[#111118] border border-[#1E1E2E] flex items-center justify-center">
          <span className="text-[#F7C948] text-lg">✦</span>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-2">Coming Soon</p>
          <p className="text-[13px] font-semibold text-[#D0D0DA] mb-1">The community is being built</p>
          <p className="text-[11px] text-[#3A3A55] font-mono max-w-xs">
            A space to share ideas, find collaborators, and learn from other builders.
          </p>
        </div>
      </main>
    </div>
  );
}
