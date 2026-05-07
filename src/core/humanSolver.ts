export type Technique =
  | 'naked_single'
  | 'hidden_single'
  | 'naked_pair'
  | 'naked_triple'
  | 'hidden_pair'
  | 'hidden_triple'
  | 'naked_quad'
  | 'hidden_quad'
  | 'pointing_pair'
  | 'box_line_reduction'
  | 'x_wing'
  | 'swordfish'
  | 'y_wing'
  | 'xyz_wing'
  | 'w_wing';

interface SolveStep {
  technique: Technique;
  cell?: number;
  cells?: number[];
  digit?: number;
  eliminated?: number[];
}

interface HumanSolveResult {
  solved: boolean;
  steps: SolveStep[];
  techniques: Set<Technique>;
  finalGrid: number[];
}

type Candidates = Set<number>[];

function initCandidates(grid: number[]): Candidates {
  const cands: Candidates = Array.from({ length: 81 }, () => new Set<number>());
  for (let cell = 0; cell < 81; cell++) {
    if (grid[cell] !== 0) continue;
    for (let d = 1; d <= 9; d++) {
      cands[cell].add(d);
    }
  }
  for (let cell = 0; cell < 81; cell++) {
    if (grid[cell] !== 0) {
      eliminate(cands, cell, grid[cell]);
    }
  }
  return cands;
}

const PEERS: number[][] = Array.from({ length: 81 }, (_, cell) => {
  const r = Math.floor(cell / 9);
  const c = cell % 9;
  const box = Math.floor(r / 3) * 3 + Math.floor(c / 3);
  const result = new Set<number>();
  for (let i = 0; i < 9; i++) {
    result.add(r * 9 + i);
    result.add(i * 9 + c);
    const br = Math.floor(box / 3) * 3 + Math.floor(i / 3);
    const bc = (box % 3) * 3 + (i % 3);
    result.add(br * 9 + bc);
  }
  result.delete(cell);
  return [...result];
});
const peers = (cell: number) => PEERS[cell];
const PEER_SETS: ReadonlySet<number>[] = PEERS.map(p => new Set(p));

function rowCells(r: number): number[] {
  return Array.from({ length: 9 }, (_, i) => r * 9 + i);
}
function colCells(c: number): number[] {
  return Array.from({ length: 9 }, (_, i) => i * 9 + c);
}
function boxCells(box: number): number[] {
  const br = Math.floor(box / 3) * 3;
  const bc = (box % 3) * 3;
  const cells: number[] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      cells.push((br + r) * 9 + (bc + c));
  return cells;
}

const ALL_ROWS: number[][] = Array.from({ length: 9 }, (_, i) => rowCells(i));
const ALL_COLS: number[][] = Array.from({ length: 9 }, (_, i) => colCells(i));
const ALL_BOXES: number[][] = Array.from({ length: 9 }, (_, i) => boxCells(i));
const ALL_UNITS: number[][] = ALL_ROWS.flatMap((r, i) => [r, ALL_COLS[i], ALL_BOXES[i]]);

function eliminate(cands: Candidates, cell: number, d: number) {
  for (const p of peers(cell)) {
    cands[p].delete(d);
  }
  cands[cell].clear();
}

function placeDigit(grid: number[], cands: Candidates, cell: number, d: number) {
  grid[cell] = d;
  eliminate(cands, cell, d);
}

function nakedSingle(grid: number[], cands: Candidates): SolveStep | null {
  for (let cell = 0; cell < 81; cell++) {
    if (grid[cell] !== 0) continue;
    if (cands[cell].size === 1) {
      const [d] = cands[cell];
      placeDigit(grid, cands, cell, d);
      return { technique: 'naked_single', cell, digit: d };
    }
  }
  return null;
}

function hiddenSingle(grid: number[], cands: Candidates): SolveStep | null {
  for (const unit of ALL_UNITS) {
    for (let d = 1; d <= 9; d++) {
      const possible = unit.filter(c => grid[c] === 0 && cands[c].has(d));
      if (possible.length === 1) {
        placeDigit(grid, cands, possible[0], d);
        return { technique: 'hidden_single', cell: possible[0], digit: d };
      }
    }
  }
  return null;
}

function nakedPair(grid: number[], cands: Candidates): SolveStep | null {
  for (const unit of ALL_UNITS) {
    const empties = unit.filter(c => grid[c] === 0);
    for (let i = 0; i < empties.length; i++) {
      if (cands[empties[i]].size !== 2) continue;
      for (let j = i + 1; j < empties.length; j++) {
        if (cands[empties[j]].size !== 2) continue;
        const a = cands[empties[i]];
        const b = cands[empties[j]];
        const [d1, d2] = a;
        if (b.has(d1) && b.has(d2)) {
          let changed = false;
          for (const c of empties) {
            if (c === empties[i] || c === empties[j]) continue;
            for (const d of a) {
              if (cands[c].has(d)) {
                cands[c].delete(d);
                changed = true;
              }
            }
          }
          if (changed) {
            return { technique: 'naked_pair', cells: [empties[i], empties[j]] };
          }
        }
      }
    }
  }
  return null;
}

function nakedTriple(grid: number[], cands: Candidates): SolveStep | null {
  for (const unit of ALL_UNITS) {
    const unitEmpties = unit.filter(c => grid[c] === 0);
    const empties = unitEmpties.filter(c => cands[c].size >= 2 && cands[c].size <= 3);
    for (let i = 0; i < empties.length; i++) {
      for (let j = i + 1; j < empties.length; j++) {
        for (let k = j + 1; k < empties.length; k++) {
          const combined = new Set<number>(cands[empties[i]]);
          for (const d of cands[empties[j]]) combined.add(d);
          for (const d of cands[empties[k]]) combined.add(d);
          if (combined.size === 3) {
            let changed = false;
            for (const c of unitEmpties) {
              if (c === empties[i] || c === empties[j] || c === empties[k]) continue;
              for (const d of combined) {
                if (cands[c].has(d)) {
                  cands[c].delete(d);
                  changed = true;
                }
              }
            }
            if (changed) {
              return { technique: 'naked_triple', cells: [empties[i], empties[j], empties[k]] };
            }
          }
        }
      }
    }
  }
  return null;
}

function hiddenPair(grid: number[], cands: Candidates): SolveStep | null {
  for (const unit of ALL_UNITS) {
    const empties = unit.filter(c => grid[c] === 0);
    for (let d1 = 1; d1 <= 8; d1++) {
      for (let d2 = d1 + 1; d2 <= 9; d2++) {
        const p1 = empties.filter(c => cands[c].has(d1));
        const p2 = empties.filter(c => cands[c].has(d2));
        if (p1.length === 2 && p2.length === 2 && p1[0] === p2[0] && p1[1] === p2[1]) {
          let changed = false;
          for (const c of p1) {
            for (const d of cands[c]) {
              if (d !== d1 && d !== d2) {
                cands[c].delete(d);
                changed = true;
              }
            }
          }
          if (changed) {
            return { technique: 'hidden_pair', cells: p1 };
          }
        }
      }
    }
  }
  return null;
}

function hiddenTriple(grid: number[], cands: Candidates): SolveStep | null {
  for (const unit of ALL_UNITS) {
    const empties = unit.filter(c => grid[c] === 0);
    for (let d1 = 1; d1 <= 7; d1++) {
      for (let d2 = d1 + 1; d2 <= 8; d2++) {
        for (let d3 = d2 + 1; d3 <= 9; d3++) {
          const cells = empties.filter(c => cands[c].has(d1) || cands[c].has(d2) || cands[c].has(d3));
          if (cells.length === 3) {
            const hasD1 = cells.some(c => cands[c].has(d1));
            const hasD2 = cells.some(c => cands[c].has(d2));
            const hasD3 = cells.some(c => cands[c].has(d3));
            if (!hasD1 || !hasD2 || !hasD3) continue;
            let changed = false;
            for (const c of cells) {
              for (const d of cands[c]) {
                if (d !== d1 && d !== d2 && d !== d3) {
                  cands[c].delete(d);
                  changed = true;
                }
              }
            }
            if (changed) {
              return { technique: 'hidden_triple', cells };
            }
          }
        }
      }
    }
  }
  return null;
}

function nakedQuad(grid: number[], cands: Candidates): SolveStep | null {
  for (const unit of ALL_UNITS) {
    const unitEmpties = unit.filter(c => grid[c] === 0);
    const empties = unitEmpties.filter(c => cands[c].size >= 2 && cands[c].size <= 4);
    for (let i = 0; i < empties.length; i++) {
      for (let j = i + 1; j < empties.length; j++) {
        for (let k = j + 1; k < empties.length; k++) {
          for (let l = k + 1; l < empties.length; l++) {
            const combined = new Set<number>(cands[empties[i]]);
            for (const d of cands[empties[j]]) combined.add(d);
            for (const d of cands[empties[k]]) combined.add(d);
            for (const d of cands[empties[l]]) combined.add(d);
            if (combined.size === 4) {
              let changed = false;
              for (const c of unitEmpties) {
                if (c === empties[i] || c === empties[j] || c === empties[k] || c === empties[l]) continue;
                for (const d of combined) {
                  if (cands[c].has(d)) { cands[c].delete(d); changed = true; }
                }
              }
              if (changed) return { technique: 'naked_quad', cells: [empties[i], empties[j], empties[k], empties[l]] };
            }
          }
        }
      }
    }
  }
  return null;
}

function hiddenQuad(grid: number[], cands: Candidates): SolveStep | null {
  for (const unit of ALL_UNITS) {
    const empties = unit.filter(c => grid[c] === 0);
    for (let d1 = 1; d1 <= 6; d1++) {
      for (let d2 = d1 + 1; d2 <= 7; d2++) {
        for (let d3 = d2 + 1; d3 <= 8; d3++) {
          for (let d4 = d3 + 1; d4 <= 9; d4++) {
            const cells = empties.filter(c => cands[c].has(d1) || cands[c].has(d2) || cands[c].has(d3) || cands[c].has(d4));
            if (cells.length !== 4) continue;
            if (![d1, d2, d3, d4].every(d => cells.some(c => cands[c].has(d)))) continue;
            let changed = false;
            for (const c of cells) {
              for (const d of cands[c]) {
                if (d !== d1 && d !== d2 && d !== d3 && d !== d4) { cands[c].delete(d); changed = true; }
              }
            }
            if (changed) return { technique: 'hidden_quad', cells };
          }
        }
      }
    }
  }
  return null;
}

function pointingPair(grid: number[], cands: Candidates): SolveStep | null {
  for (let box = 0; box < 9; box++) {
    const bc = ALL_BOXES[box];
    for (let d = 1; d <= 9; d++) {
      const cells = bc.filter(c => grid[c] === 0 && cands[c].has(d));
      if (cells.length < 2 || cells.length > 3) continue;
      const r0 = Math.floor(cells[0] / 9);
      const c0 = cells[0] % 9;
      let changed = false;
      if (cells.every(c => Math.floor(c / 9) === r0)) {
        for (const c of ALL_ROWS[r0]) {
          if (cells.includes(c)) continue;
          if (cands[c].has(d)) { cands[c].delete(d); changed = true; }
        }
        if (changed) return { technique: 'pointing_pair', cells, digit: d };
      }
      if (cells.every(c => c % 9 === c0)) {
        for (const c of ALL_COLS[c0]) {
          if (cells.includes(c)) continue;
          if (cands[c].has(d)) { cands[c].delete(d); changed = true; }
        }
        if (changed) return { technique: 'pointing_pair', cells, digit: d };
      }
    }
  }
  return null;
}

function boxLineReduction(grid: number[], cands: Candidates): SolveStep | null {
  for (let i = 0; i < 9; i++) {
    for (const unit of [ALL_ROWS[i], ALL_COLS[i]]) {
      for (let d = 1; d <= 9; d++) {
        const cells = unit.filter(c => grid[c] === 0 && cands[c].has(d));
        if (cells.length < 2 || cells.length > 3) continue;
        const r0 = Math.floor(cells[0] / 9);
        const box0 = Math.floor(r0 / 3) * 3 + Math.floor((cells[0] % 9) / 3);
        if (cells.every(c => Math.floor(Math.floor(c / 9) / 3) * 3 + Math.floor((c % 9) / 3) === box0)) {
          let changed = false;
          for (const c of ALL_BOXES[box0]) {
            if (cells.includes(c)) continue;
            if (cands[c].has(d)) { cands[c].delete(d); changed = true; }
          }
          if (changed) return { technique: 'box_line_reduction', cells, digit: d };
        }
      }
    }
  }
  return null;
}

function xWing(grid: number[], cands: Candidates): SolveStep | null {
  for (let d = 1; d <= 9; d++) {
    // row-based
    const rowData: { row: number; cols: number[] }[] = [];
    for (let r = 0; r < 9; r++) {
      const cols = ALL_ROWS[r].filter(c => grid[c] === 0 && cands[c].has(d)).map(c => c % 9);
      if (cols.length === 2) rowData.push({ row: r, cols });
    }
    for (let i = 0; i < rowData.length; i++) {
      for (let j = i + 1; j < rowData.length; j++) {
        if (rowData[i].cols[0] === rowData[j].cols[0] && rowData[i].cols[1] === rowData[j].cols[1]) {
          const [c1, c2] = rowData[i].cols;
          let changed = false;
          for (const col of [ALL_COLS[c1], ALL_COLS[c2]]) {
            for (const c of col) {
              const r = Math.floor(c / 9);
              if (r === rowData[i].row || r === rowData[j].row) continue;
              if (cands[c].has(d)) { cands[c].delete(d); changed = true; }
            }
          }
          if (changed) return { technique: 'x_wing', digit: d };
        }
      }
    }
    // col-based
    const colData: { col: number; rows: number[] }[] = [];
    for (let col = 0; col < 9; col++) {
      const rows = ALL_COLS[col].filter(c => grid[c] === 0 && cands[c].has(d)).map(c => Math.floor(c / 9));
      if (rows.length === 2) colData.push({ col, rows });
    }
    for (let i = 0; i < colData.length; i++) {
      for (let j = i + 1; j < colData.length; j++) {
        if (colData[i].rows[0] === colData[j].rows[0] && colData[i].rows[1] === colData[j].rows[1]) {
          const [r1, r2] = colData[i].rows;
          let changed = false;
          for (const row of [ALL_ROWS[r1], ALL_ROWS[r2]]) {
            for (const c of row) {
              const col = c % 9;
              if (col === colData[i].col || col === colData[j].col) continue;
              if (cands[c].has(d)) { cands[c].delete(d); changed = true; }
            }
          }
          if (changed) return { technique: 'x_wing', digit: d };
        }
      }
    }
  }
  return null;
}

function swordfish(grid: number[], cands: Candidates): SolveStep | null {
  for (let d = 1; d <= 9; d++) {
    // row-based
    const rowData: { row: number; cols: number[] }[] = [];
    for (let r = 0; r < 9; r++) {
      const cols = ALL_ROWS[r].filter(c => grid[c] === 0 && cands[c].has(d)).map(c => c % 9);
      if (cols.length >= 2 && cols.length <= 3) rowData.push({ row: r, cols });
    }
    for (let i = 0; i < rowData.length; i++) {
      for (let j = i + 1; j < rowData.length; j++) {
        for (let k = j + 1; k < rowData.length; k++) {
          const colSet = new Set<number>(rowData[i].cols);
          for (const c of rowData[j].cols) colSet.add(c);
          for (const c of rowData[k].cols) colSet.add(c);
          if (colSet.size !== 3) continue;
          const cols = [...colSet];
          const rows = [rowData[i].row, rowData[j].row, rowData[k].row];
          let changed = false;
          for (const col of cols) {
            for (const c of ALL_COLS[col]) {
              if (rows.includes(Math.floor(c / 9))) continue;
              if (cands[c].has(d)) { cands[c].delete(d); changed = true; }
            }
          }
          if (changed) return { technique: 'swordfish', digit: d, cells: rows.flatMap(r => cols.map(col => r * 9 + col)) };
        }
      }
    }
    // col-based
    const colData: { col: number; rows: number[] }[] = [];
    for (let col = 0; col < 9; col++) {
      const rows = ALL_COLS[col].filter(c => grid[c] === 0 && cands[c].has(d)).map(c => Math.floor(c / 9));
      if (rows.length >= 2 && rows.length <= 3) colData.push({ col, rows });
    }
    for (let i = 0; i < colData.length; i++) {
      for (let j = i + 1; j < colData.length; j++) {
        for (let k = j + 1; k < colData.length; k++) {
          const rowSet = new Set<number>(colData[i].rows);
          for (const r of colData[j].rows) rowSet.add(r);
          for (const r of colData[k].rows) rowSet.add(r);
          if (rowSet.size !== 3) continue;
          const rows = [...rowSet];
          const cols = [colData[i].col, colData[j].col, colData[k].col];
          let changed = false;
          for (const r of rows) {
            for (const c of ALL_ROWS[r]) {
              if (cols.includes(c % 9)) continue;
              if (cands[c].has(d)) { cands[c].delete(d); changed = true; }
            }
          }
          if (changed) return { technique: 'swordfish', digit: d, cells: rows.flatMap(r => cols.map(col => r * 9 + col)) };
        }
      }
    }
  }
  return null;
}

function yWing(grid: number[], cands: Candidates): SolveStep | null {
  for (let pivot = 0; pivot < 81; pivot++) {
    if (grid[pivot] !== 0 || cands[pivot].size !== 2) continue;
    const [a, b] = cands[pivot];
    const pivotPeers = peers(pivot).filter(c => grid[c] === 0 && cands[c].size === 2);

    for (const p1 of pivotPeers) {
      if (!cands[p1].has(a)) continue;
      const [p1a, p1b] = cands[p1];
      const extra1 = p1a !== a ? p1a : p1b;
      const p1peers = PEER_SETS[p1];

      for (const p2 of pivotPeers) {
        if (p2 === p1) continue;
        if (!cands[p2].has(b)) continue;
        const [p2a, p2b] = cands[p2];
        const extra2 = p2a !== b ? p2a : p2b;
        if (extra1 !== extra2) continue;
        let changed = false;
        for (const c of peers(p2)) {
          if (!p1peers.has(c)) continue;
          if (c === pivot) continue;
          if (cands[c].has(extra1)) { cands[c].delete(extra1); changed = true; }
        }
        if (changed) return { technique: 'y_wing', cells: [pivot, p1, p2] };
      }
    }
  }
  return null;
}

// XYZ-Wing: pivot with 3 candidates, two bivalue pincers seeing pivot that are each a subset of
// pivot's candidates. Together they cover all 3 pivot digits; their shared candidate is eliminated
// from any cell that sees all three (pivot + both pincers).
function xyzWing(grid: number[], cands: Candidates): SolveStep | null {
  for (let pivot = 0; pivot < 81; pivot++) {
    if (grid[pivot] !== 0 || cands[pivot].size !== 3) continue;
    const pivotCands = cands[pivot];
    const pivotPeers = peers(pivot).filter(c => grid[c] === 0 && cands[c].size === 2);
    const pivotPeerSet = PEER_SETS[pivot];

    for (const p1 of pivotPeers) {
      const [pa, pb] = cands[p1];
      if (!pivotCands.has(pa) || !pivotCands.has(pb)) continue;
      const p1peers = PEER_SETS[p1];
      for (const p2 of pivotPeers) {
        if (p2 === p1) continue;
        const [qa, qb] = cands[p2];
        if (!pivotCands.has(qa) || !pivotCands.has(qb)) continue;
        // Both are 2-element subsets of the 3-element pivotCands, so they share exactly 1 digit
        const z = cands[p2].has(pa) ? pa : pb;
        let changed = false;
        for (const c of peers(p2)) {
          if (!p1peers.has(c) || !pivotPeerSet.has(c)) continue;
          if (cands[c].has(z)) { cands[c].delete(z); changed = true; }
        }
        if (changed) return { technique: 'xyz_wing', cells: [pivot, p1, p2], digit: z };
      }
    }
  }
  return null;
}

// W-Wing: two bivalue cells with the same two candidates {A,B} connected by a strong link on A.
// If P=A then the bridge forces Q=B, so any cell seeing both P and Q can't be B.
function wWing(grid: number[], cands: Candidates): SolveStep | null {
  const bivalue: number[] = [];
  for (let c = 0; c < 81; c++) {
    if (grid[c] === 0 && cands[c].size === 2) bivalue.push(c);
  }

  for (let i = 0; i < bivalue.length; i++) {
    const p = bivalue[i];
    const [a, b] = cands[p];
    const pPeers = PEER_SETS[p];
    for (let j = i + 1; j < bivalue.length; j++) {
      const q = bivalue[j];
      if (!cands[q].has(a) || !cands[q].has(b)) continue;
      if (pPeers.has(q)) continue; // must not see each other directly

      for (const unit of ALL_UNITS) {
        for (const [bridge, elim] of [[a, b], [b, a]] as [number, number][]) {
          const bridgeCells = unit.filter(c => grid[c] === 0 && cands[c].has(bridge));
          if (bridgeCells.length !== 2) continue;
          const [x, y] = bridgeCells;
          const xPeers = PEER_SETS[x];
          const yPeers = PEER_SETS[y];
          const xSeesP = xPeers.has(p);
          const ySeesQ = yPeers.has(q);
          const xSeesQ = xPeers.has(q);
          const ySeesP = yPeers.has(p);
          if (!((xSeesP && ySeesQ) || (xSeesQ && ySeesP))) continue;

          let changed = false;
          for (const c of peers(q)) {
            if (!pPeers.has(c)) continue;
            if (cands[c].has(elim)) { cands[c].delete(elim); changed = true; }
          }
          if (changed) return { technique: 'w_wing', cells: [p, q, x, y], digit: elim };
        }
      }
    }
  }
  return null;
}

const TECHNIQUES: Array<(g: number[], c: Candidates) => SolveStep | null> = [
  nakedSingle,
  hiddenSingle,
  nakedPair,
  hiddenPair,
  nakedTriple,
  hiddenTriple,
  pointingPair,
  boxLineReduction,
  nakedQuad,
  hiddenQuad,
  xWing,
  swordfish,
  yWing,
  xyzWing,
  wWing,
];

export interface Hint {
  technique: Technique;
  description: string;
  evidenceCells: number[];
  actionCells: number[];
  isPlacement: boolean;
  digit?: number;
  eliminations: { cell: number; digit: number }[];
}

function cloneCands(cands: Candidates): Candidates {
  return cands.map(s => new Set(s));
}

function cellRef(cell: number): string {
  return `R${Math.floor(cell / 9) + 1}C${(cell % 9) + 1}`;
}

export function findNextHint(userGrid: number[], userNotes: Set<number>[]): Hint | null {
  const baseGrid = [...userGrid];
  const fromGrid = initCandidates(baseGrid);
  const hasAnyNotes = userNotes.some(s => s.size > 0);

  // Build baseCands: for cells with notes, intersect grid-valid candidates with userNotes so
  // that previously applied hint eliminations are already reflected. This prevents re-finding
  // already-done work and enables naked singles that depend on prior eliminations.
  const baseCands: Candidates = fromGrid.map((gridCands, i) => {
    if (baseGrid[i] !== 0) return new Set<number>();
    if (!hasAnyNotes || userNotes[i].size === 0) return new Set(gridCands);
    const s = new Set<number>();
    for (const d of userNotes[i]) if (gridCands.has(d)) s.add(d);
    return s;
  });

  // All techniques leave cands/grid unmodified when they return null, so one clone suffices.
  const testGrid = [...baseGrid];
  const testCands = cloneCands(baseCands);

  for (const fn of TECHNIQUES) {
    const step = fn(testGrid, testCands);
    if (!step) continue;

    const allEliminations: { cell: number; digit: number }[] = [];
    const eliminatedCellSet = new Set<number>();
    for (let i = 0; i < 81; i++) {
      if (baseGrid[i] !== 0) continue;
      for (const d of baseCands[i]) {
        if (!testCands[i].has(d)) {
          allEliminations.push({ cell: i, digit: d });
          eliminatedCellSet.add(i);
        }
      }
    }
    const eliminatedCells = [...eliminatedCellSet];

    switch (step.technique) {
      case 'naked_single': {
        const cell = step.cell!;
        const digit = step.digit!;
        const evidenceCells = peers(cell).filter(c => baseGrid[c] !== 0);
        return {
          technique: step.technique,
          description: `${cellRef(cell)} has only one possible digit: ${digit}.`,
          evidenceCells,
          actionCells: [cell],
          isPlacement: true,
          digit,
          eliminations: [],
        };
      }
      case 'hidden_single': {
        const cell = step.cell!;
        const digit = step.digit!;
        let evidenceCells: number[] = [];
        for (const unit of ALL_UNITS) {
          const possible = unit.filter(c => baseGrid[c] === 0 && baseCands[c].has(digit));
          if (possible.length === 1 && possible[0] === cell) {
            evidenceCells = unit.filter(c => c !== cell);
            break;
          }
        }
        return {
          technique: step.technique,
          description: `${digit} can only go in ${cellRef(cell)} in its unit.`,
          evidenceCells,
          actionCells: [cell],
          isPlacement: true,
          digit,
          eliminations: [],
        };
      }
      case 'naked_pair': {
        const [c1, c2] = step.cells!;
        const pairDigits = [...baseCands[c1]];
        return {
          technique: step.technique,
          description: `${cellRef(c1)} and ${cellRef(c2)} share candidates ${pairDigits.join(',')}. Eliminate them from peers.`,
          evidenceCells: [c1, c2],
          actionCells: eliminatedCells,
          isPlacement: false,
          digit: pairDigits[0],
          eliminations: allEliminations,
        };
      }
      case 'naked_triple': {
        const cells = step.cells!;
        const combined = new Set<number>(baseCands[cells[0]]);
        for (const d of baseCands[cells[1]]) combined.add(d);
        for (const d of baseCands[cells[2]]) combined.add(d);
        const tripleDigits = [...combined];
        return {
          technique: step.technique,
          description: `Cells ${cells.map(cellRef).join(', ')} form a naked triple with digits ${tripleDigits.join(',')}. Eliminate them from peers.`,
          evidenceCells: cells,
          actionCells: eliminatedCells,
          isPlacement: false,
          digit: tripleDigits[0],
          eliminations: allEliminations,
        };
      }
      case 'hidden_pair': {
        const cells = step.cells!;
        return {
          technique: step.technique,
          description: `${cellRef(cells[0])} and ${cellRef(cells[1])} are the only cells for those digits in their unit. Eliminate other candidates from them.`,
          evidenceCells: cells,
          actionCells: cells,
          isPlacement: false,
          eliminations: allEliminations,
        };
      }
      case 'hidden_triple': {
        const cells = step.cells!;
        return {
          technique: step.technique,
          description: `${cells.map(cellRef).join(', ')} form a hidden triple. Eliminate other candidates from them.`,
          evidenceCells: cells,
          actionCells: cells,
          isPlacement: false,
          eliminations: allEliminations,
        };
      }
      case 'naked_quad': {
        const cells = step.cells!;
        const combined = new Set<number>(baseCands[cells[0]]);
        for (const d of baseCands[cells[1]]) combined.add(d);
        for (const d of baseCands[cells[2]]) combined.add(d);
        for (const d of baseCands[cells[3]]) combined.add(d);
        const quadDigits = [...combined];
        return {
          technique: step.technique,
          description: `Cells ${cells.map(cellRef).join(', ')} form a naked quad with digits ${quadDigits.join(',')}. Eliminate them from peers.`,
          evidenceCells: cells,
          actionCells: eliminatedCells,
          isPlacement: false,
          digit: quadDigits[0],
          eliminations: allEliminations,
        };
      }
      case 'hidden_quad': {
        const cells = step.cells!;
        return {
          technique: step.technique,
          description: `${cells.map(cellRef).join(', ')} form a hidden quad. Eliminate other candidates from them.`,
          evidenceCells: cells,
          actionCells: cells,
          isPlacement: false,
          eliminations: allEliminations,
        };
      }
      case 'pointing_pair': {
        const cells = step.cells!;
        const digit = step.digit!;
        return {
          technique: step.technique,
          description: `${digit} in its box is confined to ${cells.map(cellRef).join(', ')}. Eliminate ${digit} from the rest of that line.`,
          evidenceCells: cells,
          actionCells: eliminatedCells,
          isPlacement: false,
          digit,
          eliminations: allEliminations,
        };
      }
      case 'box_line_reduction': {
        const cells = step.cells!;
        const digit = step.digit!;
        return {
          technique: step.technique,
          description: `${digit} in its line is confined to ${cells.map(cellRef).join(', ')}. Eliminate ${digit} from the rest of that box.`,
          evidenceCells: cells,
          actionCells: eliminatedCells,
          isPlacement: false,
          digit,
          eliminations: allEliminations,
        };
      }
      case 'x_wing': {
        const digit = step.digit!;
        // Re-find the 4 corner cells
        let cornerCells: number[] = [];
        // Try row-based
        const rowData: { row: number; cols: number[] }[] = [];
        for (let r = 0; r < 9; r++) {
          const cols = ALL_ROWS[r].filter(c => baseGrid[c] === 0 && baseCands[c].has(digit)).map(c => c % 9);
          if (cols.length === 2) rowData.push({ row: r, cols });
        }
        for (let i = 0; i < rowData.length && cornerCells.length === 0; i++) {
          for (let j = i + 1; j < rowData.length && cornerCells.length === 0; j++) {
            if (rowData[i].cols[0] === rowData[j].cols[0] && rowData[i].cols[1] === rowData[j].cols[1]) {
              const [col1, col2] = rowData[i].cols;
              cornerCells = [
                rowData[i].row * 9 + col1,
                rowData[i].row * 9 + col2,
                rowData[j].row * 9 + col1,
                rowData[j].row * 9 + col2,
              ];
            }
          }
        }
        // Try col-based if not found
        if (cornerCells.length === 0) {
          const colData: { col: number; rows: number[] }[] = [];
          for (let col = 0; col < 9; col++) {
            const rows = ALL_COLS[col].filter(c => baseGrid[c] === 0 && baseCands[c].has(digit)).map(c => Math.floor(c / 9));
            if (rows.length === 2) colData.push({ col, rows });
          }
          for (let i = 0; i < colData.length && cornerCells.length === 0; i++) {
            for (let j = i + 1; j < colData.length && cornerCells.length === 0; j++) {
              if (colData[i].rows[0] === colData[j].rows[0] && colData[i].rows[1] === colData[j].rows[1]) {
                const [r1, r2] = colData[i].rows;
                cornerCells = [
                  r1 * 9 + colData[i].col,
                  r1 * 9 + colData[j].col,
                  r2 * 9 + colData[i].col,
                  r2 * 9 + colData[j].col,
                ];
              }
            }
          }
        }
        return {
          technique: step.technique,
          description: `X-Wing on ${digit}: the four corners fix ${digit} in two lines. Eliminate ${digit} from other cells in those lines.`,
          evidenceCells: cornerCells,
          actionCells: eliminatedCells,
          isPlacement: false,
          digit,
          eliminations: allEliminations,
        };
      }
      case 'swordfish': {
        const digit = step.digit!;
        const cornerCells = step.cells ?? [];
        return {
          technique: step.technique,
          description: `Swordfish on ${digit}: three rows (or columns) each have ${digit} in only 2-3 cells, all spanning the same three columns (or rows). Eliminate ${digit} from the rest of those lines.`,
          evidenceCells: cornerCells,
          actionCells: eliminatedCells,
          isPlacement: false,
          digit,
          eliminations: allEliminations,
        };
      }
      case 'y_wing': {
        const [pivot, p1, p2] = step.cells!;
        const eliminatedDigit = allEliminations[0]?.digit;
        return {
          technique: step.technique,
          description: `Y-Wing: pivot ${cellRef(pivot)} with pincers ${cellRef(p1)} and ${cellRef(p2)}. Eliminate ${eliminatedDigit ?? '?'} from their common peers.`,
          evidenceCells: [pivot, p1, p2],
          actionCells: eliminatedCells,
          isPlacement: false,
          digit: eliminatedDigit,
          eliminations: allEliminations,
        };
      }
      case 'xyz_wing': {
        const [pivot, p1, p2] = step.cells!;
        const digit = step.digit!;
        return {
          technique: step.technique,
          description: `XYZ-Wing: pivot ${cellRef(pivot)} has three candidates including ${digit}; pincers ${cellRef(p1)} and ${cellRef(p2)} each hold ${digit} and one pivot candidate. Eliminate ${digit} from cells seeing all three.`,
          evidenceCells: [pivot, p1, p2],
          actionCells: eliminatedCells,
          isPlacement: false,
          digit,
          eliminations: allEliminations,
        };
      }
      case 'w_wing': {
        const [p, q, x, y] = step.cells!;
        const digit = step.digit!;
        const [wa, wb] = baseCands[p];
        const a = wa !== digit ? wa : wb;
        return {
          technique: step.technique,
          description: `W-Wing: ${cellRef(p)} and ${cellRef(q)} both have candidates {${a},${digit}}. A strong link on ${a} via ${cellRef(x)} and ${cellRef(y)} means ${digit} can be eliminated from cells that see both.`,
          evidenceCells: [p, q, x, y],
          actionCells: eliminatedCells,
          isPlacement: false,
          digit,
          eliminations: allEliminations,
        };
      }
      default:
        return null;
    }
  }

  return null;
}

export function humanSolve(inputGrid: number[]): HumanSolveResult {
  const grid = [...inputGrid];
  const cands = initCandidates(grid);
  const steps: SolveStep[] = [];
  const techniques = new Set<Technique>();

  let progress = true;
  while (progress) {
    progress = false;
    for (const technique of TECHNIQUES) {
      const step = technique(grid, cands);
      if (step) {
        steps.push(step);
        techniques.add(step.technique);
        progress = true;
        break;
      }
    }
  }

  const solved = grid.every(v => v !== 0);
  return { solved, steps, techniques, finalGrid: grid };
}
