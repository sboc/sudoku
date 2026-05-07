import { useState, useCallback } from 'react';
import type { GeneratedPuzzle } from './usePuzzlePool';
import type { SavedSudokuState } from '../core/persistence';

const eliminateFromPeerNotes = (notes: Set<number>[], cell: number, digit: number): Set<number>[] => {
  const row = Math.floor(cell / 9);
  const col = cell % 9;
  const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
  const result = [...notes];
  const peerSet = new Set<number>();
  for (let i = 0; i < 9; i++) {
    peerSet.add(row * 9 + i);
    peerSet.add(i * 9 + col);
    const br = Math.floor(box / 3) * 3 + Math.floor(i / 3);
    const bc = (box % 3) * 3 + (i % 3);
    peerSet.add(br * 9 + bc);
  }
  peerSet.delete(cell);
  for (const p of peerSet) {
    if (result[p].has(digit)) {
      result[p] = new Set(result[p]);
      result[p].delete(digit);
    }
  }
  return result;
};

interface SudokuState {
  puzzle: number[];
  solution: number[];
  userGrid: number[];
  selected: number | null;
  notes: Set<number>[];
  notesMode: boolean;
  penaltyCount: number;
  failed: boolean;
  solved: boolean;
}

export const useSudoku = (initial: GeneratedPuzzle, saved?: SavedSudokuState) => {
  const [state, setState] = useState<SudokuState>(() => ({
    puzzle: initial.puzzle,
    solution: initial.solution,
    userGrid: saved?.userGrid ?? [...initial.puzzle],
    selected: null,
    notes: saved
      ? saved.notes.map(arr => new Set(arr))
      : Array.from({ length: 81 }, () => new Set<number>()),
    notesMode: saved?.notesMode ?? false,
    penaltyCount: saved?.penaltyCount ?? 0,
    failed: saved?.failed ?? false,
    solved: saved?.solved ?? false,
  }));

  const selectCell = useCallback((cell: number) => {
    setState(s => ({ ...s, selected: s.selected === cell ? null : cell }));
  }, []);

  const toggleNotesMode = useCallback(() => {
    setState(s => ({ ...s, notesMode: !s.notesMode }));
  }, []);

  const enterDigit = useCallback((digit: number) => {
    setState(s => {
      if (s.selected === null || s.puzzle[s.selected] !== 0 || s.solved || s.failed) return s;

      if (s.notesMode) {
        const notes = [...s.notes];
        const cellNotes = new Set(notes[s.selected]);
        if (cellNotes.has(digit)) cellNotes.delete(digit);
        else cellNotes.add(digit);
        notes[s.selected] = cellNotes;
        return { ...s, notes };
      }

      // Reject wrong digits: apply penalty instead of placing
      if (digit !== 0 && digit !== s.solution[s.selected]) {
        const penaltyCount = s.penaltyCount + 1;
        return { ...s, penaltyCount, failed: penaltyCount >= 10 };
      }

      const userGrid = [...s.userGrid];
      userGrid[s.selected] = digit;
      let notes = [...s.notes];
      notes[s.selected] = new Set();
      if (digit !== 0) notes = eliminateFromPeerNotes(notes, s.selected, digit);
      const solved = userGrid.every((v, i) => v === s.solution[i]);
      return { ...s, userGrid, notes, solved, selected: solved ? null : s.selected };
    });
  }, []);

  const fillAllNotes = useCallback(() => {
    setState(s => {
      const notes = s.notes.map((cellNotes, i) => {
        if (s.userGrid[i] !== 0) return cellNotes;
        const row = Math.floor(i / 9);
        const col = i % 9;
        const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
        const used = new Set<number>();
        for (let k = 0; k < 9; k++) {
          used.add(s.userGrid[row * 9 + k]);
          used.add(s.userGrid[k * 9 + col]);
          const br = Math.floor(box / 3) * 3 + Math.floor(k / 3);
          const bc = (box % 3) * 3 + (k % 3);
          used.add(s.userGrid[br * 9 + bc]);
        }
        const candidates = new Set<number>();
        for (let d = 1; d <= 9; d++) if (!used.has(d)) candidates.add(d);
        return candidates;
      });
      return { ...s, notes };
    });
  }, []);

  const clearCell = useCallback(() => {
    setState(s => {
      if (s.selected === null || s.userGrid[s.selected] !== 0 || s.failed || s.solved) return s;
      const userGrid = [...s.userGrid];
      userGrid[s.selected] = 0;
      const notes = [...s.notes];
      notes[s.selected] = new Set();
      return { ...s, userGrid, notes };
    });
  }, []);

  const placeDigitDirect = useCallback((cell: number, digit: number) => {
    setState(s => {
      if (s.puzzle[cell] !== 0 || s.solved || s.failed) return s;
      const userGrid = [...s.userGrid];
      userGrid[cell] = digit;
      let notes = [...s.notes];
      notes[cell] = new Set();
      notes = eliminateFromPeerNotes(notes, cell, digit);
      const solved = userGrid.every((v, i) => v === s.solution[i]);
      return { ...s, userGrid, notes, solved, selected: solved ? null : cell };
    });
  }, []);

  const applyEliminations = useCallback((eliminations: { cell: number; digit: number }[]) => {
    setState(s => {
      const notes = [...s.notes];
      for (const { cell, digit } of eliminations) {
        if (notes[cell].has(digit)) {
          notes[cell] = new Set(notes[cell]);
          notes[cell].delete(digit);
        }
      }
      return { ...s, notes };
    });
  }, []);

  return { state, selectCell, enterDigit, clearCell, toggleNotesMode, fillAllNotes, placeDigitDirect, applyEliminations };
};
