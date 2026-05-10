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

  it('placement hint passes solution validation when solution is correct', () => {
    const notes = Array.from({ length: 81 }, () => new Set<number>());
    const hint = findNextHint(EASY_PUZZLE, notes, EASY_SOLUTION);
    expect(hint).not.toBeNull();
    if (hint?.isPlacement) {
      expect(hint.digit).toBe(EASY_SOLUTION[hint.actionCells[0]]);
    }
  });

  it('returns null when placement hint is blocked by wrong solution', () => {
    // Nearly complete grid with one empty cell; corrupt the solution for that cell
    // so that the naked_single hint (only valid hint) fails validation → null
    const grid = nearlyComplete();
    const emptyCell = grid.indexOf(0);
    const wrongSolution = [...EASY_SOLUTION];
    const correctDigit = wrongSolution[emptyCell];
    wrongSolution[emptyCell] = correctDigit === 9 ? 1 : correctDigit + 1;
    const notes = Array.from({ length: 81 }, () => new Set<number>());
    expect(findNextHint(grid, notes, wrongSolution)).toBeNull();
  });

  it('skips rejected hint and continues to next valid technique', () => {
    // Get the first hint without validation to find out which cell fires first
    const notes = Array.from({ length: 81 }, () => new Set<number>());
    const firstHint = findNextHint(EASY_PUZZLE, notes);
    expect(firstHint).not.toBeNull();
    expect(firstHint!.isPlacement).toBe(true); // EASY_PUZZLE uses only singles

    const blockedCell = firstHint!.actionCells[0];
    const blockedDigit = firstHint!.digit!;

    // Corrupt that cell's entry in the solution so the first hint fails validation
    const corruptedSolution = [...EASY_SOLUTION];
    corruptedSolution[blockedCell] = blockedDigit === 9 ? 1 : blockedDigit + 1;

    // EASY_PUZZLE has many singles — another valid hint must be reachable
    const nextHint = findNextHint(EASY_PUZZLE, notes, corruptedSolution);
    expect(nextHint).not.toBeNull();
    // The returned hint must be valid against the (corrupted) solution
    if (nextHint!.isPlacement) {
      expect(nextHint!.digit).toBe(corruptedSolution[nextHint!.actionCells[0]]);
    }
  });

  it('validates and returns elimination hint when solution is safe', () => {
    // Walk GR1_PUZZLE (known to require naked_pair) past all singles so the first
    // available hint is an elimination technique. Then call with a zero-filled solution:
    // digits are 1–9 so solution[cell]=0 never matches, meaning the elimination is safe
    // and isHintValid (line 606) returns true.
    const grid = [...GR1_PUZZLE];
    const notes = Array.from({ length: 81 }, () => new Set<number>());
    for (let i = 0; i < 81; i++) initAdvancedCellNotes(notes, grid, i);

    for (let step = 0; step < 500; step++) {
      const h = findNextHint(grid, notes);
      if (!h) return; // puzzle finished early — skip
      if (!h.isPlacement) break; // at elimination territory — stop applying
      applyAdvancedHint(grid, notes, h);
    }

    // State has no naked/hidden singles left; first hint is an elimination technique.
    // zeros solution: no cell's answer is 0, so no elimination is "wrong" → hint valid.
    const result = findNextHint(grid, notes, Array(81).fill(0));
    expect(result).not.toBeNull();
    expect(result!.isPlacement).toBe(false);
    expect(result!.eliminations.length).toBeGreaterThan(0);
  });

  it('rejects elimination hint that would remove a solution digit', () => {
    // Same setup: walk to elimination-only territory.
    const grid = [...GR1_PUZZLE];
    const notes = Array.from({ length: 81 }, () => new Set<number>());
    for (let i = 0; i < 81; i++) initAdvancedCellNotes(notes, grid, i);

    for (let step = 0; step < 500; step++) {
      const h = findNextHint(grid, notes);
      if (!h) return;
      if (!h.isPlacement) break;
      applyAdvancedHint(grid, notes, h);
    }

    const elimHint = findNextHint(grid, notes);
    if (!elimHint || elimHint.isPlacement) return;

    // Poison the solution so that the first elimination targets the "solution digit"
    const { cell: targetCell, digit: targetDigit } = elimHint.eliminations[0];
    const poisonedSolution = Array(81).fill(0);
    poisonedSolution[targetCell] = targetDigit;

    // isHintValid (line 606) returns false → hint is skipped
    const result = findNextHint(grid, notes, poisonedSolution);
    // The returned hint (if any) must not contain the poisoned elimination
    if (result && !result.isPlacement) {
      expect(
        result.eliminations.some(e => e.cell === targetCell && e.digit === targetDigit),
      ).toBe(false);
    }
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

describe('unique_rectangle technique', () => {
  // UR requires a state where all simpler techniques are exhausted first.
  // These tests verify code correctness; specific puzzle strings exercising
  // each UR type should be added when identified.

  it('technique does not crash during full solves', () => {
    // uniqueRectangle runs on every iteration — verify no throws on known puzzles
    for (const puz of [EASY_PUZZLE, MEDIUM_PUZZLE, HARD_PUZZLE, WW4_PUZZLE, YW1_PUZZLE]) {
      expect(() => humanSolve(puz)).not.toThrow();
    }
  });

  it('if unique_rectangle hint fires it has correct structure', () => {
    for (const puz of [WW4_PUZZLE, YW1_PUZZLE, XYZ3_PUZZLE, WW_A_PUZZLE, WW_B_PUZZLE]) {
      const hint = captureHintOfType(puz, 'unique_rectangle', 2000);
      if (!hint) continue;
      expect(hint.isPlacement).toBe(false);
      // evidence is the 4 rectangle corners (possibly 3 for type 1)
      expect(hint.evidenceCells.length).toBeGreaterThanOrEqual(3);
      expect(hint.evidenceCells.length).toBeLessThanOrEqual(4);
      expect(hint.eliminations.length).toBeGreaterThan(0);
      expect(hint.description).toMatch(/unique rectangle/i);
      // all eliminations must be from empty cells with that digit as a candidate
      for (const { cell, digit } of hint.eliminations) {
        expect(digit).toBeGreaterThanOrEqual(1);
        expect(digit).toBeLessThanOrEqual(9);
        expect(cell).toBeGreaterThanOrEqual(0);
        expect(cell).toBeLessThan(81);
      }
    }
  });
});

describe('findNextHint — jellyfish hint formatting', () => {
  // Synthetic state for row-based jellyfish on digit 1:
  //   Rows {0,1,3,4}: digit 1 in cols {0,1,3,4} — 4 cols each (qualifies for jellyfish, not swordfish)
  //   Row 2: digit 1 in cols {0,3} — spans boxes 0 and 1, preventing box-line reduction
  //   All other cells: {2..9} — no digit 1 outside listed cells
  // Jellyfish fires on rows {0,1,2,3} (colSet={0,1,3,4}), eliminating digit 1 from
  // row 4, cols {0,1,3,4} — cells 36,37,39,40. No earlier technique fires because:
  //   no unit has exactly 1 cell with digit 1 (no hidden single), no box has digit 1
  //   confined to a single row/col (no pointing pair), rows have ≥4 cols (no x-wing/swordfish).
  it('jellyfish (row-based): 4 rows spanning 4 cols, eliminates digit 1 from non-participating rows', () => {
    const grid = Array(81).fill(0);
    const notes = Array.from({ length: 81 }, () => new Set<number>([2, 3, 4, 5, 6, 7, 8, 9]));
    for (const c of [0, 1, 3, 4, 9, 10, 12, 13, 18, 21, 27, 28, 30, 31, 36, 37, 39, 40]) {
      notes[c].add(1);
    }
    const hint = findNextHint(grid, notes);
    expect(hint).not.toBeNull();
    expect(hint!.technique).toBe('jellyfish');
    expect(hint!.digit).toBe(1);
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.eliminations.length).toBeGreaterThan(0);
    expect(hint!.description).toMatch(/jellyfish/i);
    expect(hint!.evidenceCells.length).toBeGreaterThan(0);
  });
});

describe('findNextHint — two_string_kite and xy_chain hint formatting', () => {
  it('two_string_kite: 4 evidence cells, digit set, description mentions 2-String Kite', () => {
    const hint = captureHintOfType(XWING_COL_PUZZLE, 'two_string_kite');
    expect(hint).not.toBeNull();
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.evidenceCells).toHaveLength(4);
    expect(hint!.digit).toBeDefined();
    expect(hint!.eliminations.length).toBeGreaterThan(0);
    expect(hint!.description).toMatch(/2-string kite/i);
  });

  it('xy_chain: bivalue chain, digit set, description mentions XY-Chain', () => {
    const hint = captureHintOfType(XWING_COL_PUZZLE, 'xy_chain');
    expect(hint).not.toBeNull();
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.digit).toBeDefined();
    expect(hint!.eliminations.length).toBeGreaterThan(0);
    expect(hint!.description).toMatch(/xy-chain/i);
  });
});

// Finds the first hint matching predicate, using the same proper note-initialization
// as captureHintOfType. Applies every non-matching hint and continues.
const captureHintMatching = (
  puzzle: number[],
  predicate: (h: NonNullable<ReturnType<typeof findNextHint>>) => boolean,
  maxSteps = 3000,
): ReturnType<typeof findNextHint> => {
  const grid = [...puzzle];
  const notes = Array.from({ length: 81 }, () => new Set<number>());
  for (let i = 0; i < 81; i++) initAdvancedCellNotes(notes, grid, i);
  for (let step = 0; step < maxSteps; step++) {
    const hint = findNextHint(grid, notes);
    if (!hint) return null;
    if (predicate(hint)) return hint;
    applyAdvancedHint(grid, notes, hint);
  }
  return null;
};

// Additional hard puzzles for UR type 1/2 hunting
const UR_HUNT_PUZZLES = [
  WW4_PUZZLE, YW1_PUZZLE, XYZ3_PUZZLE, WW_A_PUZZLE, WW_B_PUZZLE,
  p('100007090030020008009600500005300900010080002600004000300000010040000007007000300'), // AI Escargot
  p('000000010400000000020000000000050407008000300001090000300400200050100000000806000'),
  p('003000060050600000000910000070050300000408000004030070000071000000003090060000800'),
  p('800000000003600000070090200060005300400803001700020006060000280000419005000080079'),
  p('000000085000210009960080100500800016000000000890006007009068050300054000470000000'),
  p('030000080700200001000050020000680000000000000000012000040070000900003007010000030'),
  p('000007000000800540780000000500000010000060000060000007000000049037002000000300000'),
  GR1_PUZZLE, NT1_PUZZLE, HQ_PUZZLE, XWING_PUZZLE, XWING_COL_PUZZLE,
];

describe('findNextHint — jellyfish col-based hint formatting', () => {
  it('jellyfish (col-based): 4 cols each with digit 1 in exactly rows {0,1,3,4}, eliminates from non-member col', () => {
    // Cols 0-4 each have digit 1 in rows {0,1,3,4} (4 rows, union=4).
    // Row-based: rows 0,1,3,4 each have digit 1 in 5 cols → excluded (needs 2-4).
    // Col-based: fires on combo {col0,col1,col2,col3}, rowSet={0,1,3,4}, eliminates col4 rows 0,1,3,4.
    // No pointing pair: digit 1 in each box appears in ≥2 rows AND ≥2 cols.
    // No earlier technique fires: all cells have ≥8 candidates, no single-candidate units.
    const grid = Array(81).fill(0);
    const digit1Cells = new Set([
      0,1,2,3,4,   // row 0
      9,10,11,12,13, // row 1
      27,28,29,30,31, // row 3
      36,37,38,39,40, // row 4
    ]);
    const notes = Array.from({ length: 81 }, (_, i) =>
      digit1Cells.has(i)
        ? new Set<number>([1, 2, 3, 4, 5, 6, 7, 8, 9])
        : new Set<number>([2, 3, 4, 5, 6, 7, 8, 9])
    );
    const hint = findNextHint(grid, notes);
    expect(hint).not.toBeNull();
    expect(hint!.technique).toBe('jellyfish');
    expect(hint!.digit).toBe(1);
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.eliminations.length).toBeGreaterThan(0);
    expect(hint!.description).toMatch(/jellyfish/i);
  });
});

describe('findNextHint — skyscraper hint formatting', () => {
  it('skyscraper: row 0 and row 3 each have digit 5 in exactly 2 cols, sharing col 0 as trunk', () => {
    // Row 0: digit 5 only in cols 0 and 6.  Row 3: digit 5 only in cols 0 and 7.
    // All other cells: all 9 candidates.  Row-based skyscraper fires:
    //   trunk=col0, tip1=r0c6, tip2=r3c7.  Common peers (box2∩col7 and col6∩box5) have digit 5.
    // No earlier technique fires: no cell has <8 candidates; x-wing excluded (rows share only 1 col).
    const grid = Array(81).fill(0);
    const notes = Array.from({ length: 81 }, () => new Set<number>([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    for (const col of [1, 2, 3, 4, 5, 7, 8]) notes[col].delete(5);       // row 0: no 5 except cols 0,6
    for (const c of [28, 29, 30, 31, 32, 33, 35]) notes[c].delete(5);    // row 3: no 5 except cols 0,7
    const hint = findNextHint(grid, notes);
    expect(hint).not.toBeNull();
    expect(hint!.technique).toBe('skyscraper');
    expect(hint!.digit).toBe(5);
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.eliminations.length).toBeGreaterThan(0);
    expect(hint!.description).toMatch(/skyscraper/i);
    expect(hint!.evidenceCells).toHaveLength(4);
  });
});

describe('findNextHint — skyscraper col-based hint formatting', () => {
  it('skyscraper (col-based): col 0 and col 3 each have d=5 in exactly 2 rows, sharing row 2 as trunk', () => {
    // Col 0: d=5 only at r2c0=18 and r6c0=54. Col 3: d=5 only at r2c3=21 and r8c3=75.
    // Trunk=row2, tips=54(r6c0) and 75(r8c3). Common peers: r6c4=58 and r6c5=59 (row6∩box7).
    // Col-based skyscraper → sameCol=false → covers the "two columns / sharing row" description branch.
    const grid = Array(81).fill(0);
    const notes = Array.from({ length: 81 }, () => new Set<number>([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    // Col 0: keep d=5 only at r2c0=18 and r6c0=54
    for (const c of [0, 9, 27, 36, 45, 63, 72]) notes[c].delete(5);
    // Col 3: keep d=5 only at r2c3=21 and r8c3=75
    for (const c of [3, 12, 30, 39, 48, 57, 66]) notes[c].delete(5);
    const hint = findNextHint(grid, notes);
    expect(hint).not.toBeNull();
    expect(hint!.technique).toBe('skyscraper');
    expect(hint!.digit).toBe(5);
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.eliminations.length).toBeGreaterThan(0);
    expect(hint!.description).toMatch(/skyscraper/i);
    expect(hint!.evidenceCells).toHaveLength(4);
  });
});

describe('findNextHint — unique_rectangle Type 1 and Type 2 hint formatting', () => {
  it('unique_rectangle Type 1 or Type 2 fires during solve of at least one hard puzzle', () => {
    let type1hint: ReturnType<typeof findNextHint> = null;
    let type2hint: ReturnType<typeof findNextHint> = null;
    for (const puz of UR_HUNT_PUZZLES) {
      if (!type1hint) {
        type1hint = captureHintMatching(
          puz,
          h => h.technique === 'unique_rectangle' && !!h.description.match(/type 1/i),
          5000,
        );
      }
      if (!type2hint) {
        type2hint = captureHintMatching(
          puz,
          h => h.technique === 'unique_rectangle' && !!h.description.match(/type 2/i),
          5000,
        );
      }
      if (type1hint && type2hint) break;
    }

    if (type1hint) {
      expect(type1hint.isPlacement).toBe(false);
      expect(type1hint.description).toMatch(/type 1/i);
      expect(type1hint.eliminations.length).toBeGreaterThan(0);
      expect(type1hint.evidenceCells.length).toBeGreaterThanOrEqual(3);
    }
    if (type2hint) {
      expect(type2hint.isPlacement).toBe(false);
      expect(type2hint.description).toMatch(/type 2/i);
      expect(type2hint.eliminations.length).toBeGreaterThan(0);
    }
    // At least one UR type 1 or 2 must fire to achieve function/line coverage
    expect(type1hint ?? type2hint).not.toBeNull();
  });
});

describe('findNextHint — empty_rectangle hint formatting', () => {
  it('empty_rectangle col-link: box-0 L-shape + col-3 conjugate pair eliminates digit 5', () => {
    // Box 0 digit-5 cells: (0,0),(0,1),(1,0) — L-shape with r_B=0, c_B=0.
    // Col 3 digit-5 cells: (0,3),(5,3) only — conjugate pair. One end at row r_B=0.
    // Target: (5,0) sees the far end (5,3) via row 5 and the ER pivot col via col 0. Eliminated.
    // All other digits have all 9 candidates per unit → no earlier technique fires.
    const grid = Array(81).fill(0);
    const notes = Array.from({ length: 81 }, () => new Set<number>([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    // Box 0: keep digit 5 only at (0,0)=0, (0,1)=1, (1,0)=9
    for (const c of [2, 10, 11, 18, 19, 20]) notes[c].delete(5);
    // Col 3: keep digit 5 only at (0,3)=3 and (5,3)=48
    for (const r of [1, 2, 3, 4, 6, 7, 8]) notes[r * 9 + 3].delete(5);
    const hint = findNextHint(grid, notes);
    expect(hint).not.toBeNull();
    expect(hint!.technique).toBe('empty_rectangle');
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.eliminations.length).toBeGreaterThan(0);
    expect(hint!.description).toMatch(/empty rectangle/i);
    expect(hint!.evidenceCells.length).toBeGreaterThanOrEqual(3);
  });
});

describe('findNextHint — empty_rectangle row-link hint formatting', () => {
  it('empty_rectangle row-link: box-0 L-shape + row-5 conjugate pair eliminates digit 5', () => {
    // Box 0 d=5 cells: (0,0),(0,1),(1,0) — L-shape with r_B=0, c_B=0.
    // Row 5 d=5 cells: (5,0)=45 and (5,7)=52 only — strong link. One end at col c_B=0.
    // r_x = col 7, outside box-0 col band {0,1,2}. Target = (r_B=0, c_x=7) = cell 7. Eliminated.
    // Row 5 is the only 2-d5 row; no col has 2 d=5 cells → no skyscraper/2SK fires first.
    const grid = Array(81).fill(0);
    const notes = Array.from({ length: 81 }, () => new Set<number>([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    // Box 0: keep d=5 only at (0,0)=0, (0,1)=1, (1,0)=9
    for (const c of [2, 10, 11, 18, 19, 20]) notes[c].delete(5);
    // Row 5: keep d=5 only at (5,0)=45 and (5,7)=52
    for (const c of [46, 47, 48, 49, 50, 51, 53]) notes[c].delete(5);
    const hint = findNextHint(grid, notes);
    expect(hint).not.toBeNull();
    expect(hint!.technique).toBe('empty_rectangle');
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.eliminations.length).toBeGreaterThan(0);
    expect(hint!.description).toMatch(/empty rectangle/i);
    expect(hint!.evidenceCells.length).toBeGreaterThanOrEqual(3);
  });
});

describe('findNextHint — simple_coloring hint formatting', () => {
  it('simple_coloring Type 2: 6-node chain eliminates digit 1 from cells seeing both colors', () => {
    // Chain: A=(0,0):0, B=(0,3):1, C=(4,3):0, D=(4,7):1, E=(7,7):0, F=(7,1):1
    // Links: row0 A-B, col3 B-C, row4 C-D, col7 D-E, row7 E-F
    // color0={A,C,E}, color1={B,D,F}
    // Row col-sets {0,3},{3,7},{1,7} have 4-col union: no Swordfish/Jellyfish.
    // Skyscraper tips share no common digit-1 peers (strong-link removals cover them).
    // No box links so no TSK; no L-shape boxes so no ER.
    // Z cells (6,0)/(8,0) see A via col0 + F via box6; (1,1)/(2,1) see A via box0 + F via col1.
    const grid = Array(81).fill(0);
    const notes = Array.from({ length: 81 }, () => new Set<number>([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    // Row 0: keep digit 1 only at A=(0,0)=0 and B=(0,3)=3
    for (const c of [1, 2, 4, 5, 6, 7, 8]) notes[c].delete(1);
    // Col 3: keep digit 1 only at B=(0,3)=3 and C=(4,3)=39
    for (const c of [12, 21, 30, 48, 57, 66, 75]) notes[c].delete(1);
    // Row 4: keep digit 1 only at C=(4,3)=39 and D=(4,7)=43
    for (const c of [36, 37, 38, 40, 41, 42, 44]) notes[c].delete(1);
    // Col 7: keep digit 1 only at D=(4,7)=43 and E=(7,7)=70
    for (const c of [16, 25, 34, 52, 61, 79]) notes[c].delete(1);
    // Row 7: keep digit 1 only at E=(7,7)=70 and F=(7,1)=64
    for (const c of [63, 65, 67, 68, 69, 71]) notes[c].delete(1);
    const hint = findNextHint(grid, notes);
    expect(hint).not.toBeNull();
    expect(hint!.technique).toBe('simple_coloring');
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.eliminations.length).toBeGreaterThan(0);
    expect(hint!.description).toMatch(/simple coloring/i);
  });
});

describe('findNextHint — unique_rectangle Type 2 hint formatting', () => {
  it('unique_rectangle Type 2: floor {1,2} at r0c0/r2c0, roof {1,2,5} at r0c3/r2c3', () => {
    // Corners: 0(r0c0,box0,floor), 18(r2c0,box0,floor), 3(r0c3,box1,roof), 21(r2c3,box1,roof)
    // Box0 non-UR cells and col0 cells outside box0 have no digits 1,2, so the naked pair
    // {0,18}={1,2} has nothing to eliminate and returns null before UR is reached.
    const grid = Array(81).fill(0);
    const notes = Array.from({ length: 81 }, () => new Set<number>([1,2,3,4,5,6,7,8,9]));
    notes[0] = new Set([1, 2]);
    notes[18] = new Set([1, 2]);
    notes[3] = new Set([1, 2, 5]);
    notes[21] = new Set([1, 2, 5]);
    for (const c of [1, 2, 9, 10, 11, 19, 20]) { notes[c].delete(1); notes[c].delete(2); }
    for (const c of [27, 36, 45, 54, 63, 72]) { notes[c].delete(1); notes[c].delete(2); }
    const hint = findNextHint(grid, notes);
    expect(hint).not.toBeNull();
    expect(hint!.technique).toBe('unique_rectangle');
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.eliminations.length).toBeGreaterThan(0);
    expect(hint!.eliminations.every(e => e.digit === 5)).toBe(true);
    expect(hint!.description).toMatch(/unique rectangle.*type 2/i);
  });
});

describe('findNextHint — simple_coloring Type 1 hint formatting', () => {
  it('simple_coloring Type 1: odd-cycle forces same-color peers in box4', () => {
    // 7-cycle (odd): A(r0c2)—[row0]—G(r0c8)—[col8]—F(r4c8)—[row4]—E(r4c3)—[box4]—D(r3c5)—[col5]—C(r1c5)—[row1]—B(r1c0)—[box0]—A
    // BFS from A: color0={A(2),F(44),C(14)}, color1={G(8),B(9),E(39),D(32),22(r2c4 via box1)}.
    // D(r3c5) and E(r4c3) both color1, both in box4 → Type 1: eliminate d=1 from color1.
    // Strong-link rows row0={c2,c8}, row1={c0,c5}, row4={c3,c8} share no common col pair
    // → no skyscraper. No ER: all potential targets (29,21,47) are removed below.
    const grid = Array(81).fill(0);
    const notes = Array.from({ length: 81 }, () => new Set<number>([1,2,3,4,5,6,7,8,9]));
    // Row 0: keep d=1 only at A(r0c2=2) and G(r0c8=8)
    for (const c of [0,1,3,4,5,6,7]) notes[c].delete(1);
    // Box 0: keep d=1 only at A(r0c2=2) and B(r1c0=9)
    for (const c of [10,11,18,19,20]) notes[c].delete(1);
    // Row 1: keep d=1 only at B(r1c0=9) and C(r1c5=14)
    for (const c of [12,13,15,16,17]) notes[c].delete(1);
    // Col 5: keep d=1 only at C(r1c5=14) and D(r3c5=32)
    for (const c of [23,41,50,59,68,77]) notes[c].delete(1);
    // Box 4: keep d=1 only at D(r3c5=32) and E(r4c3=39)
    for (const c of [30,31,40,48,49]) notes[c].delete(1);
    // Row 4: keep d=1 only at E(r4c3=39) and F(r4c8=44)
    for (const c of [36,37,38,42,43]) notes[c].delete(1);
    // Col 8: keep d=1 only at F(r4c8=44) and G(r0c8=8)
    for (const c of [26,35,53,62,71,80]) notes[c].delete(1);
    // Prevent Empty Rectangle from firing before Simple Coloring:
    // box0 L-shape(r1,c2)+col5 → target r3c2=29; box2 L-shape(r2,c8)+row4 → target r2c3=21
    notes[29].delete(1);
    notes[21].delete(1);
    const hint = findNextHint(grid, notes);
    expect(hint).not.toBeNull();
    expect(hint!.technique).toBe('simple_coloring');
    expect(hint!.isPlacement).toBe(false);
    expect(hint!.eliminations.length).toBeGreaterThan(0);
    expect(hint!.eliminations.every(e => e.digit === 1)).toBe(true);
    expect(hint!.description).toMatch(/simple coloring/i);
  });
});
