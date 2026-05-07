export const HINT_PEEK_COST = 15;
export const HINT_REVEAL_COST = 60;
export const HINT_APPLY_COST = 120;

export function penaltyLabel(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `+${s}s`;
  if (r === 0) return `+${m}m`;
  return `+${m}m${r}s`;
}

export function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
