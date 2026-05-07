import { describe, it, expect } from 'vitest';
import { dlxSolve, hasUniqueSolution } from './dlx';

// Puzzle string → number array helper
const p = (s: string): number[] => {
  return s.split('').map(Number);
};

// Minimal valid puzzle (many givens, one solution)
const EASY_PUZZLE = p(
  '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
);
const EASY_SOLUTION = p(
  '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
);

// Near-complete grid with one empty cell
const NEAR_COMPLETE = [...EASY_SOLUTION];
NEAR_COMPLETE[80] = 0; // remove last cell (9)

// Empty grid has many solutions
const EMPTY_GRID = Array(81).fill(0);

describe('dlxSolve', () => {
  it('solves a classic easy puzzle', () => {
    const solutions = dlxSolve(EASY_PUZZLE, 1);
    expect(solutions).toHaveLength(1);
    expect(solutions[0]).toEqual(EASY_SOLUTION);
  });

  it('fills one missing cell', () => {
    const solutions = dlxSolve(NEAR_COMPLETE, 1);
    expect(solutions).toHaveLength(1);
    expect(solutions[0][80]).toBe(9);
    expect(solutions[0]).toEqual(EASY_SOLUTION);
  });

  it('returns empty for unsolvable grid', () => {
    // Place conflicting digit: set cell 0 to 3 (row already has 5,3,0... 5 is at index 0)
    const conflict = Array(81).fill(0);
    conflict[0] = 1;
    conflict[1] = 1; // same row, same digit → no solution
    expect(dlxSolve(conflict, 1)).toHaveLength(0);
  });

  it('finds multiple solutions for ambiguous puzzle', () => {
    const solutions = dlxSolve(EMPTY_GRID, 2);
    expect(solutions.length).toBeGreaterThanOrEqual(2);
  });

  it('respects max solutions limit', () => {
    const solutions = dlxSolve(EMPTY_GRID, 1);
    expect(solutions).toHaveLength(1);
  });

  it('returned solutions are valid complete grids', () => {
    const [sol] = dlxSolve(EASY_PUZZLE, 1);
    expect(sol).toHaveLength(81);
    for (let i = 0; i < 81; i++) {
      expect(sol[i]).toBeGreaterThanOrEqual(1);
      expect(sol[i]).toBeLessThanOrEqual(9);
    }
    // Every row, col, box uses 1-9 exactly once
    for (let i = 0; i < 9; i++) {
      const row = Array.from({ length: 9 }, (_, j) => sol[i * 9 + j]);
      expect(row.sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      const col = Array.from({ length: 9 }, (_, j) => sol[j * 9 + i]);
      expect(col.sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      const br = Math.floor(i / 3) * 3;
      const bc = (i % 3) * 3;
      const box = Array.from({ length: 9 }, (_, j) =>
        sol[(br + Math.floor(j / 3)) * 9 + (bc + (j % 3))],
      );
      expect(box.sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
  });
});

describe('hasUniqueSolution', () => {
  it('returns true for puzzle with unique solution', () => {
    expect(hasUniqueSolution(EASY_PUZZLE)).toBe(true);
  });

  it('returns false for empty grid', () => {
    expect(hasUniqueSolution(EMPTY_GRID)).toBe(false);
  });

  it('returns true for near-complete grid', () => {
    expect(hasUniqueSolution(NEAR_COMPLETE)).toBe(true);
  });
});
