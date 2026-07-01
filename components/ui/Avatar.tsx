import { avatarColor, avatarInitial } from '@/lib/avatar';

interface AvatarProps {
  seed: string;
  label: string;
  size?: number;
  className?: string;
}

export function Avatar({ seed, label, size = 28, className = '' }: AvatarProps) {
  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 font-semibold text-white ${className}`}
      style={{ width: size, height: size, backgroundColor: avatarColor(seed), fontSize: size * 0.42 }}
    >
      {avatarInitial(label)}
    </div>
  );
}
