export interface SavedSudokuState {
  userGrid: number[];
  notes: number[][];
  notesMode: boolean;
  penaltyCount: number;
  failed: boolean;
  solved: boolean;
}

export function localGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function localSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* unavailable */ }
}

export function localRemove(key: string): void {
  try { localStorage.removeItem(key); } catch { /* unavailable */ }
}

export function localKeys(): string[] {
  try {
    return Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i) ?? '').filter(Boolean);
  } catch { return []; }
}

export interface PersistedGame {
  sudoku: SavedSudokuState;
  elapsed: number;
  difficulty: string;
}

export function loadSave(key: string): PersistedGame | null {
  const raw = localGet(key);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (!p || typeof p !== 'object') return null;
    if (!p.sudoku || !Array.isArray(p.sudoku.userGrid) || p.sudoku.userGrid.length !== 81) return null;
    if (!Array.isArray(p.sudoku.notes) || p.sudoku.notes.length !== 81) return null;
    if (!p.sudoku.notes.every(Array.isArray)) return null;
    return p as PersistedGame;
  } catch { return null; }
}

export function persistGame({ state, elapsed, storageKey, difficulty }: {
  state: { userGrid: number[]; notes: Set<number>[]; notesMode: boolean; penaltyCount: number; failed: boolean; solved: boolean };
  elapsed: number;
  storageKey: string;
  difficulty: string;
}) {
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
}
