import type { Technique } from './humanSolver';

export interface ExampleCell {
  r: number;
  c: number;
  value?: number;
  cands?: number[];
  elim?: number[];
  role: 'evidence' | 'action' | 'context';
}

export interface TechniqueExplanation {
  summary: string;
  steps: string[];
}

export const TECHNIQUE_LABEL: Record<Technique, string> = {
  naked_single: 'Naked Single',
  hidden_single: 'Hidden Single',
  naked_pair: 'Naked Pair',
  hidden_pair: 'Hidden Pair',
  naked_triple: 'Naked Triple',
  hidden_triple: 'Hidden Triple',
  naked_quad: 'Naked Quad',
  hidden_quad: 'Hidden Quad',
  pointing_pair: 'Pointing Pair',
  box_line_reduction: 'Box-Line Reduction',
  x_wing: 'X-Wing',
  swordfish: 'Swordfish',
  jellyfish: 'Jellyfish',
  unique_rectangle: 'Unique Rectangle',
  y_wing: 'Y-Wing',
  xyz_wing: 'XYZ-Wing',
  w_wing: 'W-Wing',
  skyscraper: 'Skyscraper',
  two_string_kite: '2-String Kite',
  empty_rectangle: 'Empty Rectangle',
  simple_coloring: 'Simple Coloring',
  xy_chain: 'XY-Chain',
};

export const TECHNIQUE_EXPLANATIONS: Record<Technique, TechniqueExplanation> = {
  naked_single: {
    summary: 'A cell has only one digit that can legally go there. Every other digit is already present in the same row, column, or box.',
    steps: [
      'Find a cell where all but one digit have been eliminated.',
      'The remaining candidate is the only legal choice.',
      'Place it.',
    ],
  },
  hidden_single: {
    summary: 'A digit can only go in one cell within a unit (row, column, or box). Other cells in the unit rule it out, even though the target cell may still have multiple candidates.',
    steps: [
      'Scan each row, column, and box for a digit that appears as a candidate in only one cell.',
      'That digit has no other valid home in the unit.',
      'Place it in that cell, ignoring the other candidates.',
    ],
  },
  naked_pair: {
    summary: 'Two cells in the same unit each contain exactly the same two candidates. One cell will get one digit, the other will get the other, so both digits can be removed from every other cell in that unit.',
    steps: [
      'Find two cells in a unit that share exactly the same two candidates (and no others).',
      'Those two digits are "claimed" by that pair of cells.',
      'Eliminate both digits from all other cells in the unit.',
    ],
  },
  hidden_pair: {
    summary: 'Two digits can only appear in two specific cells within a unit. Even though those cells have other candidates, the two digits must occupy those two cells. Everything else can be removed from them.',
    steps: [
      'Find two digits that appear as candidates in only two cells within a unit.',
      'Those digits are hidden among other candidates in those cells.',
      'Remove all other candidates from those two cells.',
    ],
  },
  naked_triple: {
    summary: 'Three cells in a unit collectively contain only three candidates between them (each cell holds 2 or 3 of the three). Those three digits can be eliminated from all other cells in the unit.',
    steps: [
      'Find three cells in a unit whose combined candidates total exactly three digits.',
      'Those three digits must occupy those three cells in some order.',
      'Eliminate those three digits from every other cell in the unit.',
    ],
  },
  hidden_triple: {
    summary: 'Three digits each appear as candidates in only three cells within a unit. Even though those cells have extra candidates, the three digits must go in those three cells. All other candidates in those cells can be removed.',
    steps: [
      'Find three digits that only appear (as candidates) in three cells of a unit.',
      'Those three cells are the only homes for those digits.',
      'Remove all other candidates from those three cells.',
    ],
  },
  naked_quad: {
    summary: 'Four cells in a unit collectively contain only four candidates between them. Those four digits must fill those four cells, so they can be eliminated from all other cells in the unit.',
    steps: [
      'Find four cells in a unit whose combined candidates total exactly four digits.',
      'Those four digits must occupy those four cells in some order.',
      'Eliminate those four digits from every other cell in the unit.',
    ],
  },
  hidden_quad: {
    summary: 'Four digits each appear as candidates in only four cells within a unit. Even though those cells have other candidates, the four digits must go in those four cells. All other candidates in those cells can be removed.',
    steps: [
      'Find four digits that only appear (as candidates) in four cells of a unit.',
      'Those four cells are the only valid homes for those digits.',
      'Remove all other candidates from those four cells.',
    ],
  },
  pointing_pair: {
    summary: "Within a box, a digit's only candidate cells all fall in the same row or column. That digit cannot appear elsewhere in that row or column outside the box.",
    steps: [
      'Look at a box and find a digit whose candidates are all in one row or column.',
      'Since the digit must be placed in that row/column (within the box), it cannot appear outside the box in that same line.',
      'Eliminate the digit from all cells in that row/column that are outside the box.',
    ],
  },
  box_line_reduction: {
    summary: "Within a row or column, a digit's candidates all fall inside the same box. That digit cannot appear elsewhere in that box.",
    steps: [
      'Find a digit whose candidates within a row or column all sit inside one box.',
      'The digit must be placed somewhere in that box (in that row/column), so it cannot appear elsewhere in the box.',
      'Eliminate the digit from all other cells in that box.',
    ],
  },
  x_wing: {
    summary: 'A digit appears in exactly two cells in each of two rows, and those cells share the same two columns. The digit is locked into those four corners, so it can be eliminated from the rest of both columns.',
    steps: [
      'Find a digit that appears in exactly two cells in row A and exactly two cells in row B.',
      'Both rows must have the digit in the same two columns.',
      'Those four cells form a rectangle. Eliminate the digit from all other cells in those two columns.',
      '(The same pattern works with columns and rows swapped.)',
    ],
  },
  swordfish: {
    summary: 'A three-row (or three-column) extension of X-Wing. A digit appears in only 2-3 cells in each of three rows, and those cells together span exactly three columns. The digit can be eliminated from all other cells in those three columns.',
    steps: [
      'Find a digit that appears in exactly 2 or 3 cells across each of three rows.',
      'The candidate cells in all three rows must together span exactly three columns.',
      'Eliminate the digit from all other cells in those three columns.',
      '(The same pattern works with columns and rows swapped.)',
    ],
  },
  unique_rectangle: {
    summary: 'Four empty cells forming a rectangle across exactly two boxes all contain the same two candidates. If no extra candidates existed, the puzzle would have two solutions (the two digits could swap). The extra candidates in roof cells must therefore be used — allowing eliminations that preserve uniqueness.',
    steps: [
      'Find four empty cells forming a rectangle (2 rows × 2 columns) that spans exactly two boxes.',
      'Confirm all four cells share two common candidates {A, B} — these are the UR digits.',
      'Type 1 — three cells have only {A,B}: the fourth cell must use one of its extra candidates, so eliminate A and B from it.',
      'Type 2 — two floor cells have only {A,B}, two roof cells each have exactly one extra digit C: one roof must be C to break the pattern; eliminate C from cells seeing both roof cells.',
      'Type 4 — two floor cells have only {A,B}, and one UR digit is confined to the two roof cells in their shared unit: eliminate the other UR digit from both roof cells.',
    ],
  },
  jellyfish: {
    summary: 'A four-row (or four-column) extension of Swordfish. A digit appears in only 2-4 cells in each of four rows, and those cells together span exactly four columns. The digit can be eliminated from all other cells in those four columns.',
    steps: [
      'Find a digit that appears in exactly 2–4 cells across each of four rows.',
      'The candidate cells across all four rows must together span exactly four columns.',
      'Eliminate the digit from all other cells in those four columns.',
      '(The same pattern works with columns and rows swapped.)',
    ],
  },
  skyscraper: {
    summary: 'Two rows (or columns) each have exactly two candidates for a digit, sharing one column (the trunk). The other two cells are the tips. Either one tip or the other must hold the digit, so cells seeing both tips can be eliminated.',
    steps: [
      'Find a digit with exactly two candidates in each of two rows, sharing exactly one column (the trunk).',
      'Identify the two tip cells — one in each row, in the non-shared column.',
      'Either the first row\'s tip or the second row\'s tip must hold the digit.',
      'Eliminate the digit from any cell that sees both tips.',
    ],
  },
  two_string_kite: {
    summary: 'A row-string (digit in exactly two row cells) and a column-string (digit in exactly two column cells) share a box corner. The two outer ends act like a conjugate pair — eliminate the digit from cells seeing both ends.',
    steps: [
      'Find a digit with exactly two candidates in a row and exactly two in a column.',
      'One cell from the row and one from the column must be in the same box (the shared corner).',
      'The remaining two cells (one from each string) are the tips.',
      'Eliminate the digit from any cell that sees both tips.',
    ],
  },
  empty_rectangle: {
    summary: 'In a box, a digit\'s candidates are confined to a single row and a single column forming a cross. Combined with an external strong link that touches the cross row (or column), this forces an elimination at the intersection of the other strong-link end and the cross column (or row).',
    steps: [
      'Find a box where a digit\'s candidates lie entirely on one row AND one column within the box (an "L" or "+" shape).',
      'Find a strong link (conjugate pair) in an external column that includes the cross row.',
      'The other end of the strong link plus the cross column define a single elimination target.',
      'Eliminate the digit from that target cell.',
    ],
  },
  simple_coloring: {
    summary: 'Two-color the strong-link graph for a digit (BFS alternating colors). If two same-color cells see each other, that color is impossible and all cells of that color are eliminated. If a cell outside the chain sees both colors, it can be eliminated.',
    steps: [
      'For a digit, build a graph of conjugate pairs (strong links — units where the digit appears in exactly two cells).',
      'Two-color the connected components: alternate colors along each chain.',
      'Type 1 — if two cells of the same color share a unit, that color is a contradiction: eliminate the digit from all same-color cells.',
      'Type 2 — if a cell outside the chain sees one cell of each color, it can\'t be the digit (one color must be correct): eliminate it.',
    ],
  },
  xyz_wing: {
    summary: 'A pivot cell with three candidates {A,B,C} connects to two bivalue pincers that are each a subset of those three. The shared candidate of both pincers can be eliminated from any cell that sees all three cells (pivot and both pincers).',
    steps: [
      'Find a pivot cell with exactly three candidates {A, B, C}.',
      'Find two bivalue pincers that each see the pivot, whose candidates are subsets of {A, B, C}.',
      'Identify the candidate shared by both pincers — call it Z.',
      'Eliminate Z from any cell that sees the pivot and both pincers simultaneously.',
    ],
  },
  w_wing: {
    summary: 'Two bivalue cells with the same two candidates {A,B} are connected by a strong link on A (A appears in exactly two cells in some unit, one seeing each bivalue cell). Any cell that sees both bivalue cells cannot be B.',
    steps: [
      'Find two cells P and Q that each have exactly candidates {A, B} and do not see each other.',
      'Find a unit where A appears in exactly two cells, one of which sees P and the other sees Q.',
      'If P = A, the bridge forces Q = B. So any cell that sees both P and Q cannot be B.',
      'Eliminate B from all cells that see both P and Q.',
    ],
  },
  y_wing: {
    summary: 'Three cells form a chain: a pivot with two candidates {A,B}, and two pincers (one with {A,C} and one with {B,C}). Any cell that sees both pincers cannot be C.',
    steps: [
      'Find a pivot cell with exactly two candidates, call them A and B.',
      'Find a pincer that sees the pivot with candidates {A, C}.',
      'Find another pincer that sees the pivot with candidates {B, C}.',
      'Any cell that sees both pincers can have C eliminated, as it would conflict with whichever pincer ends up holding C.',
    ],
  },
  xy_chain: {
    summary: 'A chain of bivalue cells where each consecutive pair shares one candidate. The first and last cell share a target digit T. Either the start or the end must be T, so cells seeing both chain ends can have T eliminated.',
    steps: [
      'Find a chain of bivalue cells where adjacent cells share exactly one candidate.',
      'The first cell has candidates {T, X}, each link passes the "exit" digit to the next cell, and the last cell ends with candidate T.',
      'Either the first cell is T or the last cell is T (or the chain forces one of them).',
      'Eliminate T from any cell that sees both the first and last cell of the chain.',
    ],
  },
};

export interface TechniqueExample {
  caption: string;
  cells: ExampleCell[];
}

export const TECHNIQUE_EXAMPLES: Record<Technique, TechniqueExample> = {
  naked_single: {
    caption: 'Row 5 already contains every digit except 7. The centre cell has only one legal candidate — place it.',
    cells: [
      { r: 4, c: 0, value: 1, role: 'context' },
      { r: 4, c: 1, value: 3, role: 'context' },
      { r: 4, c: 2, value: 9, role: 'context' },
      { r: 4, c: 3, value: 5, role: 'context' },
      { r: 4, c: 4, cands: [7], role: 'action' },
      { r: 4, c: 5, value: 2, role: 'context' },
      { r: 4, c: 6, value: 6, role: 'context' },
      { r: 4, c: 7, value: 8, role: 'context' },
      { r: 4, c: 8, value: 4, role: 'context' },
    ],
  },

  hidden_single: {
    caption: 'Digit 4 appears as a candidate in only one cell of column 6 (blue). Even though that cell has other candidates, 4 must go there.',
    cells: [
      { r: 0, c: 5, value: 3, role: 'context' },
      { r: 1, c: 5, value: 7, role: 'context' },
      { r: 2, c: 5, value: 1, role: 'context' },
      { r: 3, c: 5, value: 8, role: 'context' },
      { r: 4, c: 5, cands: [4, 6], role: 'action' },
      { r: 5, c: 5, value: 9, role: 'context' },
      { r: 6, c: 5, value: 2, role: 'context' },
      { r: 7, c: 5, value: 5, role: 'context' },
      { r: 8, c: 5, cands: [6], role: 'context' },
    ],
  },

  pointing_pair: {
    caption: 'Digit 4 in the top-left box can only appear in row 2 (blue). Eliminate 4 from that row outside the box (orange).',
    cells: [
      { r: 0, c: 0, value: 2, role: 'context' },
      { r: 0, c: 1, value: 8, role: 'context' },
      { r: 0, c: 2, value: 6, role: 'context' },
      { r: 1, c: 0, cands: [4, 3], role: 'evidence' },
      { r: 1, c: 1, cands: [4, 9], role: 'evidence' },
      { r: 1, c: 2, value: 5, role: 'context' },
      { r: 2, c: 0, value: 7, role: 'context' },
      { r: 2, c: 1, value: 1, role: 'context' },
      { r: 2, c: 2, value: 9, role: 'context' },
      { r: 1, c: 3, cands: [4, 6], elim: [4], role: 'action' },
      { r: 1, c: 5, cands: [4, 7], elim: [4], role: 'action' },
      { r: 1, c: 7, cands: [4, 2], elim: [4], role: 'action' },
    ],
  },

  box_line_reduction: {
    caption: 'Digit 6 in row 2 only appears within the left box (blue). Eliminate 6 from other cells in that box (orange).',
    cells: [
      { r: 1, c: 0, cands: [6, 3], role: 'evidence' },
      { r: 1, c: 1, cands: [6, 2], role: 'evidence' },
      { r: 1, c: 2, cands: [6, 8], role: 'evidence' },
      { r: 1, c: 3, value: 5, role: 'context' },
      { r: 1, c: 4, value: 9, role: 'context' },
      { r: 1, c: 5, value: 4, role: 'context' },
      { r: 1, c: 6, value: 7, role: 'context' },
      { r: 1, c: 7, value: 8, role: 'context' },
      { r: 1, c: 8, value: 1, role: 'context' },
      { r: 0, c: 0, cands: [6, 9], elim: [6], role: 'action' },
      { r: 0, c: 1, cands: [6, 4], elim: [6], role: 'action' },
      { r: 2, c: 2, cands: [6, 1], elim: [6], role: 'action' },
    ],
  },

  naked_pair: {
    caption: 'Two cells share exactly {3, 8} (blue). Those digits are claimed — eliminate 3 and 8 from every other cell in the row (orange).',
    cells: [
      { r: 0, c: 0, cands: [3, 5], elim: [3], role: 'action' },
      { r: 0, c: 1, cands: [8, 7], elim: [8], role: 'action' },
      { r: 0, c: 2, cands: [3, 8], role: 'evidence' },
      { r: 0, c: 3, value: 1, role: 'context' },
      { r: 0, c: 4, value: 6, role: 'context' },
      { r: 0, c: 5, cands: [3, 8], role: 'evidence' },
      { r: 0, c: 6, cands: [8, 4], elim: [8], role: 'action' },
      { r: 0, c: 7, value: 2, role: 'context' },
      { r: 0, c: 8, value: 9, role: 'context' },
    ],
  },

  hidden_pair: {
    caption: 'Digits 2 and 9 only appear in two cells of this row (blue). Remove all other candidates from those cells (red strikethroughs).',
    cells: [
      { r: 3, c: 0, value: 4, role: 'context' },
      { r: 3, c: 1, cands: [2, 5, 9], elim: [5], role: 'evidence' },
      { r: 3, c: 2, value: 8, role: 'context' },
      { r: 3, c: 3, value: 6, role: 'context' },
      { r: 3, c: 4, cands: [5, 7], role: 'context' },
      { r: 3, c: 5, value: 3, role: 'context' },
      { r: 3, c: 6, cands: [2, 7, 9], elim: [7], role: 'evidence' },
      { r: 3, c: 7, value: 1, role: 'context' },
      { r: 3, c: 8, value: 5, role: 'context' },
    ],
  },

  naked_triple: {
    caption: 'Three cells collectively hold only {1, 5, 9} (blue). Eliminate those three digits from all other cells in the row (orange).',
    cells: [
      { r: 6, c: 0, cands: [1, 5], role: 'evidence' },
      { r: 6, c: 1, cands: [1, 4, 5, 9], elim: [1, 5, 9], role: 'action' },
      { r: 6, c: 2, value: 7, role: 'context' },
      { r: 6, c: 3, cands: [1, 9], role: 'evidence' },
      { r: 6, c: 4, cands: [5, 6, 9], elim: [5, 9], role: 'action' },
      { r: 6, c: 5, value: 2, role: 'context' },
      { r: 6, c: 6, value: 8, role: 'context' },
      { r: 6, c: 7, cands: [5, 9], role: 'evidence' },
      { r: 6, c: 8, cands: [3, 5, 9], elim: [5, 9], role: 'action' },
    ],
  },

  hidden_triple: {
    caption: 'Digits 2, 6, and 8 only appear in three cells of this column (blue). Remove all other candidates from those cells.',
    cells: [
      { r: 0, c: 4, value: 5, role: 'context' },
      { r: 1, c: 4, cands: [2, 3, 6, 8], elim: [3], role: 'evidence' },
      { r: 2, c: 4, value: 7, role: 'context' },
      { r: 3, c: 4, value: 9, role: 'context' },
      { r: 4, c: 4, cands: [2, 4, 6, 8], elim: [4], role: 'evidence' },
      { r: 5, c: 4, value: 1, role: 'context' },
      { r: 6, c: 4, value: 3, role: 'context' },
      { r: 7, c: 4, cands: [2, 6, 8, 9], elim: [9], role: 'evidence' },
      { r: 8, c: 4, value: 4, role: 'context' },
    ],
  },

  naked_quad: {
    caption: 'Four cells in this box share only {1, 4, 6, 9} (blue). Eliminate those digits from the remaining cell (orange).',
    cells: [
      { r: 0, c: 6, cands: [1, 4], role: 'evidence' },
      { r: 0, c: 7, cands: [4, 6], role: 'evidence' },
      { r: 0, c: 8, cands: [1, 9], role: 'evidence' },
      { r: 1, c: 6, value: 7, role: 'context' },
      { r: 1, c: 7, cands: [1, 3, 4, 6, 9], elim: [1, 4, 6, 9], role: 'action' },
      { r: 1, c: 8, value: 2, role: 'context' },
      { r: 2, c: 6, cands: [1, 6, 9], role: 'evidence' },
      { r: 2, c: 7, value: 8, role: 'context' },
      { r: 2, c: 8, value: 5, role: 'context' },
    ],
  },

  hidden_quad: {
    caption: 'Digits 1, 3, 5, and 7 only appear in four cells of this row (blue). Remove all other candidates from those cells.',
    cells: [
      { r: 8, c: 0, value: 9, role: 'context' },
      { r: 8, c: 1, cands: [1, 3, 6, 7], elim: [6], role: 'evidence' },
      { r: 8, c: 2, value: 4, role: 'context' },
      { r: 8, c: 3, cands: [1, 5, 7, 8], elim: [8], role: 'evidence' },
      { r: 8, c: 4, value: 6, role: 'context' },
      { r: 8, c: 5, cands: [3, 5, 7, 2], elim: [2], role: 'evidence' },
      { r: 8, c: 6, value: 8, role: 'context' },
      { r: 8, c: 7, cands: [1, 3, 5, 4], elim: [4], role: 'evidence' },
      { r: 8, c: 8, value: 2, role: 'context' },
    ],
  },

  x_wing: {
    caption: 'Digit 6 appears in exactly two cells in each of rows 2 and 6, both in columns 3 and 8 (blue). Eliminate 6 from those columns everywhere else (orange).',
    cells: [
      { r: 1, c: 2, cands: [6], role: 'evidence' },
      { r: 1, c: 7, cands: [6], role: 'evidence' },
      { r: 5, c: 2, cands: [6], role: 'evidence' },
      { r: 5, c: 7, cands: [6], role: 'evidence' },
      { r: 0, c: 2, cands: [6, 3], elim: [6], role: 'action' },
      { r: 3, c: 2, cands: [6, 8], elim: [6], role: 'action' },
      { r: 7, c: 2, cands: [6, 4], elim: [6], role: 'action' },
      { r: 2, c: 7, cands: [6, 9], elim: [6], role: 'action' },
      { r: 6, c: 7, cands: [6, 1], elim: [6], role: 'action' },
      { r: 8, c: 7, cands: [6, 5], elim: [6], role: 'action' },
    ],
  },

  swordfish: {
    caption: 'Digit 9 across rows 1, 5, and 8 is confined to columns 2, 5, and 9 (blue). Eliminate 9 from those columns in all other rows (orange).',
    cells: [
      { r: 0, c: 1, cands: [9], role: 'evidence' },
      { r: 0, c: 4, cands: [9], role: 'evidence' },
      { r: 4, c: 1, cands: [9], role: 'evidence' },
      { r: 4, c: 8, cands: [9], role: 'evidence' },
      { r: 7, c: 4, cands: [9], role: 'evidence' },
      { r: 7, c: 8, cands: [9], role: 'evidence' },
      { r: 2, c: 1, cands: [9, 3], elim: [9], role: 'action' },
      { r: 5, c: 4, cands: [9, 6], elim: [9], role: 'action' },
      { r: 3, c: 8, cands: [9, 2], elim: [9], role: 'action' },
      { r: 6, c: 8, cands: [9, 7], elim: [9], role: 'action' },
    ],
  },

  unique_rectangle: {
    caption: 'Three corners of the rectangle have only {2, 7}. If the fourth also had only {2, 7}, two solutions would exist. Eliminate {2, 7} from it (orange), leaving only 5.',
    cells: [
      { r: 0, c: 1, cands: [2, 7], role: 'evidence' },
      { r: 0, c: 6, cands: [2, 7], role: 'evidence' },
      { r: 4, c: 1, cands: [2, 7], role: 'evidence' },
      { r: 4, c: 6, cands: [2, 5, 7], elim: [2, 7], role: 'action' },
    ],
  },

  y_wing: {
    caption: 'Pivot {3,7} (blue, centre) connects to pincers {3,5} and {5,7}. Any cell seeing both pincers cannot be 5 (orange).',
    cells: [
      { r: 4, c: 0, cands: [3, 5], role: 'evidence' },
      { r: 4, c: 4, cands: [3, 7], role: 'evidence' },
      { r: 7, c: 4, cands: [5, 7], role: 'evidence' },
      { r: 7, c: 0, cands: [5, 2], elim: [5], role: 'action' },
      { r: 7, c: 1, cands: [5, 8], elim: [5], role: 'action' },
    ],
  },

  w_wing: {
    caption: 'Two {4,9} cells (blue corners) are connected via a strong link on 4 through column 6. Any cell seeing both cannot be 9 (orange).',
    cells: [
      { r: 2, c: 2, cands: [4, 9], role: 'evidence' },
      { r: 7, c: 7, cands: [4, 9], role: 'evidence' },
      { r: 2, c: 5, cands: [4, 1], role: 'evidence' },
      { r: 7, c: 5, cands: [4, 3], role: 'evidence' },
      { r: 2, c: 7, cands: [9, 6], elim: [9], role: 'action' },
      { r: 7, c: 2, cands: [9, 8], elim: [9], role: 'action' },
    ],
  },

  xyz_wing: {
    caption: 'Pivot {1,3,7} (blue, centre-left) connects to pincers {1,7} and {3,7}. All three hold 7, so any cell seeing all three cannot be 7 (orange).',
    cells: [
      { r: 3, c: 3, cands: [1, 3, 7], role: 'evidence' },
      { r: 3, c: 7, cands: [1, 7], role: 'evidence' },
      { r: 6, c: 3, cands: [3, 7], role: 'evidence' },
      { r: 6, c: 7, cands: [7, 5], elim: [7], role: 'action' },
    ],
  },

  jellyfish: {
    caption: 'Digit 3 across rows 1, 3, 6, and 8 is confined to columns 2, 4, 7, and 9 (blue). Eliminate 3 from those columns in all other rows (orange).',
    cells: [
      { r: 0, c: 1, cands: [3], role: 'evidence' },
      { r: 0, c: 3, cands: [3], role: 'evidence' },
      { r: 2, c: 3, cands: [3], role: 'evidence' },
      { r: 2, c: 6, cands: [3], role: 'evidence' },
      { r: 5, c: 1, cands: [3], role: 'evidence' },
      { r: 5, c: 8, cands: [3], role: 'evidence' },
      { r: 7, c: 6, cands: [3], role: 'evidence' },
      { r: 7, c: 8, cands: [3], role: 'evidence' },
      { r: 3, c: 1, cands: [3, 5], elim: [3], role: 'action' },
      { r: 4, c: 3, cands: [3, 8], elim: [3], role: 'action' },
      { r: 1, c: 6, cands: [3, 2], elim: [3], role: 'action' },
      { r: 6, c: 8, cands: [3, 7], elim: [3], role: 'action' },
    ],
  },

  skyscraper: {
    caption: 'Digit 5 in rows 1 and 3 share column 5 as trunk (blue). Tips R1C8 and R3C9 land in the same box — cells in that box seeing both tips cannot be 5 (orange).',
    cells: [
      { r: 0, c: 4, cands: [5], role: 'evidence' },
      { r: 2, c: 4, cands: [5], role: 'evidence' },
      { r: 0, c: 7, cands: [5], role: 'evidence' },
      { r: 2, c: 8, cands: [5], role: 'evidence' },
      { r: 1, c: 7, cands: [5, 2], elim: [5], role: 'action' },
      { r: 1, c: 8, cands: [5, 3], elim: [5], role: 'action' },
    ],
  },

  two_string_kite: {
    caption: 'Digit 7: row-string R3C2–R3C8 and column-string R1C2–R7C2 share box corner R3C2. Tips R3C8 and R7C2 force an elimination at R7C8 (orange).',
    cells: [
      { r: 2, c: 1, cands: [7], role: 'evidence' },
      { r: 0, c: 1, cands: [7], role: 'evidence' },
      { r: 2, c: 7, cands: [7], role: 'evidence' },
      { r: 6, c: 1, cands: [7], role: 'evidence' },
      { r: 6, c: 7, cands: [7, 3], elim: [7], role: 'action' },
    ],
  },

  empty_rectangle: {
    caption: 'Digit 4 in the centre box forms a cross on row 5 and column 5. Strong link R2C8–R5C8 forces elimination of 4 from R2C5 (orange).',
    cells: [
      { r: 3, c: 4, cands: [4], role: 'evidence' },
      { r: 4, c: 3, cands: [4], role: 'evidence' },
      { r: 4, c: 4, cands: [4], role: 'evidence' },
      { r: 1, c: 7, cands: [4], role: 'evidence' },
      { r: 4, c: 7, cands: [4], role: 'evidence' },
      { r: 1, c: 4, cands: [4, 9], elim: [4], role: 'action' },
    ],
  },

  simple_coloring: {
    caption: 'Digit 6: four-cell chain alternates colors (blue/orange). R4C2 sits in column 2 between a blue cell (R1C2) and an orange cell (R7C2) — it sees both colors, so eliminate 6 from R4C2.',
    cells: [
      { r: 0, c: 1, cands: [6], role: 'evidence' },
      { r: 0, c: 5, cands: [6], role: 'evidence' },
      { r: 6, c: 1, cands: [6], role: 'evidence' },
      { r: 6, c: 5, cands: [6], role: 'evidence' },
      { r: 3, c: 1, cands: [6, 4], elim: [6], role: 'action' },
    ],
  },

  xy_chain: {
    caption: 'XY-Chain on 9: {9,4}→{4,5}→{5,9}. Start R1C1 and end R4C8 both hold 9. R1C8 sees start (row 1) and end (col 8) — eliminate 9 from R1C8 (orange).',
    cells: [
      { r: 0, c: 0, cands: [9, 4], role: 'evidence' },
      { r: 3, c: 0, cands: [4, 5], role: 'evidence' },
      { r: 3, c: 7, cands: [5, 9], role: 'evidence' },
      { r: 0, c: 7, cands: [9, 1], elim: [9], role: 'action' },
    ],
  },
};
