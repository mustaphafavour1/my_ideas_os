// Deterministic per-user avatar (color + initial) derived from a stable seed
// (user id) — no image storage, no upload flow, every user still gets a
// distinct, consistent look everywhere they appear.
const COLORS = ['#F7C948', '#7A7AF0', '#4CAF82', '#E07B54', '#5B9BD5', '#C06830', '#8A6DF2', '#4ADE80'];

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return COLORS[hash % COLORS.length];
}

export function avatarInitial(label: string): string {
  return (label.trim()[0] || '?').toUpperCase();
}
