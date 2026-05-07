export const HINT_PEEK_COST = 15;
export const HINT_REVEAL_COST = 60;
export const HINT_APPLY_COST = 120;

export const penaltyLabel = (s: number): string => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `+${s}s`;
  if (r === 0) return `+${m}m`;
  return `+${m}m${r}s`;
};

export const formatSolveTime = (s: number): string => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} ${h === 1 ? 'hr' : 'hrs'}`);
  if (m > 0) parts.push(`${m} ${m === 1 ? 'min' : 'mins'}`);
  if (sec > 0 || parts.length === 0) parts.push(`${sec} ${sec === 1 ? 'sec' : 'secs'}`);
  if (parts.length === 1) return parts[0];
  return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
};

export const formatTime = (s: number): string => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};
