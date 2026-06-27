'use client';

interface GradeRingProps {
  grade: number | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function GradeRing({ grade, size = 'md', showLabel = true }: GradeRingProps) {
  const sizes = { sm: 36, md: 52, lg: 72 };
  const strokes = { sm: 3, md: 4, lg: 5 };
  const dim = sizes[size];
  const stroke = strokes[size];
  const r = (dim - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const pct = grade ? ((grade - 1) / 4) : 0;
  const dash = pct * c;

  const color =
    !grade ? '#4A4A60' :
    grade >= 4 ? '#4ADE80' :
    grade >= 3 ? '#F7C948' :
    '#F87171';

  const fontSize = size === 'sm' ? 9 : size === 'md' ? 12 : 16;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: dim, height: dim }}>
      <svg width={dim} height={dim} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={r}
          fill="none"
          stroke="#1E1E2E"
          strokeWidth={stroke}
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
      </svg>
      {showLabel && (
        <span
          className="absolute font-mono font-semibold"
          style={{ fontSize, color, lineHeight: 1 }}
        >
          {grade ? grade.toFixed(1) : '—'}
        </span>
      )}
    </div>
  );
}
