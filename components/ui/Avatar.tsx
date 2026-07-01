import { dicebearUrl } from '@/lib/avatar';

interface AvatarProps {
  seed: string;
  label: string;
  size?: number;
  className?: string;
}

export function Avatar({ seed, label, size = 28, className = '' }: AvatarProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dicebearUrl(seed)}
      alt={label}
      width={size}
      height={size}
      className={`rounded-full shrink-0 bg-[#1E1E2E] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
