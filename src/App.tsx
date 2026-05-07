import { useState, useEffect } from 'react';
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

const encodePuzzle = (puzzle: number[]): string => {
  return puzzle.join('');
};

const puzzleFromString = (puzzleString: string): GeneratedPuzzle | null => {
  const puzzle = puzzleString.split('').map(Number);
  if (puzzle.length !== 81 || puzzle.some(isNaN)) return null;
  const solution = solvePuzzle(puzzle);
  if (!solution) return null;
  const humanResult = humanSolve(puzzle);
  const grade = gradePuzzle(humanResult.techniques, humanResult.solved);
  return { puzzle, solution, grade };
};

const loadFromHash = (hash: string): GeneratedPuzzle | null => {
  const match = hash.match(/^#game\/([0-9]{81})$/);
  if (!match) return null;
  return puzzleFromString(match[1]);
};

const findUnfinishedGame = (): UnfinishedGame | null => {
  for (const key of localKeys()) {
    if (!key.startsWith('sudoku:') || key.length !== 88) continue;
    const save = loadSave(key);
    if (save && !save.sudoku.solved && !save.sudoku.failed) {
      return { puzzleString: key.slice(7), elapsed: save.elapsed, difficulty: save.difficulty ?? 'unknown' };
    }
  }
  return null;
};

const App = () => {
  const { counts, takePuzzle } = usePuzzlePool();
  const [activePuzzle, setActivePuzzle] = useState<GeneratedPuzzle | null>(() =>
    loadFromHash(window.location.hash)
  );

  const [unfinished, setUnfinished] = useState<UnfinishedGame | null>(
    () => findUnfinishedGame()
  );

  // Re-scan after activePuzzle clears — runs after unmount cleanup (persistGame), so save is in localStorage
  useEffect(() => {
    if (!activePuzzle) setUnfinished(findUnfinishedGame());
  }, [activePuzzle]);

  useEffect(() => {
    const handlePopState = () => {
      setActivePuzzle(loadFromHash(window.location.hash));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelect = (difficulty: PlayableDifficulty) => {
    const puzzle = takePuzzle(difficulty);
    if (!puzzle) return;
    setActivePuzzle(puzzle);
    history.pushState(null, '', `#game/${encodePuzzle(puzzle.puzzle)}`);
  };

  const handleContinue = () => {
    if (!unfinished) return;
    const puzzle = puzzleFromString(unfinished.puzzleString);
    if (!puzzle) return;
    setActivePuzzle(puzzle);
    history.pushState(null, '', `#game/${unfinished.puzzleString}`);
  };

  const handleBack = () => {
    history.replaceState(null, '', window.location.pathname);
    setActivePuzzle(null);
  };

  if (activePuzzle) {
    return <SudokuBoard initialPuzzle={activePuzzle} onBack={handleBack} />;
  }

  return <StartPage counts={counts} onSelect={handleSelect} unfinished={unfinished} onContinue={handleContinue} />;
};

export default App;
