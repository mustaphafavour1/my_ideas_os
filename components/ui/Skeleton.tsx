'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-[#1E1E2E] rounded-md ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex gap-4 py-3 border-b border-[#1E1E2E]">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}
