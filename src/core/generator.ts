import { dlxSolve, hasUniqueSolution } from './dlx';

const shuffle = <T>(arr: T[]): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const generateFullGrid = (): number[] => {
  const grid = new Array(81).fill(0);
  fillGrid(grid);
  return grid;
};

const fillGrid = (grid: number[]): boolean => {
  const empty = grid.indexOf(0);
  if (empty === -1) return true;

  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (const d of digits) {
    if (isValid(grid, empty, d)) {
      grid[empty] = d;
      if (fillGrid(grid)) return true;
      grid[empty] = 0;
    }
  }
  return false;
};

const isValid = (grid: number[], cell: number, d: number): boolean => {
  const r = Math.floor(cell / 9);
  const c = cell % 9;
  const box = Math.floor(r / 3) * 3 + Math.floor(c / 3);

  for (let i = 0; i < 9; i++) {
    if (grid[r * 9 + i] === d) return false;
    if (grid[i * 9 + c] === d) return false;
    const br = Math.floor(box / 3) * 3 + Math.floor(i / 3);
    const bc = (box % 3) * 3 + (i % 3);
    if (grid[br * 9 + bc] === d) return false;
  }
  return true;
};

export const generatePuzzle = (): { puzzle: number[]; solution: number[] } => {
  const solution = generateFullGrid();
  const puzzle = [...solution];

  const positions = shuffle([...Array(81).keys()]);

  for (const pos of positions) {
    const backup = puzzle[pos];
    puzzle[pos] = 0;
    if (!hasUniqueSolution(puzzle)) {
      puzzle[pos] = backup;
    }
  }

  return { puzzle, solution };
};

export const solvePuzzle = (grid: number[]): number[] | null => {
  const solutions = dlxSolve(grid, 1);
  return solutions.length > 0 ? solutions[0] : null;
};
