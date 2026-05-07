export interface SavedSudokuState {
  userGrid: number[];
  notes: number[][];
  notesMode: boolean;
  penaltyCount: number;
  failed: boolean;
  solved: boolean;
}

export const localGet = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch { return null; }
};

export const localSet = (key: string, value: string): void => {
  try { localStorage.setItem(key, value); } catch { /* unavailable */ }
};

export const localRemove = (key: string): void => {
  try { localStorage.removeItem(key); } catch { /* unavailable */ }
};

export const localKeys = (): string[] => {
  try {
    return Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i) ?? '').filter(Boolean);
  } catch { return []; }
};

export interface PersistedGame {
  sudoku: SavedSudokuState;
  elapsed: number;
  difficulty: string;
}

export const loadSave = (key: string): PersistedGame | null => {
  const raw = localGet(key);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (!p || typeof p !== 'object') return null;
    const s = p.sudoku;
    if (!s || !Array.isArray(s.userGrid) || s.userGrid.length !== 81) return null;
    if (!s.userGrid.every((v: unknown) => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 9)) return null;
    if (!Array.isArray(s.notes) || s.notes.length !== 81) return null;
    if (!s.notes.every(Array.isArray)) return null;
    if (!s.notes.every((arr: unknown[]) => arr.every(n => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 9))) return null;
    if (typeof s.notesMode !== 'boolean') return null;
    if (!Number.isInteger(s.penaltyCount) || (s.penaltyCount as number) < 0) return null;
    if (typeof s.failed !== 'boolean' || typeof s.solved !== 'boolean') return null;
    if (typeof p.elapsed !== 'number' || (p.elapsed as number) < 0) return null;
    if (typeof p.difficulty !== 'string') return null;
    return p as PersistedGame;
  } catch { return null; }
};

export const persistGame = ({ state, elapsed, storageKey, difficulty }: {
  state: { userGrid: number[]; notes: Set<number>[]; notesMode: boolean; penaltyCount: number; failed: boolean; solved: boolean };
  elapsed: number;
  storageKey: string;
  difficulty: string;
}) => {
  const data: PersistedGame = {
    sudoku: {
      userGrid: state.userGrid,
      notes: state.notes.map(s => [...s]),
      notesMode: state.notesMode,
      penaltyCount: state.penaltyCount,
      failed: state.failed,
      solved: state.solved,
    },
    elapsed,
    difficulty,
  };
  localSet(storageKey, JSON.stringify(data));
};
