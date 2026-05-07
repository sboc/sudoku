import type { Technique } from './humanSolver';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master' | 'legend' | 'unsolvable';

export const TECHNIQUE_WEIGHT: Record<Technique, number> = {
  naked_single: 1,
  hidden_single: 2,
  naked_pair: 3,
  hidden_pair: 4,
  naked_triple: 5,
  hidden_triple: 6,
  naked_quad: 6,
  hidden_quad: 7,
  pointing_pair: 3,
  box_line_reduction: 3,
  x_wing: 7,
  swordfish: 8,
  y_wing: 8,
  xyz_wing: 9,
  w_wing: 8,
};

export const DIFFICULTY_COLOR: Record<string, string> = {
  easy: '#4caf50',
  medium: '#2196f3',
  hard: '#ff9800',
  expert: '#f44336',
  master: '#9c27b0',
  legend: '#311b92',
  unsolvable: '#9e9e9e',
};

export const DIFFICULTY_BANDS = [
  { label: 'Easy',   range: '≤ 4',   color: DIFFICULTY_COLOR.easy },
  { label: 'Medium', range: '5-10',  color: DIFFICULTY_COLOR.medium },
  { label: 'Hard',   range: '11-17', color: DIFFICULTY_COLOR.hard },
  { label: 'Expert', range: '18-24', color: DIFFICULTY_COLOR.expert },
  { label: 'Master', range: '25-32', color: DIFFICULTY_COLOR.master },
  { label: 'Legend', range: '> 32',  color: DIFFICULTY_COLOR.legend },
];

export interface Grade {
  difficulty: Difficulty;
  score: number;
  techniques: Technique[];
}

export function gradePuzzle(techniques: Set<Technique>, solved: boolean): Grade {
  if (!solved) {
    return { difficulty: 'unsolvable', score: 999, techniques: [...techniques] };
  }

  const techniqueList = [...techniques];
  const score = techniqueList.reduce((sum, t) => sum + TECHNIQUE_WEIGHT[t], 0);

  let difficulty: Difficulty;
  if (score <= 4) difficulty = 'easy';
  else if (score <= 10) difficulty = 'medium';
  else if (score <= 17) difficulty = 'hard';
  else if (score <= 24) difficulty = 'expert';
  else if (score <= 32) difficulty = 'master';
  else difficulty = 'legend';

  return { difficulty, score, techniques: techniqueList };
}
