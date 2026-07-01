// Generated per-user avatar for public/community surfaces (leaderboard, chat)
// where we don't want to store or require a real photo — DiceBear renders
// a consistent SVG avatar straight from a seed, no upload or storage needed.
const DICEBEAR_STYLE = 'shapes';

export function dicebearUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/${DICEBEAR_STYLE}/svg?seed=${encodeURIComponent(seed)}`;
}
