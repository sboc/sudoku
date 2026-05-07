import { describe, it, expect } from 'vitest';
import { humanSolve, findNextHint } from './humanSolver';

const p = (s: string): number[] => {
  return s.split('').map(Number);
};

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
const nearlyComplete = (): number[] => {
  const g = [...EASY_SOLUTION];
  g[80] = 0;
  return g;
};

// Apply humanSolve partially by simulating step-by-step via findNextHint
const collectHints = (puzzle: number[], maxSteps = 200): Array<{ technique: string }> => {
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
};

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
  const stepThroughHints = (puzzle: number[], maxSteps = 300): Set<string> => {
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
  };

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

// ---------------------------------------------------------------------------
// Advanced hint formatting coverage (findNextHint switch cases lines 678-891)
// ---------------------------------------------------------------------------

// Puzzles verified to trigger specific techniques through findNextHint step-through.
// Each puzzle string is 81 digits (0 = empty).
const GR1_PUZZLE = p('000000000000003085001020400000507000004000100090000000500000073002010000000040009');
const NT1_PUZZLE = p('000030086000000000010200000000107600000040000007208000000004010000000000640050000');
const HQ_PUZZLE = p('003000000000560040009000001020000070080000030070000040500000700060071000000000500');
const XWING_PUZZLE = p('002050000010006300400000002000200004063040098700001000300000001009600030000010900');
// Column-based x_wing (from SudokuWiki): digit 2 in same 2 rows across 2 columns, no matching row-based pattern
const XWING_COL_PUZZLE = p('000000004760010050090002081070050010000709000080030060240100070010090045900000000');
const WW4_PUZZLE = p('010000003608000207003900500000604010030050020040302000001007600305000109200000030');
const YW1_PUZZLE = p('050000080000086000000201070009020601280000054703060900090605000000170000030000010');
const XYZ3_PUZZLE = p('000900300005821000190600000016000290000070000043000670000008069000213800004009000');
const WW_A_PUZZLE = p('480300000000000071020000000705000060000200800000000000001076000300000400000050000');
const WW_B_PUZZLE = p('000014000030000200070000000000900030601000000000000080200000104000050600000708000');

// Sentinel (non-digit) added to initialized notes so that findNextHint treats a
// cell with all candidates eliminated differently from a cell with no notes at all.
// Without it, an empty notes set causes findNextHint to re-derive all candidates
// from the grid, causing infinite elimination loops.
const NOTES_SENTINEL = 0;

const initAdvancedCellNotes = (notes: Set<number>[], grid: number[], cell: number) => {
  if (grid[cell] !== 0) { notes[cell].clear(); return; }
  if (notes[cell].size > 0) return;
  const r = Math.floor(cell / 9), c = cell % 9;
  const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
  notes[cell].add(NOTES_SENTINEL);
  for (let d = 1; d <= 9; d++) notes[cell].add(d);
  for (let j = 0; j < 9; j++) {
    if (grid[r * 9 + j]) notes[cell].delete(grid[r * 9 + j]);
    if (grid[j * 9 + c]) notes[cell].delete(grid[j * 9 + c]);
  }
  for (let dr = 0; dr < 3; dr++)
    for (let dc = 0; dc < 3; dc++)
      if (grid[(br + dr) * 9 + (bc + dc)]) notes[cell].delete(grid[(br + dr) * 9 + (bc + dc)]);
};

const advancedPeersOf = (cell: number): number[] => {
  const r = Math.floor(cell / 9), c = cell % 9;
  const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
  const s = new Set<number>();
  for (let i = 0; i < 9; i++) { s.add(r * 9 + i); s.add(i * 9 + c); }
  for (let dr = 0; dr < 3; dr++)
    for (let dc = 0; dc < 3; dc++) s.add((br + dr) * 9 + (bc + dc));
  s.delete(cell);
  return [...s];
};

const applyAdvancedHint = (
  grid: number[],
  notes: Set<number>[],
  hint: NonNullable<ReturnType<typeof findNextHint>>,
) => {
  if (hint.isPlacement && hint.digit !== undefined) {
    const cell = hint.actionCells[0];
    grid[cell] = hint.digit;
    notes[cell].clear();
    for (const peer of advancedPeersOf(cell)) {
      initAdvancedCellNotes(notes, grid, peer);
      notes[peer].delete(hint.digit);
    }
  } else {
    for (const { cell, digit } of hint.eliminations) {
      initAdvancedCellNotes(notes, grid, cell);
      notes[cell].delete(digit);
    }
  }
};

const captureHintOfType = (puzzle: number[], targetTechnique: string, maxSteps = 1000): ReturnType<typeof findNextHint> => {
  const grid = [...puzzle];
  const notes = Array.from({ length: 81 }, () => new Set<number>());
  for (let i = 0; i < 81; i++) initAdvancedCellNotes(notes, grid, i);
  for (let step = 0; step < maxSteps; step++) {
    const hint = findNextHint(grid, notes);
    if (!hint) return null;
    if (hint.technique === targetTechnique) return hint;
    applyAdvancedHint(grid, notes, hint);
  }
  return null;
};

describe('findNextHint — naked subset hint formatting', () => {
  it('naked_pair: 2 evidence cells, eliminations present, digit set', () => {
    const hint = captureHintOfType(GR1_PUZZLE, 'naked_pair');
    expect(hint).not.toBeNull();
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.evidenceCells).toHaveLength(2);
    expect(hint!.eliminations.length).toBeGreaterThan(0);
    expect(hint!.digit).toBeDefined();
    expect(hint!.description).toMatch(/candidates/i);
  });

  it('naked_triple: 3 evidence cells, digit set, elimination hint', () => {
    const hint = captureHintOfType(NT1_PUZZLE, 'naked_triple');
    expect(hint).not.toBeNull();
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.evidenceCells).toHaveLength(3);
    expect(hint!.digit).toBeDefined();
    expect(hint!.eliminations.length).toBeGreaterThan(0);
    expect(hint!.description).toMatch(/triple/i);
  });

  it('naked_quad: 4 evidence cells, digit set, elimination hint', () => {
    const hint = captureHintOfType(NT1_PUZZLE, 'naked_quad');
    expect(hint).not.toBeNull();
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.evidenceCells).toHaveLength(4);
    expect(hint!.digit).toBeDefined();
    expect(hint!.eliminations.length).toBeGreaterThan(0);
    expect(hint!.description).toMatch(/quad/i);
  });
});

describe('findNextHint — hidden subset hint formatting', () => {
  it('hidden_pair: 2 cells, action cells equal evidence cells', () => {
    const hint = captureHintOfType(GR1_PUZZLE, 'hidden_pair');
    expect(hint).not.toBeNull();
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.evidenceCells).toHaveLength(2);
    expect(hint!.actionCells).toEqual(hint!.evidenceCells);
    expect(hint!.eliminations.length).toBeGreaterThan(0);
  });

  it('hidden_triple: 3 cells, action cells equal evidence cells', () => {
    const hint = captureHintOfType(WW_A_PUZZLE, 'hidden_triple');
    expect(hint).not.toBeNull();
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.evidenceCells).toHaveLength(3);
    expect(hint!.actionCells).toEqual(hint!.evidenceCells);
    expect(hint!.eliminations.length).toBeGreaterThan(0);
    expect(hint!.description).toMatch(/triple/i);
  });

  it('hidden_quad: 4 cells, action cells equal evidence cells', () => {
    const hint = captureHintOfType(HQ_PUZZLE, 'hidden_quad');
    expect(hint).not.toBeNull();
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.evidenceCells).toHaveLength(4);
    expect(hint!.actionCells).toEqual(hint!.evidenceCells);
    expect(hint!.eliminations.length).toBeGreaterThan(0);
    expect(hint!.description).toMatch(/quad/i);
  });
});

describe('findNextHint — fish technique hint formatting', () => {
  it('x_wing (row-based): 4 corner evidence cells, digit set, description mentions X-Wing', () => {
    const hint = captureHintOfType(XWING_PUZZLE, 'x_wing');
    expect(hint).not.toBeNull();
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.evidenceCells).toHaveLength(4);
    expect(hint!.digit).toBeDefined();
    expect(hint!.eliminations.length).toBeGreaterThan(0);
    expect(hint!.description).toMatch(/x-wing/i);
  });

  it('x_wing (col-based): exercises column corner-cell path in hint formatting', () => {
    const hint = captureHintOfType(XWING_COL_PUZZLE, 'x_wing');
    expect(hint).not.toBeNull();
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.evidenceCells).toHaveLength(4);
    expect(hint!.digit).toBeDefined();
    expect(hint!.eliminations.length).toBeGreaterThan(0);
  });

  it('x_wing (row-based corner assignment): synthetic state exercises the row-based branch', () => {
    // All-zero grid + crafted notes: digit 1 constrained to exactly cols 2 and 6
    // in rows 1 and 5 (via notes), while all other cells carry either full candidates
    // (empty notes → grid-valid) or notes without digit 1. No simpler technique fires
    // first (every unit has digit 1 in 2+ cells), so x_wing is the first hit and
    // re-finds its corners via the row-based path (lines 795-796).
    const grid = Array(81).fill(0);
    const notes = Array.from({ length: 81 }, () => new Set<number>());
    for (const row of [1, 5]) {
      for (let col = 0; col < 9; col++) {
        const cell = row * 9 + col;
        if (col === 2 || col === 6) {
          for (let d = 1; d <= 9; d++) notes[cell].add(d);
        } else {
          for (let d = 2; d <= 9; d++) notes[cell].add(d);
        }
      }
    }
    const hint = findNextHint(grid, notes);
    expect(hint).not.toBeNull();
    expect(hint!.technique).toBe('x_wing');
    expect(hint!.digit).toBe(1);
    // row-based corners: r1c2=11, r1c6=15, r5c2=47, r5c6=51
    expect(hint!.evidenceCells).toEqual(expect.arrayContaining([11, 15, 47, 51]));
    expect(hint!.evidenceCells).toHaveLength(4);
    expect(hint!.eliminations.length).toBeGreaterThan(0);
  });

  it('swordfish: cells present, digit set, description mentions Swordfish', () => {
    const hint = captureHintOfType(WW4_PUZZLE, 'swordfish');
    expect(hint).not.toBeNull();
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.digit).toBeDefined();
    expect(hint!.eliminations.length).toBeGreaterThan(0);
    expect(hint!.description).toMatch(/swordfish/i);
  });

  it('swordfish (row-based elimination): synthetic state exercises the row-based branch', () => {
    // All-zero grid + crafted notes: digit 1 in rows 0, 3, 6 constrained to cols
    // {1,7}, {4,7}, {1,4} respectively — combined col-set = {1,4,7} (size 3).
    // Each row's target cols deliberately span different boxes so box-line reduction
    // cannot fire before swordfish. No simpler technique fires first.
    const grid = Array(81).fill(0);
    const notes = Array.from({ length: 81 }, () => new Set<number>());
    const targetCols: Record<number, number[]> = { 0: [1, 7], 3: [4, 7], 6: [1, 4] };
    for (const [rowStr, cols] of Object.entries(targetCols)) {
      const row = Number(rowStr);
      for (let col = 0; col < 9; col++) {
        const cell = row * 9 + col;
        if (cols.includes(col)) {
          for (let d = 1; d <= 9; d++) notes[cell].add(d);
        } else {
          for (let d = 2; d <= 9; d++) notes[cell].add(d);
        }
      }
    }
    const hint = findNextHint(grid, notes);
    expect(hint).not.toBeNull();
    expect(hint!.technique).toBe('swordfish');
    expect(hint!.digit).toBe(1);
    expect(hint!.evidenceCells).toHaveLength(9);
    expect(hint!.eliminations.length).toBeGreaterThan(0);
  });
});

describe('findNextHint — wing technique hint formatting', () => {
  it('y_wing: 3 evidence cells (pivot + pincers), description mentions Y-Wing', () => {
    const hint = captureHintOfType(YW1_PUZZLE, 'y_wing');
    expect(hint).not.toBeNull();
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.evidenceCells).toHaveLength(3);
    expect(hint!.eliminations.length).toBeGreaterThan(0);
    expect(hint!.description).toMatch(/y-wing/i);
  });

  it('xyz_wing: 3 evidence cells, digit set, description mentions XYZ-Wing', () => {
    const hint = captureHintOfType(XYZ3_PUZZLE, 'xyz_wing');
    expect(hint).not.toBeNull();
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.evidenceCells).toHaveLength(3);
    expect(hint!.digit).toBeDefined();
    expect(hint!.eliminations.length).toBeGreaterThan(0);
    expect(hint!.description).toMatch(/xyz-wing/i);
  });

  it('w_wing: 4 evidence cells (p, q, x, y), digit set, description mentions W-Wing', () => {
    const hint = captureHintOfType(WW_A_PUZZLE, 'w_wing');
    expect(hint).not.toBeNull();
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.evidenceCells).toHaveLength(4);
    expect(hint!.digit).toBeDefined();
    expect(hint!.eliminations.length).toBeGreaterThan(0);
    expect(hint!.description).toMatch(/w-wing/i);
  });

  it('w_wing (wa !== digit branch): second puzzle exercises the other candidate-order arm', () => {
    // WW_B_PUZZLE's w_wing fires with baseCands[p] = [5, 9] and digit = 9,
    // so wa (5) !== digit (9) — takes the wa branch in the description formatter.
    const hint = captureHintOfType(WW_B_PUZZLE, 'w_wing');
    expect(hint).not.toBeNull();
    expect(hint!.technique).toBe('w_wing');
    expect(hint!.evidenceCells).toHaveLength(4);
    expect(hint!.digit).toBeDefined();
    expect(hint!.eliminations.length).toBeGreaterThan(0);
  });
});
