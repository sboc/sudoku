export interface TechniqueExplanation {
  summary: string;
  steps: string[];
}

export const TECHNIQUE_LABEL: Record<string, string> = {
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
  y_wing: 'Y-Wing',
  xyz_wing: 'XYZ-Wing',
  w_wing: 'W-Wing',
};

export const TECHNIQUE_EXPLANATIONS: Record<string, TechniqueExplanation> = {
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
  xyz_wing: {
    summary: 'Like Y-Wing but the pivot has three candidates {X,Y,Z} instead of two. The pivot and both pincers all hold Z, so Z is eliminated from any cell that sees all three, giving a tighter elimination zone than Y-Wing.',
    steps: [
      'Find a pivot cell with exactly three candidates {X, Y, Z}.',
      'Find a pincer that sees the pivot with candidates {X, Z}.',
      'Find another pincer that sees the pivot with candidates {Y, Z}.',
      'One of the three cells must hold Z. Eliminate Z from any cell that sees the pivot and both pincers.',
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
};
