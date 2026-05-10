import { PEERS, PEER_SETS, ALL_ROWS, ALL_COLS, ALL_BOXES, ALL_UNITS } from './grid';

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
  | 'jellyfish'
  | 'unique_rectangle'
  | 'y_wing'
  | 'xyz_wing'
  | 'w_wing'
  | 'skyscraper'
  | 'two_string_kite'
  | 'empty_rectangle'
  | 'simple_coloring'
  | 'xy_chain';

interface SolveStep {
  technique: Technique;
  cell?: number;
  cells?: number[];
  digit?: number;
  eliminated?: number[];
  urType?: 1 | 2 | 4;
}

interface HumanSolveResult {
  solved: boolean;
  steps: SolveStep[];
  techniques: Set<Technique>;
  finalGrid: number[];
}

type Candidates = Set<number>[];

const initCandidates = (grid: number[]): Candidates => {
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
};

const eliminate = (cands: Candidates, cell: number, d: number) => {
  for (const p of PEERS[cell]) {
    cands[p].delete(d);
  }
  cands[cell].clear();
};

const placeDigit = (grid: number[], cands: Candidates, cell: number, d: number) => {
  grid[cell] = d;
  eliminate(cands, cell, d);
};

const nakedSingle = (grid: number[], cands: Candidates): SolveStep | null => {
  for (let cell = 0; cell < 81; cell++) {
    if (grid[cell] !== 0) continue;
    if (cands[cell].size === 1) {
      const [d] = cands[cell];
      placeDigit(grid, cands, cell, d);
      return { technique: 'naked_single', cell, digit: d };
    }
  }
  return null;
};

const hiddenSingle = (grid: number[], cands: Candidates): SolveStep | null => {
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
};

const combinations = <T>(arr: T[], k: number): T[][] => {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...combinations(rest, k - 1).map(c => [first, ...c]),
    ...combinations(rest, k),
  ];
};

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const nakedSubset = (k: number, technique: Technique, grid: number[], cands: Candidates): SolveStep | null => {
  for (const unit of ALL_UNITS) {
    const allEmpties = unit.filter(c => grid[c] === 0);
    const empties = allEmpties.filter(c => cands[c].size >= 2 && cands[c].size <= k);
    for (const combo of combinations(empties, k)) {
      const combined = new Set<number>();
      for (const c of combo) for (const d of cands[c]) combined.add(d);
      if (combined.size !== k) continue;
      let changed = false;
      for (const c of allEmpties) {
        if (combo.includes(c)) continue;
        for (const d of combined) {
          if (cands[c].has(d)) { cands[c].delete(d); changed = true; }
        }
      }
      if (changed) return { technique, cells: combo };
    }
  }
  return null;
};

const hiddenSubset = (k: number, technique: Technique, grid: number[], cands: Candidates): SolveStep | null => {
  for (const unit of ALL_UNITS) {
    const empties = unit.filter(c => grid[c] === 0);
    for (const digitCombo of combinations(DIGITS, k)) {
      const digitSet = new Set(digitCombo);
      const cells = empties.filter(c => digitCombo.some(d => cands[c].has(d)));
      if (cells.length !== k) continue;
      if (!digitCombo.every(d => cells.some(c => cands[c].has(d)))) continue;
      let changed = false;
      for (const c of cells) {
        for (const d of cands[c]) {
          if (!digitSet.has(d)) { cands[c].delete(d); changed = true; }
        }
      }
      if (changed) return { technique, cells };
    }
  }
  return null;
};

const nakedPair    = (g: number[], c: Candidates) => nakedSubset(2, 'naked_pair',    g, c);
const nakedTriple  = (g: number[], c: Candidates) => nakedSubset(3, 'naked_triple',  g, c);
const nakedQuad    = (g: number[], c: Candidates) => nakedSubset(4, 'naked_quad',    g, c);
const hiddenPair   = (g: number[], c: Candidates) => hiddenSubset(2, 'hidden_pair',   g, c);
const hiddenTriple = (g: number[], c: Candidates) => hiddenSubset(3, 'hidden_triple', g, c);
const hiddenQuad   = (g: number[], c: Candidates) => hiddenSubset(4, 'hidden_quad',   g, c);

const pointingPair = (grid: number[], cands: Candidates): SolveStep | null => {
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
};

const boxLineReduction = (grid: number[], cands: Candidates): SolveStep | null => {
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
};

const fish = (size: number, technique: Technique, grid: number[], cands: Candidates): SolveStep | null => {
  for (let d = 1; d <= 9; d++) {
    // row-based: rows where d appears in 2..size cells
    const rowData: { idx: number; cross: number[] }[] = [];
    for (let r = 0; r < 9; r++) {
      const cols = ALL_ROWS[r].filter(c => grid[c] === 0 && cands[c].has(d)).map(c => c % 9);
      if (cols.length >= 2 && cols.length <= size) rowData.push({ idx: r, cross: cols });
    }
    for (const combo of combinations(rowData, size)) {
      const colSet = new Set<number>();
      for (const { cross } of combo) for (const c of cross) colSet.add(c);
      if (colSet.size !== size) continue;
      const rows = combo.map(x => x.idx);
      const cols = [...colSet];
      let changed = false;
      for (const col of cols) {
        for (const c of ALL_COLS[col]) {
          if (rows.includes(Math.floor(c / 9))) continue;
          if (cands[c].has(d)) { cands[c].delete(d); changed = true; }
        }
      }
      if (changed) return { technique, digit: d, cells: rows.flatMap(r => cols.map(col => r * 9 + col)) };
    }
    // col-based: cols where d appears in 2..size cells
    const colData: { idx: number; cross: number[] }[] = [];
    for (let col = 0; col < 9; col++) {
      const rows = ALL_COLS[col].filter(c => grid[c] === 0 && cands[c].has(d)).map(c => Math.floor(c / 9));
      if (rows.length >= 2 && rows.length <= size) colData.push({ idx: col, cross: rows });
    }
    for (const combo of combinations(colData, size)) {
      const rowSet = new Set<number>();
      for (const { cross } of combo) for (const r of cross) rowSet.add(r);
      if (rowSet.size !== size) continue;
      const cols = combo.map(x => x.idx);
      const rows = [...rowSet];
      let changed = false;
      for (const r of rows) {
        for (const c of ALL_ROWS[r]) {
          if (cols.includes(c % 9)) continue;
          if (cands[c].has(d)) { cands[c].delete(d); changed = true; }
        }
      }
      if (changed) return { technique, digit: d, cells: rows.flatMap(r => cols.map(col => r * 9 + col)) };
    }
  }
  return null;
};

const xWing    = (g: number[], c: Candidates) => fish(2, 'x_wing',    g, c);
const swordfish = (g: number[], c: Candidates) => fish(3, 'swordfish', g, c);

const yWing = (grid: number[], cands: Candidates): SolveStep | null => {
  for (let pivot = 0; pivot < 81; pivot++) {
    if (grid[pivot] !== 0 || cands[pivot].size !== 2) continue;
    const [a, b] = cands[pivot];
    const pivotPeers = PEERS[pivot].filter(c => grid[c] === 0 && cands[c].size === 2);

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
        for (const c of PEERS[p2]) {
          if (!p1peers.has(c)) continue;
          if (c === pivot) continue;
          if (cands[c].has(extra1)) { cands[c].delete(extra1); changed = true; }
        }
        if (changed) return { technique: 'y_wing', cells: [pivot, p1, p2] };
      }
    }
  }
  return null;
};

// XYZ-Wing: pivot with 3 candidates, two bivalue pincers seeing pivot that are each a subset of
// pivot's candidates. Together they cover all 3 pivot digits; their shared candidate is eliminated
// from any cell that sees all three (pivot + both pincers).
const xyzWing = (grid: number[], cands: Candidates): SolveStep | null => {
  for (let pivot = 0; pivot < 81; pivot++) {
    if (grid[pivot] !== 0 || cands[pivot].size !== 3) continue;
    const pivotCands = cands[pivot];
    const pivotPeers = PEERS[pivot].filter(c => grid[c] === 0 && cands[c].size === 2);
    const pivotPeerSet = PEER_SETS[pivot];

    for (const p1 of pivotPeers) {
      const [pa, pb] = cands[p1];
      if (!pivotCands.has(pa) || !pivotCands.has(pb)) continue;
      const p1peers = PEER_SETS[p1];
      for (const p2 of pivotPeers) {
        if (p2 === p1) continue;
        const [qa, qb] = cands[p2];
        if (!pivotCands.has(qa) || !pivotCands.has(qb)) continue;
        const hasPa = cands[p2].has(pa);
        const hasPb = cands[p2].has(pb);
        // Pincers must share exactly 1 digit; if both match p1's candidates the union doesn't cover
        // the 3rd pivot digit and the XYZ-wing reasoning fails
        if (hasPa && hasPb) continue;
        const z = hasPa ? pa : pb;
        let changed = false;
        for (const c of PEERS[p2]) {
          if (!p1peers.has(c) || !pivotPeerSet.has(c)) continue;
          if (cands[c].has(z)) { cands[c].delete(z); changed = true; }
        }
        if (changed) return { technique: 'xyz_wing', cells: [pivot, p1, p2], digit: z };
      }
    }
  }
  return null;
};

// W-Wing: two bivalue cells with the same two candidates {A,B} connected by a strong link on A.
// If P=A then the bridge forces Q=B, so any cell seeing both P and Q can't be B.
const wWing = (grid: number[], cands: Candidates): SolveStep | null => {
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
          for (const c of PEERS[q]) {
            if (!pPeers.has(c)) continue;
            if (cands[c].has(elim)) { cands[c].delete(elim); changed = true; }
          }
          if (changed) return { technique: 'w_wing', cells: [p, q, x, y], digit: elim };
        }
      }
    }
  }
  return null;
};

// Unique Rectangle: a rectangle of 4 empty cells spanning exactly 2 boxes whose 4 corners all
// contain UR candidates {A,B}. If they could all use only A/B the puzzle would have 2 solutions,
// so the pattern forces eliminations to preserve uniqueness.
const uniqueRectangle = (grid: number[], cands: Candidates): SolveStep | null => {
  const boxOf = (cell: number) =>
    Math.floor(Math.floor(cell / 9) / 3) * 3 + Math.floor((cell % 9) / 3);

  for (let r1 = 0; r1 < 9; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 9; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const corners = [r1 * 9 + c1, r1 * 9 + c2, r2 * 9 + c1, r2 * 9 + c2];
          if (corners.some(c => grid[c] !== 0 || cands[c].size < 2)) continue;
          if (new Set(corners.map(boxOf)).size !== 2) continue;

          // digits present in all 4 corners
          const common: number[] = [];
          for (const d of cands[corners[0]]) {
            if (corners.every(c => cands[c].has(d))) common.push(d);
          }
          if (common.length < 2) continue;

          for (let i = 0; i < common.length - 1; i++) {
            for (let j = i + 1; j < common.length; j++) {
              const a = common[i], b = common[j];
              // floor = corners with exactly {a,b}; roof = corners with extras
              const floor = corners.filter(c => cands[c].size === 2);
              const roof  = corners.filter(c => cands[c].size > 2);

              // Type 1: 3 floor cells, 1 roof cell → eliminate a and b from the roof cell
              if (floor.length === 3 && roof.length === 1) {
                const rc = roof[0];
                let changed = false;
                /* v8 ignore next */ if (cands[rc].has(a)) { cands[rc].delete(a); changed = true; }
                /* v8 ignore next */ if (cands[rc].has(b)) { cands[rc].delete(b); changed = true; }
                /* v8 ignore next */ if (changed) return { technique: 'unique_rectangle', cells: corners, urType: 1 };
              }

              if (floor.length === 2 && roof.length === 2) {
                const [rf1, rf2] = roof;

                // Type 2: each roof has exactly 1 extra, same digit C → lock C in shared unit
                const xtra1 = [...cands[rf1]].filter(d => d !== a && d !== b);
                const xtra2 = [...cands[rf2]].filter(d => d !== a && d !== b);
                if (xtra1.length === 1 && xtra2.length === 1 && xtra1[0] === xtra2[0]) {
                  const C = xtra1[0];
                  const rf1Peers = PEER_SETS[rf1];
                  let changed = false;
                  for (const c of PEERS[rf2]) {
                    if (c === rf1 || !rf1Peers.has(c)) continue;
                    if (cands[c].has(C)) { cands[c].delete(C); changed = true; }
                  }
                  if (changed) return { technique: 'unique_rectangle', cells: corners, digit: C, urType: 2 };
                }

                // Type 4: in a unit shared by both roof cells, one UR digit is confined there
                // → eliminate the other UR digit from both roof cells
                const rR1 = Math.floor(rf1 / 9), rR2 = Math.floor(rf2 / 9);
                const rC1 = rf1 % 9,              rC2 = rf2 % 9;
                const sharedUnits: number[][] = [];
                if (rR1 === rR2) sharedUnits.push(ALL_ROWS[rR1]);
                if (rC1 === rC2) sharedUnits.push(ALL_COLS[rC1]);
                if (boxOf(rf1) === boxOf(rf2)) sharedUnits.push(ALL_BOXES[boxOf(rf1)]);

                for (const unit of sharedUnits) {
                  for (const [locked, elim] of [[a, b], [b, a]] as [number, number][]) {
                    const inUnit = unit.filter(c => grid[c] === 0 && cands[c].has(locked));
                    if (inUnit.length === 2 && inUnit.includes(rf1) && inUnit.includes(rf2)) {
                      let changed = false;
                      /* v8 ignore next */ if (cands[rf1].has(elim)) { cands[rf1].delete(elim); changed = true; }
                      /* v8 ignore next */ if (cands[rf2].has(elim)) { cands[rf2].delete(elim); changed = true; }
                      /* v8 ignore next */ if (changed) return { technique: 'unique_rectangle', cells: corners, digit: locked, urType: 4 };
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return null;
};

const jellyfish = (g: number[], c: Candidates) => fish(4, 'jellyfish', g, c);

const skyscraper = (grid: number[], cands: Candidates): SolveStep | null => {
  for (let d = 1; d <= 9; d++) {
    // Row-based: two rows with exactly 2 candidates sharing one column
    const rowData: { row: number; cols: number[] }[] = [];
    for (let r = 0; r < 9; r++) {
      const cols = ALL_ROWS[r].filter(c => grid[c] === 0 && cands[c].has(d)).map(c => c % 9);
      if (cols.length === 2) rowData.push({ row: r, cols });
    }
    for (let i = 0; i < rowData.length; i++) {
      for (let j = i + 1; j < rowData.length; j++) {
        const ri = rowData[i], rj = rowData[j];
        const shared = ri.cols.filter(c => rj.cols.includes(c));
        if (shared.length !== 1) continue;
        const trunk = shared[0];
        const tip1Cell = ri.row * 9 + ri.cols.find(c => c !== trunk)!;
        const tip2Cell = rj.row * 9 + rj.cols.find(c => c !== trunk)!;
        const tip1Peers = PEER_SETS[tip1Cell];
        let changed = false;
        for (const c of PEERS[tip2Cell]) {
          if (c === tip1Cell || !tip1Peers.has(c)) continue;
          if (cands[c].has(d)) { cands[c].delete(d); changed = true; }
        }
        if (changed) return {
          technique: 'skyscraper',
          digit: d,
          cells: [ri.row * 9 + trunk, rj.row * 9 + trunk, tip1Cell, tip2Cell],
        };
      }
    }
    // Col-based
    const colData: { col: number; rows: number[] }[] = [];
    for (let col = 0; col < 9; col++) {
      const rows = ALL_COLS[col].filter(c => grid[c] === 0 && cands[c].has(d)).map(c => Math.floor(c / 9));
      if (rows.length === 2) colData.push({ col, rows });
    }
    for (let i = 0; i < colData.length; i++) {
      for (let j = i + 1; j < colData.length; j++) {
        const ci = colData[i], cj = colData[j];
        const shared = ci.rows.filter(r => cj.rows.includes(r));
        if (shared.length !== 1) continue;
        const trunk = shared[0];
        const tip1Cell = (ci.rows.find(r => r !== trunk)!) * 9 + ci.col;
        const tip2Cell = (cj.rows.find(r => r !== trunk)!) * 9 + cj.col;
        const tip1Peers = PEER_SETS[tip1Cell];
        let changed = false;
        for (const c of PEERS[tip2Cell]) {
          if (c === tip1Cell || !tip1Peers.has(c)) continue;
          if (cands[c].has(d)) { cands[c].delete(d); changed = true; }
        }
        if (changed) return {
          technique: 'skyscraper',
          digit: d,
          cells: [trunk * 9 + ci.col, trunk * 9 + cj.col, tip1Cell, tip2Cell],
        };
      }
    }
  }
  return null;
};

const twoStringKite = (grid: number[], cands: Candidates): SolveStep | null => {
  const boxOf = (cell: number) =>
    Math.floor(Math.floor(cell / 9) / 3) * 3 + Math.floor((cell % 9) / 3);

  for (let d = 1; d <= 9; d++) {
    for (let r = 0; r < 9; r++) {
      const rowCellsD = ALL_ROWS[r].filter(c => grid[c] === 0 && cands[c].has(d));
      if (rowCellsD.length !== 2) continue;
      for (let col = 0; col < 9; col++) {
        const colCellsD = ALL_COLS[col].filter(c => grid[c] === 0 && cands[c].has(d));
        if (colCellsD.length !== 2) continue;
        for (const rc of rowCellsD) {
          for (const cc of colCellsD) {
            if (rc === cc) continue;
            if (boxOf(rc) !== boxOf(cc)) continue;
            const tip1 = rowCellsD.find(c => c !== rc)!;
            const tip2 = colCellsD.find(c => c !== cc)!;
            /* v8 ignore next */ if (tip1 === tip2) continue;
            const tip1Peers = PEER_SETS[tip1];
            let changed = false;
            for (const c of PEERS[tip2]) {
              if (c === tip1 || !tip1Peers.has(c)) continue;
              if (cands[c].has(d)) { cands[c].delete(d); changed = true; }
            }
            if (changed) return {
              technique: 'two_string_kite',
              digit: d,
              cells: [rc, cc, tip1, tip2],
            };
          }
        }
      }
    }
  }
  return null;
};

const emptyRectangle = (grid: number[], cands: Candidates): SolveStep | null => {
  for (let d = 1; d <= 9; d++) {
    for (let box = 0; box < 9; box++) {
      const bCells = ALL_BOXES[box].filter(c => grid[c] === 0 && cands[c].has(d));
      if (bCells.length < 2) continue;

      const boxRowStart = Math.floor(box / 3) * 3;
      const boxColStart = (box % 3) * 3;
      const bRows = [...new Set(bCells.map(c => Math.floor(c / 9)))];
      const bCols = [...new Set(bCells.map(c => c % 9))];

      for (const r_B of bRows) {
        for (const c_B of bCols) {
          if (!bCells.every(c => Math.floor(c / 9) === r_B || c % 9 === c_B)) continue;
          if (!bCells.some(c => Math.floor(c / 9) === r_B && c % 9 !== c_B)) continue;
          if (!bCells.some(c => c % 9 === c_B && Math.floor(c / 9) !== r_B)) continue;

          // Strong link in column c2 (outside box col band) with one end at (r_B, c2)
          for (let c2 = 0; c2 < 9; c2++) {
            if (c2 >= boxColStart && c2 < boxColStart + 3) continue;
            const cl = ALL_COLS[c2].filter(c => grid[c] === 0 && cands[c].has(d));
            if (cl.length !== 2) continue;
            const r0 = Math.floor(cl[0] / 9), r1 = Math.floor(cl[1] / 9);
            const r_x = r0 === r_B ? r1 : r1 === r_B ? r0 : -1;
            if (r_x === -1) continue;
            if (r_x >= boxRowStart && r_x < boxRowStart + 3) continue;
            const target = r_x * 9 + c_B;
            if (grid[target] !== 0 || !cands[target].has(d)) continue;
            cands[target].delete(d);
            return {
              technique: 'empty_rectangle',
              digit: d,
              cells: [r_B * 9 + c2, r_x * 9 + c2, ...bCells],
            };
          }

          // Strong link in row r2 (outside box row band) with one end at (r2, c_B)
          for (let r2 = 0; r2 < 9; r2++) {
            if (r2 >= boxRowStart && r2 < boxRowStart + 3) continue;
            const rl = ALL_ROWS[r2].filter(c => grid[c] === 0 && cands[c].has(d));
            if (rl.length !== 2) continue;
            const ca = rl[0] % 9, cb = rl[1] % 9;
            const c_x = ca === c_B ? cb : cb === c_B ? ca : -1;
            if (c_x === -1) continue;
            if (c_x >= boxColStart && c_x < boxColStart + 3) continue;
            const target = r_B * 9 + c_x;
            if (grid[target] !== 0 || !cands[target].has(d)) continue;
            cands[target].delete(d);
            return {
              technique: 'empty_rectangle',
              digit: d,
              cells: [r2 * 9 + c_B, r2 * 9 + c_x, ...bCells],
            };
          }
        }
      }
    }
  }
  return null;
};

const simpleColoring = (grid: number[], cands: Candidates): SolveStep | null => {
  for (let d = 1; d <= 9; d++) {
    const adj = new Map<number, number[]>();
    const addEdge = (a: number, b: number) => {
      if (!adj.has(a)) adj.set(a, []);
      if (!adj.has(b)) adj.set(b, []);
      adj.get(a)!.push(b);
      adj.get(b)!.push(a);
    };
    for (const unit of ALL_UNITS) {
      const cells = unit.filter(c => grid[c] === 0 && cands[c].has(d));
      if (cells.length === 2) addEdge(cells[0], cells[1]);
    }
    if (adj.size === 0) continue;

    const visited = new Set<number>();
    for (const start of adj.keys()) {
      if (visited.has(start)) continue;
      const compColor = new Map<number, 0 | 1>();
      const queue: number[] = [start];
      compColor.set(start, 0);
      visited.add(start);
      while (queue.length > 0) {
        const curr = queue.shift()!;
        const currColor = compColor.get(curr)!;
        for (const nb of adj.get(curr)!) {
          if (compColor.has(nb)) continue;
          compColor.set(nb, (1 - currColor) as 0 | 1);
          visited.add(nb);
          queue.push(nb);
        }
      }
      const color0 = [...compColor.entries()].filter(([, c]) => c === 0).map(([cell]) => cell);
      const color1 = [...compColor.entries()].filter(([, c]) => c === 1).map(([cell]) => cell);
      /* v8 ignore next */ if (color1.length === 0) continue;

      // Type 1: two same-color cells see each other — that color is wrong
      for (const colorCells of [color0, color1]) {
        let conflict = false;
        for (let i = 0; i < colorCells.length && !conflict; i++) {
          for (let j = i + 1; j < colorCells.length && !conflict; j++) {
            if (PEER_SETS[colorCells[i]].has(colorCells[j])) conflict = true;
          }
        }
        if (conflict) {
          let changed = false;
          for (const c of colorCells) {
            /* v8 ignore next */ if (cands[c].has(d)) { cands[c].delete(d); changed = true; }
          }
          /* v8 ignore next */ if (changed) return {
            technique: 'simple_coloring',
            digit: d,
            cells: [...color0, ...color1],
          };
        }
      }

      // Type 2: cell outside the chain sees both colors
      const color0Set = new Set(color0);
      const color1Set = new Set(color1);
      let changed = false;
      for (let c = 0; c < 81; c++) {
        if (grid[c] !== 0 || !cands[c].has(d)) continue;
        if (color0Set.has(c) || color1Set.has(c)) continue;
        const peerSet = PEER_SETS[c];
        if (color0.some(cc => peerSet.has(cc)) && color1.some(cc => peerSet.has(cc))) {
          cands[c].delete(d);
          changed = true;
        }
      }
      if (changed) return {
        technique: 'simple_coloring',
        digit: d,
        cells: [...color0, ...color1],
      };
    }
  }
  return null;
};

const xyChain = (grid: number[], cands: Candidates): SolveStep | null => {
  const bivalue: number[] = [];
  for (let c = 0; c < 81; c++) {
    if (grid[c] === 0 && cands[c].size === 2) bivalue.push(c);
  }
  if (bivalue.length < 2) return null;

  for (const start of bivalue) {
    const [a, b] = cands[start];
    for (const [targetDigit, firstExit] of [[a, b], [b, a]] as [number, number][]) {
      const visited = new Set<number>([start]);
      const path: number[] = [start];

      const dfs = (cell: number, exitDigit: number): boolean => {
        /* v8 ignore next */ if (path.length > 12) return false;
        for (const next of bivalue) {
          if (visited.has(next) || !PEER_SETS[cell].has(next)) continue;
          if (!cands[next].has(exitDigit)) continue;
          const [x, y] = cands[next];
          const nextExit = x === exitDigit ? y : x;
          path.push(next);
          visited.add(next);
          if (nextExit === targetDigit) {
            const startPeers = PEER_SETS[start];
            let changed = false;
            for (const c of PEERS[next]) {
              if (c === start || !startPeers.has(c)) continue;
              if (cands[c].has(targetDigit)) { cands[c].delete(targetDigit); changed = true; }
            }
            if (changed) return true;
          }
          if (dfs(next, nextExit)) return true;
          path.pop();
          visited.delete(next);
        }
        return false;
      };

      if (dfs(start, firstExit)) {
        return {
          technique: 'xy_chain',
          digit: targetDigit,
          cells: [...path],
        };
      }
    }
  }
  return null;
};

const TECHNIQUES: Array<(g: number[], c: Candidates) => SolveStep | null> = [
  nakedSingle,      // weight 1
  hiddenSingle,     // weight 2
  nakedPair,        // weight 3
  pointingPair,     // weight 3
  boxLineReduction, // weight 3
  hiddenPair,       // weight 4
  nakedTriple,      // weight 5
  hiddenTriple,     // weight 6
  nakedQuad,        // weight 6
  skyscraper,       // weight 6
  twoStringKite,    // weight 6
  hiddenQuad,       // weight 7
  xWing,            // weight 7
  uniqueRectangle,  // weight 7
  emptyRectangle,   // weight 7
  swordfish,        // weight 8
  yWing,            // weight 8
  wWing,            // weight 8
  simpleColoring,   // weight 8
  jellyfish,        // weight 9
  xyzWing,          // weight 9
  xyChain,          // weight 9
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

const cloneCands = (cands: Candidates): Candidates => {
  return cands.map(s => new Set(s));
};

const cellRef = (cell: number): string => {
  return `R${Math.floor(cell / 9) + 1}C${(cell % 9) + 1}`;
};

const isHintValid = (hint: Hint, solution: number[]): boolean => {
  if (hint.isPlacement) return hint.digit === solution[hint.actionCells[0]];
  return !hint.eliminations.some(({ cell, digit }) => digit === solution[cell]);
};

export const findNextHint = (userGrid: number[], userNotes: Set<number>[], solution?: number[]): Hint | null => {
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

  for (const fn of TECHNIQUES) {
    // Fresh clone each iteration: when solution validation skips a matched technique,
    // the technique has already mutated testGrid/testCands via placeDigit/eliminate.
    const testGrid = [...baseGrid];
    const testCands = cloneCands(baseCands);

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

    let hint: Hint;
    switch (step.technique) {
      case 'naked_single': {
        const cell = step.cell!;
        const digit = step.digit!;
        const evidenceCells = PEERS[cell].filter(c => baseGrid[c] !== 0);
        hint = {
          technique: step.technique,
          description: `${cellRef(cell)} has only one possible digit: ${digit}.`,
          evidenceCells,
          actionCells: [cell],
          isPlacement: true,
          digit,
          eliminations: [],
        };
        break;
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
        hint = {
          technique: step.technique,
          description: `${digit} can only go in ${cellRef(cell)} in its unit.`,
          evidenceCells,
          actionCells: [cell],
          isPlacement: true,
          digit,
          eliminations: [],
        };
        break;
      }
      case 'naked_pair': {
        const [c1, c2] = step.cells!;
        const pairDigits = [...baseCands[c1]];
        hint = {
          technique: step.technique,
          description: `${cellRef(c1)} and ${cellRef(c2)} share candidates ${pairDigits.join(',')}. Eliminate them from peers.`,
          evidenceCells: [c1, c2],
          actionCells: eliminatedCells,
          isPlacement: false,
          digit: pairDigits[0],
          eliminations: allEliminations,
        };
        break;
      }
      case 'naked_triple': {
        const cells = step.cells!;
        const combined = new Set<number>(baseCands[cells[0]]);
        for (const d of baseCands[cells[1]]) combined.add(d);
        for (const d of baseCands[cells[2]]) combined.add(d);
        const tripleDigits = [...combined];
        hint = {
          technique: step.technique,
          description: `Cells ${cells.map(cellRef).join(', ')} form a naked triple with digits ${tripleDigits.join(',')}. Eliminate them from peers.`,
          evidenceCells: cells,
          actionCells: eliminatedCells,
          isPlacement: false,
          digit: tripleDigits[0],
          eliminations: allEliminations,
        };
        break;
      }
      case 'hidden_pair': {
        const cells = step.cells!;
        hint = {
          technique: step.technique,
          description: `${cellRef(cells[0])} and ${cellRef(cells[1])} are the only cells for those digits in their unit. Eliminate other candidates from them.`,
          evidenceCells: cells,
          actionCells: cells,
          isPlacement: false,
          eliminations: allEliminations,
        };
        break;
      }
      case 'hidden_triple': {
        const cells = step.cells!;
        hint = {
          technique: step.technique,
          description: `${cells.map(cellRef).join(', ')} form a hidden triple. Eliminate other candidates from them.`,
          evidenceCells: cells,
          actionCells: cells,
          isPlacement: false,
          eliminations: allEliminations,
        };
        break;
      }
      case 'naked_quad': {
        const cells = step.cells!;
        const combined = new Set<number>(baseCands[cells[0]]);
        for (const d of baseCands[cells[1]]) combined.add(d);
        for (const d of baseCands[cells[2]]) combined.add(d);
        for (const d of baseCands[cells[3]]) combined.add(d);
        const quadDigits = [...combined];
        hint = {
          technique: step.technique,
          description: `Cells ${cells.map(cellRef).join(', ')} form a naked quad with digits ${quadDigits.join(',')}. Eliminate them from peers.`,
          evidenceCells: cells,
          actionCells: eliminatedCells,
          isPlacement: false,
          digit: quadDigits[0],
          eliminations: allEliminations,
        };
        break;
      }
      case 'hidden_quad': {
        const cells = step.cells!;
        hint = {
          technique: step.technique,
          description: `${cells.map(cellRef).join(', ')} form a hidden quad. Eliminate other candidates from them.`,
          evidenceCells: cells,
          actionCells: cells,
          isPlacement: false,
          eliminations: allEliminations,
        };
        break;
      }
      case 'pointing_pair': {
        const cells = step.cells!;
        const digit = step.digit!;
        hint = {
          technique: step.technique,
          description: `${digit} in its box is confined to ${cells.map(cellRef).join(', ')}. Eliminate ${digit} from the rest of that line.`,
          evidenceCells: cells,
          actionCells: eliminatedCells,
          isPlacement: false,
          digit,
          eliminations: allEliminations,
        };
        break;
      }
      case 'box_line_reduction': {
        const cells = step.cells!;
        const digit = step.digit!;
        hint = {
          technique: step.technique,
          description: `${digit} in its line is confined to ${cells.map(cellRef).join(', ')}. Eliminate ${digit} from the rest of that box.`,
          evidenceCells: cells,
          actionCells: eliminatedCells,
          isPlacement: false,
          digit,
          eliminations: allEliminations,
        };
        break;
      }
      case 'x_wing': {
        const digit = step.digit!;
        hint = {
          technique: step.technique,
          description: `X-Wing on ${digit}: the four corners fix ${digit} in two lines. Eliminate ${digit} from other cells in those lines.`,
          evidenceCells: step.cells!,
          actionCells: eliminatedCells,
          isPlacement: false,
          digit,
          eliminations: allEliminations,
        };
        break;
      }
      case 'swordfish': {
        const digit = step.digit!;
        const cornerCells = step.cells!;
        hint = {
          technique: step.technique,
          description: `Swordfish on ${digit}: three rows (or columns) each have ${digit} in only 2-3 cells, all spanning the same three columns (or rows). Eliminate ${digit} from the rest of those lines.`,
          evidenceCells: cornerCells,
          actionCells: eliminatedCells,
          isPlacement: false,
          digit,
          eliminations: allEliminations,
        };
        break;
      }
      case 'unique_rectangle': {
        const corners = step.cells!;
        const urType = step.urType!;
        const floorCell = corners.find(c => baseCands[c].size === 2)!;
        const [a, b] = [...baseCands[floorCell]];
        const roofCells = corners.filter(c => baseCands[c].size > 2);

        if (urType === 1) {
          const rc = roofCells[0];
          hint = {
            technique: step.technique,
            description: `Unique Rectangle (Type 1): three corners are locked to {${a},${b}}. Placing ${a} or ${b} in ${cellRef(rc)} would allow two solutions — eliminate them from ${cellRef(rc)}.`,
            evidenceCells: corners.filter(c => c !== rc),
            actionCells: eliminatedCells,
            isPlacement: false,
            eliminations: allEliminations,
          };
        } else if (urType === 2) {
          const C = step.digit!;
          hint = {
            technique: step.technique,
            description: `Unique Rectangle (Type 2): floor cells locked to {${a},${b}}, both roof cells add candidate ${C}. One roof must be ${C} to break the deadly pattern — eliminate ${C} from their common peers.`,
            evidenceCells: corners,
            actionCells: eliminatedCells,
            isPlacement: false,
            digit: C,
            eliminations: allEliminations,
          };
        } else {
          const locked = step.digit!;
          const elim = locked === a ? b : a;
          hint = {
            technique: step.technique,
            description: `Unique Rectangle (Type 4): ${locked} is confined to the roof cells in their shared unit. If ${elim} appeared in a roof cell it could swap with ${locked}, giving two solutions — eliminate ${elim} from ${roofCells.map(cellRef).join(' and ')}.`,
            evidenceCells: corners,
            actionCells: eliminatedCells,
            isPlacement: false,
            digit: elim,
            eliminations: allEliminations,
          };
        }
        break;
      }
      case 'y_wing': {
        const [pivot, p1, p2] = step.cells!;
        const eliminatedDigit = allEliminations[0].digit;
        hint = {
          technique: step.technique,
          description: `Y-Wing: pivot ${cellRef(pivot)} with pincers ${cellRef(p1)} and ${cellRef(p2)}. Eliminate ${eliminatedDigit} from their common peers.`,
          evidenceCells: [pivot, p1, p2],
          actionCells: eliminatedCells,
          isPlacement: false,
          digit: eliminatedDigit,
          eliminations: allEliminations,
        };
        break;
      }
      case 'xyz_wing': {
        const [pivot, p1, p2] = step.cells!;
        const digit = step.digit!;
        hint = {
          technique: step.technique,
          description: `XYZ-Wing: pivot ${cellRef(pivot)} has three candidates including ${digit}; pincers ${cellRef(p1)} and ${cellRef(p2)} each hold ${digit} and one pivot candidate. Eliminate ${digit} from cells seeing all three.`,
          evidenceCells: [pivot, p1, p2],
          actionCells: eliminatedCells,
          isPlacement: false,
          digit,
          eliminations: allEliminations,
        };
        break;
      }
      case 'w_wing': {
        const [p, q, x, y] = step.cells!;
        const digit = step.digit!;
        const [wa, wb] = baseCands[p];
        const a = wa !== digit ? wa : wb;
        hint = {
          technique: step.technique,
          description: `W-Wing: ${cellRef(p)} and ${cellRef(q)} both have candidates {${a},${digit}}. A strong link on ${a} via ${cellRef(x)} and ${cellRef(y)} means ${digit} can be eliminated from cells that see both.`,
          evidenceCells: [p, q, x, y],
          actionCells: eliminatedCells,
          isPlacement: false,
          digit,
          eliminations: allEliminations,
        };
        break;
      }
      case 'jellyfish': {
        const digit = step.digit!;
        const cornerCells = step.cells!;
        hint = {
          technique: step.technique,
          description: `Jellyfish on ${digit}: four rows (or columns) each have ${digit} in only 2-4 cells spanning the same four columns (or rows). Eliminate ${digit} from the rest of those lines.`,
          evidenceCells: cornerCells,
          actionCells: eliminatedCells,
          isPlacement: false,
          digit,
          eliminations: allEliminations,
        };
        break;
      }
      case 'skyscraper': {
        const digit = step.digit!;
        const cells = step.cells!;
        const [t1, t2] = cells;
        const sameCol = t1 % 9 === t2 % 9;
        const axis = sameCol ? `column ${t1 % 9 + 1}` : `row ${Math.floor(t1 / 9) + 1}`;
        hint = {
          technique: step.technique,
          description: `Skyscraper on ${digit}: two ${sameCol ? 'rows' : 'columns'} each have exactly two positions for ${digit} sharing ${axis}. Cells seeing both outer ends can't be ${digit}.`,
          evidenceCells: cells,
          actionCells: eliminatedCells,
          isPlacement: false,
          digit,
          eliminations: allEliminations,
        };
        break;
      }
      case 'two_string_kite': {
        const digit = step.digit!;
        const cells = step.cells!;
        const [rc, cc, tip1, tip2] = cells;
        hint = {
          technique: step.technique,
          description: `2-String Kite on ${digit}: a row-string through ${cellRef(rc)} and a column-string through ${cellRef(cc)} share a box. Eliminate ${digit} from cells seeing both ${cellRef(tip1)} and ${cellRef(tip2)}.`,
          evidenceCells: cells,
          actionCells: eliminatedCells,
          isPlacement: false,
          digit,
          eliminations: allEliminations,
        };
        break;
      }
      case 'empty_rectangle': {
        const digit = step.digit!;
        const cells = step.cells!;
        const [sl1, sl2] = cells;
        hint = {
          technique: step.technique,
          description: `Empty Rectangle on ${digit}: candidates in a box form a cross pattern. The strong link ${cellRef(sl1)}–${cellRef(sl2)} forces an elimination.`,
          evidenceCells: cells,
          actionCells: eliminatedCells,
          isPlacement: false,
          digit,
          eliminations: allEliminations,
        };
        break;
      }
      case 'simple_coloring': {
        const digit = step.digit!;
        hint = {
          technique: step.technique,
          description: `Simple Coloring on ${digit}: alternating two colors across a strong-link chain reveals that ${digit} can be eliminated.`,
          evidenceCells: step.cells!,
          actionCells: eliminatedCells,
          isPlacement: false,
          digit,
          eliminations: allEliminations,
        };
        break;
      }
      case 'xy_chain': {
        const digit = step.digit!;
        const chainCells = step.cells!;
        const chainStart = chainCells[0];
        const chainEnd = chainCells[chainCells.length - 1];
        hint = {
          technique: step.technique,
          description: `XY-Chain on ${digit}: a chain of bivalue cells from ${cellRef(chainStart)} to ${cellRef(chainEnd)} forces one end to be ${digit}. Eliminate ${digit} from cells seeing both ends.`,
          evidenceCells: chainCells,
          actionCells: eliminatedCells,
          isPlacement: false,
          digit,
          eliminations: allEliminations,
        };
        break;
      }
      /* c8 ignore next */
      default: {
        const _exhaustive: never = step.technique;
        return _exhaustive;
      }
    }

    if (solution && !isHintValid(hint, solution)) continue;
    return hint;
  }

  return null;
};

export const humanSolve = (inputGrid: number[]): HumanSolveResult => {
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
};
