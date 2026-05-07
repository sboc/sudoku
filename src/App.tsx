import { useState, useEffect, useMemo } from 'react';
import { usePuzzlePool, type GeneratedPuzzle, type PlayableDifficulty } from './hooks/usePuzzlePool';
import { StartPage } from './components/StartPage';
import { SudokuBoard } from './components/SudokuBoard';
import { loadSave, localKeys } from './core/persistence';
import { solvePuzzle } from './core/generator';
import { humanSolve } from './core/humanSolver';
import { gradePuzzle } from './core/grader';

export interface UnfinishedGame {
  puzzleString: string;
  elapsed: number;
  difficulty: string;
}

function encodePuzzle(puzzle: number[]): string {
  return puzzle.join('');
}

function puzzleFromString(puzzleString: string): GeneratedPuzzle | null {
  const puzzle = puzzleString.split('').map(Number);
  if (puzzle.length !== 81 || puzzle.some(isNaN)) return null;
  const solution = solvePuzzle(puzzle);
  if (!solution) return null;
  const humanResult = humanSolve(puzzle);
  const grade = gradePuzzle(humanResult.techniques, humanResult.solved);
  return { puzzle, solution, grade };
}

function loadFromHash(hash: string): GeneratedPuzzle | null {
  const match = hash.match(/^#game\/([0-9]{81})$/);
  if (!match) return null;
  return puzzleFromString(match[1]);
}

function findUnfinishedGame(): UnfinishedGame | null {
  for (const key of localKeys()) {
    if (!key.startsWith('sudoku:') || key.length !== 88) continue;
    const save = loadSave(key);
    if (save && !save.sudoku.solved && !save.sudoku.failed) {
      return { puzzleString: key.slice(7), elapsed: save.elapsed, difficulty: save.difficulty ?? 'unknown' };
    }
  }
  return null;
}

export default function App() {
  const { counts, takePuzzle } = usePuzzlePool();
  const [activePuzzle, setActivePuzzle] = useState<GeneratedPuzzle | null>(() =>
    loadFromHash(window.location.hash)
  );

  // Re-scan for unfinished games whenever the active puzzle changes (e.g. returning to start page)
  const unfinished = useMemo<UnfinishedGame | null>(
    () => (activePuzzle ? null : findUnfinishedGame()),
    [activePuzzle]
  );

  useEffect(() => {
    function handlePopState() {
      setActivePuzzle(loadFromHash(window.location.hash));
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function handleSelect(difficulty: PlayableDifficulty) {
    const puzzle = takePuzzle(difficulty);
    if (!puzzle) return;
    setActivePuzzle(puzzle);
    history.pushState(null, '', `#game/${encodePuzzle(puzzle.puzzle)}`);
  }

  function handleContinue() {
    if (!unfinished) return;
    const puzzle = puzzleFromString(unfinished.puzzleString);
    if (!puzzle) return;
    setActivePuzzle(puzzle);
    history.pushState(null, '', `#game/${unfinished.puzzleString}`);
  }

  function handleBack() {
    history.back();
  }

  if (activePuzzle) {
    return <SudokuBoard initialPuzzle={activePuzzle} onBack={handleBack} />;
  }

  return <StartPage counts={counts} onSelect={handleSelect} unfinished={unfinished} onContinue={handleContinue} />;
}
