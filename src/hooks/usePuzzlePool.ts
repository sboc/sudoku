import { useEffect, useRef, useState } from 'react';
import { generatePuzzle } from '../core/generator';
import { humanSolve } from '../core/humanSolver';
import { gradePuzzle, type Grade } from '../core/grader';
import { localGet, localSet, localRemove } from '../core/persistence';

export type PlayableDifficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master' | 'legend';

export interface GeneratedPuzzle {
  puzzle: number[];
  solution: number[];
  grade: Grade;
}

const DIFFICULTIES: PlayableDifficulty[] = ['easy', 'medium', 'hard', 'expert', 'master', 'legend'];
const TARGET: Record<PlayableDifficulty, number> = {
  easy: 3, medium: 3, hard: 3, expert: 2, master: 1, legend: 1,
};

type Pool = Record<PlayableDifficulty, GeneratedPuzzle[]>;

function poolStorageKey(d: PlayableDifficulty) {
  return `sudoku:pool:${d}`;
}

function isValidPuzzle(p: unknown): p is GeneratedPuzzle {
  if (!p || typeof p !== 'object') return false;
  const { puzzle, solution, grade } = p as Record<string, unknown>;
  return (
    Array.isArray(puzzle) && puzzle.length === 81 &&
    Array.isArray(solution) && solution.length === 81 &&
    !!grade && typeof (grade as Record<string, unknown>).difficulty === 'string'
  );
}

function loadPersistedPool(d: PlayableDifficulty): GeneratedPuzzle[] {
  const raw = localGet(poolStorageKey(d));
  try {
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(isValidPuzzle) : [];
  } catch { return []; }
}

function persistPool(d: PlayableDifficulty, puzzles: GeneratedPuzzle[]) {
  if (puzzles.length === 0) localRemove(poolStorageKey(d));
  else localSet(poolStorageKey(d), JSON.stringify(puzzles));
}

export function usePuzzlePool() {
  // Load persisted master/legend puzzles once so there is no flash of "Preparing..."
  // when the component mounts with already-generated puzzles from a prior session.
  const [initialPool] = useState<Pool>(() => {
    const pool: Pool = { easy: [], medium: [], hard: [], expert: [], master: [], legend: [] };
    pool.master = loadPersistedPool('master');
    pool.legend = loadPersistedPool('legend');
    return pool;
  });
  const poolRef = useRef(initialPool);
  const [counts, setCounts] = useState<Record<PlayableDifficulty, number>>({
    easy: 0, medium: 0, hard: 0, expert: 0,
    master: initialPool.master.length,
    legend: initialPool.legend.length,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false);
  const mountedRef = useRef(true);
  const restartRef = useRef<() => void>(() => {});

  useEffect(() => {
    mountedRef.current = true;

    function generateNext() {
      if (!mountedRef.current) { runningRef.current = false; return; }

      const needsMore = DIFFICULTIES.some(d => poolRef.current[d].length < TARGET[d]);
      if (!needsMore) { runningRef.current = false; return; }

      const { puzzle, solution } = generatePuzzle();
      const humanResult = humanSolve(puzzle);
      const grade = gradePuzzle(humanResult.techniques, humanResult.solved);
      const d = grade.difficulty;

      if (d !== 'unsolvable') {
        if (poolRef.current[d].length < TARGET[d]) {
          poolRef.current[d].push({ puzzle, solution, grade });
          if (d === 'master' || d === 'legend') persistPool(d, poolRef.current[d]);
          setCounts(prev => ({ ...prev, [d]: prev[d] + 1 }));
        }
      }

      timerRef.current = setTimeout(generateNext, 0);
    }

    restartRef.current = generateNext;
    runningRef.current = true;
    timerRef.current = setTimeout(generateNext, 0);

    return () => {
      mountedRef.current = false;
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      runningRef.current = false;
    };
  }, []);

  function takePuzzle(difficulty: PlayableDifficulty): GeneratedPuzzle | undefined {
    const pool = poolRef.current[difficulty];
    if (pool.length === 0) return undefined;
    const item = pool.shift()!;
    if (difficulty === 'master' || difficulty === 'legend') persistPool(difficulty, pool);
    setCounts(prev => ({ ...prev, [difficulty]: Math.max(0, prev[difficulty] - 1) }));

    if (!runningRef.current && mountedRef.current) {
      runningRef.current = true;
      timerRef.current = setTimeout(restartRef.current, 0);
    }

    return item;
  }

  return { counts, takePuzzle };
}
