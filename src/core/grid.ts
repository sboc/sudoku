export const rowCells = (r: number): number[] =>
  Array.from({ length: 9 }, (_, i) => r * 9 + i);

export const colCells = (c: number): number[] =>
  Array.from({ length: 9 }, (_, i) => i * 9 + c);

export const boxCells = (box: number): number[] => {
  const br = Math.floor(box / 3) * 3;
  const bc = (box % 3) * 3;
  const cells: number[] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      cells.push((br + r) * 9 + (bc + c));
  return cells;
};

export const ALL_ROWS: number[][] = Array.from({ length: 9 }, (_, i) => rowCells(i));
export const ALL_COLS: number[][] = Array.from({ length: 9 }, (_, i) => colCells(i));
export const ALL_BOXES: number[][] = Array.from({ length: 9 }, (_, i) => boxCells(i));
export const ALL_UNITS: number[][] = ALL_ROWS.flatMap((r, i) => [r, ALL_COLS[i], ALL_BOXES[i]]);

export const PEERS: number[][] = Array.from({ length: 81 }, (_, cell) => {
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

export const PEER_SETS: ReadonlySet<number>[] = PEERS.map(p => new Set(p));
