import { describe, it, expect, beforeEach, vi } from 'vitest';
import { localGet, localSet, localRemove, localKeys, loadSave, persistGame } from './persistence';

function makeLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
    clear: () => { store = {}; },
  };
}

const localStorageMock = makeLocalStorageMock();
vi.stubGlobal('localStorage', localStorageMock);

beforeEach(() => {
  localStorageMock.clear();
});

describe('localStorage wrappers', () => {
  it('localSet and localGet round-trip', () => {
    localSet('key1', 'value1');
    expect(localGet('key1')).toBe('value1');
  });

  it('localGet returns null for missing key', () => {
    expect(localGet('nonexistent')).toBeNull();
  });

  it('localRemove deletes a key', () => {
    localSet('key1', 'value1');
    localRemove('key1');
    expect(localGet('key1')).toBeNull();
  });

  it('localKeys returns all stored keys', () => {
    localSet('a', '1');
    localSet('b', '2');
    localSet('c', '3');
    const keys = localKeys();
    expect(keys).toContain('a');
    expect(keys).toContain('b');
    expect(keys).toContain('c');
    expect(keys).toHaveLength(3);
  });

  it('localKeys returns empty array when storage is empty', () => {
    expect(localKeys()).toHaveLength(0);
  });

  it('localKeys returns empty array when localStorage throws', () => {
    vi.stubGlobal('localStorage', { get length() { throw new Error('storage unavailable'); } });
    expect(localKeys()).toEqual([]);
    vi.stubGlobal('localStorage', localStorageMock);
  });
});

function validSaveData() {
  return {
    sudoku: {
      userGrid: Array(81).fill(0),
      notes: Array(81).fill([]),
      notesMode: false,
      penaltyCount: 0,
      failed: false,
      solved: false,
    },
    elapsed: 42,
    difficulty: 'easy',
  };
}

describe('loadSave', () => {
  it('returns null for missing key', () => {
    expect(loadSave('missing')).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    localSet('bad', 'not-json{');
    expect(loadSave('bad')).toBeNull();
  });

  it('returns null for non-object JSON', () => {
    localSet('k', JSON.stringify(42));
    expect(loadSave('k')).toBeNull();
  });

  it('returns null when sudoku field is missing', () => {
    localSet('k', JSON.stringify({ elapsed: 0, difficulty: 'easy' }));
    expect(loadSave('k')).toBeNull();
  });

  it('returns null when userGrid is wrong length', () => {
    const d = validSaveData(); d.sudoku.userGrid = [0, 1];
    localSet('k', JSON.stringify(d));
    expect(loadSave('k')).toBeNull();
  });

  it('returns null when userGrid contains invalid digit', () => {
    const d = validSaveData(); d.sudoku.userGrid = Array(81).fill(10);
    localSet('k', JSON.stringify(d));
    expect(loadSave('k')).toBeNull();
  });

  it('returns null when notes is wrong length', () => {
    const d = validSaveData(); (d.sudoku as Record<string, unknown>).notes = [[]];
    localSet('k', JSON.stringify(d));
    expect(loadSave('k')).toBeNull();
  });

  it('returns null when notes contains non-array', () => {
    const d = validSaveData(); (d.sudoku as Record<string, unknown>).notes = Array(81).fill(1);
    localSet('k', JSON.stringify(d));
    expect(loadSave('k')).toBeNull();
  });

  it('returns null when notes contain out-of-range digits', () => {
    const d = validSaveData(); d.sudoku.notes = Array(81).fill([10]);
    localSet('k', JSON.stringify(d));
    expect(loadSave('k')).toBeNull();
  });

  it('returns null when notesMode is not boolean', () => {
    const d = validSaveData(); (d.sudoku as Record<string, unknown>).notesMode = 'yes';
    localSet('k', JSON.stringify(d));
    expect(loadSave('k')).toBeNull();
  });

  it('returns null when failed is not boolean', () => {
    const d = validSaveData(); (d.sudoku as Record<string, unknown>).failed = 1;
    localSet('k', JSON.stringify(d));
    expect(loadSave('k')).toBeNull();
  });

  it('returns null when penaltyCount is negative', () => {
    const d = validSaveData(); d.sudoku.penaltyCount = -1;
    localSet('k', JSON.stringify(d));
    expect(loadSave('k')).toBeNull();
  });

  it('returns null when elapsed is negative', () => {
    const d = validSaveData(); d.elapsed = -5;
    localSet('k', JSON.stringify(d));
    expect(loadSave('k')).toBeNull();
  });

  it('returns null when difficulty is not a string', () => {
    const d = validSaveData(); (d as Record<string, unknown>).difficulty = 99;
    localSet('k', JSON.stringify(d));
    expect(loadSave('k')).toBeNull();
  });

  it('returns parsed object for valid JSON', () => {
    const data = {
      sudoku: {
        userGrid: Array(81).fill(0),
        notes: Array(81).fill([]),
        notesMode: false,
        penaltyCount: 0,
        failed: false,
        solved: false,
      },
      elapsed: 42,
      difficulty: 'easy',
    };
    localSet('key', JSON.stringify(data));
    const result = loadSave('key');
    expect(result).not.toBeNull();
    expect(result!.elapsed).toBe(42);
    expect(result!.difficulty).toBe('easy');
    expect(result!.sudoku.penaltyCount).toBe(0);
  });
});

describe('persistGame', () => {
  it('saves and reloads game state', () => {
    const userGrid = Array(81).fill(0);
    userGrid[0] = 5;
    const notes = Array.from({ length: 81 }, (_, i) => i === 3 ? new Set([1, 2]) : new Set<number>());

    persistGame({
      state: {
        userGrid,
        notes,
        notesMode: true,
        penaltyCount: 2,
        failed: false,
        solved: false,
      },
      elapsed: 120,
      storageKey: 'sudoku:test',
      difficulty: 'medium',
    });

    const saved = loadSave('sudoku:test');
    expect(saved).not.toBeNull();
    expect(saved!.elapsed).toBe(120);
    expect(saved!.difficulty).toBe('medium');
    expect(saved!.sudoku.userGrid[0]).toBe(5);
    expect(saved!.sudoku.notes[3]).toEqual([1, 2]);
    expect(saved!.sudoku.notesMode).toBe(true);
    expect(saved!.sudoku.penaltyCount).toBe(2);
    expect(saved!.sudoku.solved).toBe(false);
    expect(saved!.sudoku.failed).toBe(false);
  });

  it('serializes Set notes as arrays', () => {
    persistGame({
      state: {
        userGrid: Array(81).fill(0),
        notes: Array.from({ length: 81 }, () => new Set<number>()),
        notesMode: false,
        penaltyCount: 0,
        failed: false,
        solved: true,
      },
      elapsed: 0,
      storageKey: 'sudoku:solved',
      difficulty: 'easy',
    });
    const saved = loadSave('sudoku:solved');
    expect(saved!.sudoku.solved).toBe(true);
    expect(Array.isArray(saved!.sudoku.notes[0])).toBe(true);
  });
});
