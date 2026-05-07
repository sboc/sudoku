// Dancing Links (DLX) - Knuth's Algorithm X for exact cover

class DLXNode {
  left: DLXNode;
  right: DLXNode;
  up: DLXNode;
  down: DLXNode;
  column: ColumnNode;
  rowId: number;

  constructor() {
    this.left = this;
    this.right = this;
    this.up = this;
    this.down = this;
    this.column = null!;
    this.rowId = -1;
  }
}

class ColumnNode extends DLXNode {
  size: number;
  id: number;

  constructor(id: number) {
    super();
    this.size = 0;
    this.id = id;
    this.column = this;
  }
}

class DLX {
  private header: ColumnNode;
  private columns: ColumnNode[];
  private solution: number[];
  private solutions: number[][];
  private maxSolutions: number;

  constructor(numCols: number) {
    this.header = new ColumnNode(-1);
    this.columns = [];
    this.solution = [];
    this.solutions = [];
    this.maxSolutions = 2;

    for (let i = 0; i < numCols; i++) {
      const col = new ColumnNode(i);
      col.left = this.header.left;
      col.right = this.header;
      this.header.left.right = col;
      this.header.left = col;
      this.columns.push(col);
    }
  }

  addRow(cols: number[], rowId: number) {
    let first: DLXNode | null = null;
    for (const c of cols) {
      const col = this.columns[c];
      const node = new DLXNode();
      node.column = col;
      node.rowId = rowId;
      node.up = col.up;
      node.down = col;
      col.up.down = node;
      col.up = node;
      col.size++;
      if (!first) {
        first = node;
        node.left = node;
        node.right = node;
      } else {
        node.left = first.left;
        node.right = first;
        first.left.right = node;
        first.left = node;
      }
    }
  }

  private cover(col: ColumnNode) {
    col.right.left = col.left;
    col.left.right = col.right;
    for (let row = col.down; row !== col; row = row.down) {
      for (let node = row.right; node !== row; node = node.right) {
        node.down.up = node.up;
        node.up.down = node.down;
        node.column.size--;
      }
    }
  }

  private uncover(col: ColumnNode) {
    for (let row = col.up; row !== col; row = row.up) {
      for (let node = row.left; node !== row; node = node.left) {
        node.column.size++;
        node.down.up = node;
        node.up.down = node;
      }
    }
    col.right.left = col;
    col.left.right = col;
  }

  private chooseColumn(): ColumnNode {
    let min = Infinity;
    let chosen = null as ColumnNode | null;
    for (let col = this.header.right as ColumnNode; col !== this.header; col = col.right as ColumnNode) {
      if (col.size < min) {
        min = col.size;
        chosen = col;
      }
    }
    return chosen!;
  }

  private search(depth: number) {
    if (this.solutions.length >= this.maxSolutions) return;
    if (this.header.right === this.header) {
      this.solutions.push([...this.solution]);
      return;
    }

    const col = this.chooseColumn();
    if (col.size === 0) return;

    this.cover(col);
    for (let row = col.down; row !== col; row = row.down) {
      this.solution[depth] = row.rowId;
      for (let node = row.right; node !== row; node = node.right) {
        this.cover(node.column);
      }
      this.search(depth + 1);
      for (let node = row.left; node !== row; node = node.left) {
        this.uncover(node.column);
      }
    }
    this.uncover(col);
  }

  solve(max = 2): number[][] {
    this.solutions = [];
    this.solution = [];
    this.maxSolutions = max;
    this.search(0);
    return this.solutions;
  }
}

// Constraints: cell, row-digit, col-digit, box-digit
const buildSudokuDLX = (grid: number[]): DLX => {
  // 4 * 81 = 324 columns
  const dlx = new DLX(324);

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const box = Math.floor(r / 3) * 3 + Math.floor(c / 3);
      const cell = r * 9 + c;
      const given = grid[cell];

      for (let d = 1; d <= 9; d++) {
        if (given !== 0 && given !== d) continue;
        const rowId = cell * 9 + (d - 1);
        const cols = [
          cell,                    // cell constraint
          81 + r * 9 + (d - 1),   // row-digit
          162 + c * 9 + (d - 1),  // col-digit
          243 + box * 9 + (d - 1) // box-digit
        ];
        dlx.addRow(cols, rowId);
      }
    }
  }
  return dlx;
};

export const dlxSolve = (grid: number[], max = 2): number[][] => {
  const dlx = buildSudokuDLX(grid);
  const solutions = dlx.solve(max);
  return solutions.map(sol => {
    const result = [...grid];
    for (const rowId of sol) {
      const cell = Math.floor(rowId / 9);
      const digit = (rowId % 9) + 1;
      result[cell] = digit;
    }
    return result;
  });
};

export const hasUniqueSolution = (grid: number[]): boolean => {
  return dlxSolve(grid, 2).length === 1;
};
