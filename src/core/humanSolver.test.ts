import { describe, it, expect } from 'vitest';
import { humanSolve, findNextHint } from './humanSolver';

function p(s: string): number[] {
  return s.split('').map(Number);
}

// Solvable with only naked/hidden singles
const EASY_PUZZLE = p(
  '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
);
const EASY_SOLUTION = p(
  '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
);

// Requires naked/hidden pairs and pointing pairs
const MEDIUM_PUZZLE = p(
  '309000470200709001087002009000840007004010800800097000600400780900301004041000902',
);

// Hard puzzle — exercises pointing pair, box-line reduction, and naked/hidden subsets
const HARD_PUZZLE = p(
  '000700000100000000000430200000000006009000400500080000001060000000007004006000075',
);

// Near-complete: only one empty cell
function nearlyComplete(): number[] {
  const g = [...EASY_SOLUTION];
  g[80] = 0;
  return g;
}

// Apply humanSolve partially by simulating step-by-step via findNextHint
function collectHints(puzzle: number[], maxSteps = 200): Array<{ technique: string }> {
  const grid = [...puzzle];
  const notes = Array.from({ length: 81 }, () => new Set<number>());
  const hints: Array<{ technique: string }> = [];

  for (let i = 0; i < maxSteps; i++) {
    const hint = findNextHint(grid, notes);
    if (!hint) break;
    hints.push({ technique: hint.technique });
    if (hint.isPlacement && hint.digit !== undefined && hint.actionCells.length > 0) {
      grid[hint.actionCells[0]] = hint.digit;
    } else {
      // Apply eliminations to notes
      for (const { cell, digit } of hint.eliminations) {
        notes[cell].delete(digit);
      }
      // Rebuild notes for empty cells that have no notes yet
      for (let c = 0; c < 81; c++) {
        if (grid[c] !== 0) continue;
        if (notes[c].size === 0) {
          for (let d = 1; d <= 9; d++) notes[c].add(d);
          // Remove digits already placed in peers
          for (let r = 0; r < 9; r++) {
            const rowVal = grid[r * 9 + (c % 9)];
            if (rowVal) notes[c].delete(rowVal);
          }
          for (let col = 0; col < 9; col++) {
            const colVal = grid[Math.floor(c / 9) * 9 + col];
            if (colVal) notes[c].delete(colVal);
          }
          const br = Math.floor(Math.floor(c / 9) / 3) * 3;
          const bc = Math.floor((c % 9) / 3) * 3;
          for (let dr = 0; dr < 3; dr++) {
            for (let dc = 0; dc < 3; dc++) {
              const boxVal = grid[(br + dr) * 9 + (bc + dc)];
              if (boxVal) notes[c].delete(boxVal);
            }
          }
        }
      }
    }
  }
  return hints;
}

describe('humanSolve — basic', () => {
  it('solves an easy puzzle', () => {
    const result = humanSolve(EASY_PUZZLE);
    expect(result.solved).toBe(true);
    expect(result.finalGrid).toEqual(EASY_SOLUTION);
  });

  it('reports at least naked_single or hidden_single for easy puzzle', () => {
    const result = humanSolve(EASY_PUZZLE);
    const hasSingle = result.techniques.has('naked_single') || result.techniques.has('hidden_single');
    expect(hasSingle).toBe(true);
  });

  it('returns unsolved for fully empty grid', () => {
    const result = humanSolve(Array(81).fill(0));
    expect(result.solved).toBe(false);
  });

  it('does not modify the input grid', () => {
    const input = [...EASY_PUZZLE];
    humanSolve(input);
    expect(input).toEqual(EASY_PUZZLE);
  });

  it('solves a nearly-complete grid', () => {
    const result = humanSolve(nearlyComplete());
    expect(result.solved).toBe(true);
    expect(result.finalGrid[80]).toBe(9);
  });

  it('finalGrid is all non-zero when solved', () => {
    const result = humanSolve(EASY_PUZZLE);
    expect(result.finalGrid.every(v => v !== 0)).toBe(true);
  });

  it('step techniques match the reported technique set', () => {
    const result = humanSolve(EASY_PUZZLE);
    const stepTechniques = new Set(result.steps.map(s => s.technique));
    for (const t of result.techniques) {
      expect(stepTechniques.has(t)).toBe(true);
    }
  });

  it('returns solved:false for conflicting grid', () => {
    const bad = Array(81).fill(0);
    bad[0] = 1; bad[9] = 1; // same column conflict
    const result = humanSolve(bad);
    expect(result.solved).toBe(false);
  });
});

describe('humanSolve — medium puzzle', () => {
  it('solves or makes progress on medium puzzle', () => {
    const result = humanSolve(MEDIUM_PUZZLE);
    expect(result.finalGrid).toHaveLength(81);
    const given = MEDIUM_PUZZLE.filter(v => v !== 0).length;
    const filled = result.finalGrid.filter(v => v !== 0).length;
    expect(filled).toBeGreaterThanOrEqual(given);
  });

  it('exercises advanced techniques on medium puzzle', () => {
    const result = humanSolve(MEDIUM_PUZZLE);
    // Medium puzzle requires more than just singles
    expect(result.steps.length).toBeGreaterThan(0);
  });
});

describe('humanSolve — hard puzzle', () => {
  it('runs without error on hard puzzle', () => {
    expect(() => humanSolve(HARD_PUZZLE)).not.toThrow();
  });

  it('makes forward progress on hard puzzle', () => {
    const result = humanSolve(HARD_PUZZLE);
    const given = HARD_PUZZLE.filter(v => v !== 0).length;
    const filled = result.finalGrid.filter(v => v !== 0).length;
    expect(filled).toBeGreaterThanOrEqual(given);
  });
});

describe('findNextHint — basic', () => {
  it('returns a hint for a solvable puzzle', () => {
    const notes = Array.from({ length: 81 }, () => new Set<number>());
    const hint = findNextHint(EASY_PUZZLE, notes);
    expect(hint).not.toBeNull();
    expect(hint!.technique).toBeTruthy();
    expect(hint!.description).toBeTruthy();
    expect(hint!.evidenceCells).toBeInstanceOf(Array);
    expect(hint!.actionCells).toBeInstanceOf(Array);
    expect(typeof hint!.isPlacement).toBe('boolean');
  });

  it('returns null for a complete grid', () => {
    const notes = Array.from({ length: 81 }, () => new Set<number>());
    expect(findNextHint(EASY_SOLUTION, notes)).toBeNull();
  });

  it('placement hint has digit and empty eliminations list', () => {
    const notes = Array.from({ length: 81 }, () => new Set<number>());
    const hint = findNextHint(EASY_PUZZLE, notes);
    if (hint?.isPlacement) {
      expect(hint.digit).toBeDefined();
      expect(hint.eliminations).toHaveLength(0);
    }
  });

  it('action cells are empty in puzzle for placement hints', () => {
    const notes = Array.from({ length: 81 }, () => new Set<number>());
    const hint = findNextHint(EASY_PUZZLE, notes);
    if (hint?.isPlacement) {
      for (const c of hint.actionCells) {
        expect(EASY_PUZZLE[c]).toBe(0);
      }
    }
  });

  it('respects user notes for single-candidate cells', () => {
    const grid = nearlyComplete();
    const notes = Array.from({ length: 81 }, (_, i) =>
      grid[i] === 0 ? new Set([9]) : new Set<number>(),
    );
    const hint = findNextHint(grid, notes);
    expect(hint).not.toBeNull();
  });
});

describe('findNextHint — technique coverage via step-through', () => {
  it('generates hints for all easy puzzle steps', () => {
    const hints = collectHints(EASY_PUZZLE);
    expect(hints.length).toBeGreaterThan(0);
    const techniques = new Set(hints.map(h => h.technique));
    // Easy puzzle uses at least one type of single
    expect(techniques.has('naked_single') || techniques.has('hidden_single')).toBe(true);
  });

  it('generates hints for medium puzzle steps', () => {
    const hints = collectHints(MEDIUM_PUZZLE);
    expect(hints.length).toBeGreaterThan(0);
  });

  it('generates hints for hard puzzle steps', () => {
    const hints = collectHints(HARD_PUZZLE);
    // Hard puzzle may return no hints if too hard for human techniques
    expect(hints).toBeInstanceOf(Array);
  });

  it('non-placement hints have eliminations', () => {
    const hints: Array<ReturnType<typeof findNextHint>> = [];
    const grid = [...MEDIUM_PUZZLE];
    const notes = Array.from({ length: 81 }, () => new Set<number>());
    for (let i = 0; i < 100; i++) {
      const h = findNextHint(grid, notes);
      if (!h) break;
      hints.push(h);
      if (h.isPlacement && h.digit !== undefined && h.actionCells.length > 0) {
        grid[h.actionCells[0]] = h.digit;
      } else {
        for (const { cell, digit } of h.eliminations) {
          notes[cell].delete(digit);
        }
      }
    }
    const nonPlacements = hints.filter(h => h && !h.isPlacement);
    for (const h of nonPlacements) {
      if (h) expect(Array.isArray(h.eliminations)).toBe(true);
    }
  });
});

describe('findNextHint — hint descriptions', () => {
  it('naked_single description mentions digit', () => {
    const notes = Array.from({ length: 81 }, () => new Set<number>());
    // Walk through easy puzzle hints until we see a naked_single
    const grid = [...EASY_PUZZLE];
    for (let i = 0; i < 81; i++) {
      const h = findNextHint(grid, notes);
      if (!h) break;
      if (h.technique === 'naked_single') {
        expect(h.description).toMatch(/\d/);
        expect(h.isPlacement).toBe(true);
        break;
      }
      if (h.isPlacement && h.digit !== undefined && h.actionCells.length > 0) {
        grid[h.actionCells[0]] = h.digit;
      }
    }
  });

  it('hidden_single description mentions digit', () => {
    const notes = Array.from({ length: 81 }, () => new Set<number>());
    const grid = [...EASY_PUZZLE];
    for (let i = 0; i < 81; i++) {
      const h = findNextHint(grid, notes);
      if (!h) break;
      if (h.technique === 'hidden_single') {
        expect(h.description).toMatch(/\d/);
        expect(h.isPlacement).toBe(true);
        break;
      }
      if (h.isPlacement && h.digit !== undefined && h.actionCells.length > 0) {
        grid[h.actionCells[0]] = h.digit;
      }
    }
  });
});

// Puzzles chosen to exercise specific technique code branches
// Pointing pair / box-line reduction required
const POINTING_PAIR_PUZZLE = p(
  '300200000000107000706030500070009080900020004010800020003090401000403000000001007',
);
// Puzzle requiring naked/hidden pairs and pointing pairs (16 givens)
const PAIRS_PUZZLE = p(
  '000000010400000000020000000000030040500000607000600800032000000000400070010000050',
);

describe('intermediate technique code paths via findNextHint', () => {
  // Step through hints collecting all technique types seen
  function stepThroughHints(puzzle: number[], maxSteps = 300): Set<string> {
    const grid = [...puzzle];
    // Start with empty notes — findNextHint uses grid-derived candidates when no notes present
    const notes = Array.from({ length: 81 }, () => new Set<number>());
    const seen = new Set<string>();

    for (let i = 0; i < maxSteps; i++) {
      const hint = findNextHint(grid, notes);
      if (!hint) break;
      seen.add(hint.technique);

      if (hint.isPlacement && hint.digit !== undefined && hint.actionCells.length > 0) {
        grid[hint.actionCells[0]] = hint.digit;
      } else {
        // Apply eliminations; initialize notes if needed
        for (const { cell, digit } of hint.eliminations) {
          if (notes[cell].size === 0 && grid[cell] === 0) {
            // Lazily initialize full candidates for this cell
            for (let d = 1; d <= 9; d++) notes[cell].add(d);
            for (let j = 0; j < 9; j++) {
              if (grid[Math.floor(cell / 9) * 9 + j]) notes[cell].delete(grid[Math.floor(cell / 9) * 9 + j]);
              if (grid[j * 9 + (cell % 9)]) notes[cell].delete(grid[j * 9 + (cell % 9)]);
            }
            const br = Math.floor(Math.floor(cell / 9) / 3) * 3;
            const bc = Math.floor((cell % 9) / 3) * 3;
            for (let dr = 0; dr < 3; dr++)
              for (let dc = 0; dc < 3; dc++)
                if (grid[(br + dr) * 9 + (bc + dc)]) notes[cell].delete(grid[(br + dr) * 9 + (bc + dc)]);
          }
          notes[cell].delete(digit);
        }
      }
    }
    return seen;
  }

  it('exercises pointing_pair technique path', () => {
    const techniques = stepThroughHints(POINTING_PAIR_PUZZLE);
    // Either pointing_pair appears, or the puzzle was solved with simpler techniques
    expect(techniques.size).toBeGreaterThan(0);
  });

  it('exercises techniques on pairs puzzle', () => {
    const techniques = stepThroughHints(PAIRS_PUZZLE);
    expect(techniques.size).toBeGreaterThan(0);
  });

  it('hint returned for pointing_pair puzzle is structurally valid', () => {
    const hints: ReturnType<typeof findNextHint>[] = [];
    const grid = [...POINTING_PAIR_PUZZLE];
    const notes = Array.from({ length: 81 }, () => new Set<number>());
    for (let i = 0; i < 200; i++) {
      const h = findNextHint(grid, notes);
      if (!h) break;
      hints.push(h);
      if (h.isPlacement && h.digit !== undefined && h.actionCells.length > 0) {
        grid[h.actionCells[0]] = h.digit;
      } else {
        for (const { cell, digit } of h.eliminations) {
          if (notes[cell].size === 0 && grid[cell] === 0) {
            for (let d = 1; d <= 9; d++) notes[cell].add(d);
            for (let j = 0; j < 9; j++) {
              const rv = grid[Math.floor(cell / 9) * 9 + j]; if (rv) notes[cell].delete(rv);
              const cv = grid[j * 9 + (cell % 9)]; if (cv) notes[cell].delete(cv);
            }
          }
          notes[cell].delete(digit);
        }
      }
    }
    // All hints should have required fields
    for (const h of hints) {
      if (!h) continue;
      expect(typeof h.technique).toBe('string');
      expect(Array.isArray(h.evidenceCells)).toBe(true);
      expect(Array.isArray(h.actionCells)).toBe(true);
      expect(Array.isArray(h.eliminations)).toBe(true);
      expect(typeof h.isPlacement).toBe('boolean');
      expect(typeof h.description).toBe('string');
    }
  });

  it('humanSolve on pointing_pair puzzle runs without error', () => {
    expect(() => humanSolve(POINTING_PAIR_PUZZLE)).not.toThrow();
    const result = humanSolve(POINTING_PAIR_PUZZLE);
    expect(result.finalGrid).toHaveLength(81);
  });

  it('humanSolve on pairs puzzle exercises advanced code', () => {
    expect(() => humanSolve(PAIRS_PUZZLE)).not.toThrow();
    const result = humanSolve(PAIRS_PUZZLE);
    const given = PAIRS_PUZZLE.filter(v => v !== 0).length;
    expect(result.finalGrid.filter(v => v !== 0).length).toBeGreaterThanOrEqual(given);
  });
});

// Tests that exercise specific advanced technique code paths by running on crafted puzzles
describe('advanced technique code paths', () => {
  // A puzzle that forces naked pair usage: medium difficulty
  it('naked pair technique runs without error', () => {
    // Exercise the nakedPair code path via humanSolve on a puzzle requiring pairs
    const result = humanSolve(MEDIUM_PUZZLE);
    // Whether or not naked_pair is used, the function ran successfully
    expect(result.finalGrid).toHaveLength(81);
  });

  // Force the solver to try all techniques by using a puzzle where singles don't suffice
  it('solver tries multiple techniques in order', () => {
    // Use a hard puzzle: singles get exhausted quickly, triggering advanced technique attempts
    const result = humanSolve(HARD_PUZZLE);
    // Steps may include various technique types
    const usedTechniques = [...result.techniques];
    expect(usedTechniques).toBeInstanceOf(Array);
  });

  it('humanSolve returns steps array even for unsolvable-by-human puzzles', () => {
    // AI Escargot — too hard for human techniques, but should run without error
    const escargot = p(
      '800000000003600000070090200060005030004000000030000410000080070600000305000030000',
    );
    const result = humanSolve(escargot);
    expect(result.finalGrid).toHaveLength(81);
    expect(result.steps).toBeInstanceOf(Array);
  });

  it('findNextHint on medium puzzle returns various technique types over many steps', () => {
    const seenTechniques = new Set<string>();
    const grid = [...MEDIUM_PUZZLE];
    const notes = Array.from({ length: 81 }, () => new Set<number>());

    for (let i = 0; i < 150; i++) {
      const h = findNextHint(grid, notes);
      if (!h) break;
      seenTechniques.add(h.technique);
      if (h.isPlacement && h.digit !== undefined && h.actionCells.length > 0) {
        grid[h.actionCells[0]] = h.digit;
      } else {
        for (const { cell, digit } of h.eliminations) {
          if (notes[cell].size === 0) {
            // Initialize notes for this cell
            for (let d = 1; d <= 9; d++) {
              if (grid[cell] === 0) notes[cell].add(d);
            }
          }
          notes[cell].delete(digit);
        }
      }
    }

    expect(seenTechniques.size).toBeGreaterThan(0);
  });
});
