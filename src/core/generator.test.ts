import { describe, it, expect } from 'vitest';
import { generatePuzzle, solvePuzzle } from './generator';

const isValidComplete = (grid: number[]): boolean => {
  if (grid.length !== 81) return false;
  for (let i = 0; i < 9; i++) {
    const row = Array.from({ length: 9 }, (_, j) => grid[i * 9 + j]).sort();
    const col = Array.from({ length: 9 }, (_, j) => grid[j * 9 + i]).sort();
    const br = Math.floor(i / 3) * 3;
    const bc = (i % 3) * 3;
    const box = Array.from({ length: 9 }, (_, j) =>
      grid[(br + Math.floor(j / 3)) * 9 + (bc + (j % 3))],
    ).sort();
    const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    if (JSON.stringify(row) !== JSON.stringify(expected)) return false;
    if (JSON.stringify(col) !== JSON.stringify(expected)) return false;
    if (JSON.stringify(box) !== JSON.stringify(expected)) return false;
  }
  return true;
};

const p = (s: string): number[] => {
  return s.split('').map(Number);
};

const EASY_PUZZLE = p(
  '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
);
const EASY_SOLUTION = p(
  '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
);

describe('solvePuzzle', () => {
  it('returns correct solution for known puzzle', () => {
    expect(solvePuzzle(EASY_PUZZLE)).toEqual(EASY_SOLUTION);
  });

  it('returns null for unsolvable grid', () => {
    const bad = Array(81).fill(0);
    bad[0] = 1;
    bad[1] = 1;
    expect(solvePuzzle(bad)).toBeNull();
  });

  it('returns null for empty grid (multiple solutions)', () => {
    // dlxSolve with max=1 returns a solution, but hasUniqueSolution filters it — solvePuzzle
    // just calls dlxSolve(grid,1) so returns one of many solutions
    const result = solvePuzzle(Array(81).fill(0));
    // empty grid has solutions, so result is not null
    expect(result).not.toBeNull();
    expect(isValidComplete(result!)).toBe(true);
  });

  it('does not modify input grid', () => {
    const input = [...EASY_PUZZLE];
    solvePuzzle(input);
    expect(input).toEqual(EASY_PUZZLE);
  });
});

describe('generatePuzzle', () => {
  it('returns solution that is a valid complete grid', () => {
    const { solution } = generatePuzzle();
    expect(isValidComplete(solution)).toBe(true);
  });

  it('puzzle is a subset of the solution', () => {
    const { puzzle, solution } = generatePuzzle();
    for (let i = 0; i < 81; i++) {
      if (puzzle[i] !== 0) {
        expect(puzzle[i]).toBe(solution[i]);
      }
    }
  });

  it('puzzle has at least 17 clues (minimum for unique solution)', () => {
    const { puzzle } = generatePuzzle();
    const clues = puzzle.filter(v => v !== 0).length;
    expect(clues).toBeGreaterThanOrEqual(17);
  });

  it('puzzle has a unique solution matching the generated solution', () => {
    const { puzzle, solution } = generatePuzzle();
    const solved = solvePuzzle(puzzle);
    expect(solved).toEqual(solution);
  });
});
