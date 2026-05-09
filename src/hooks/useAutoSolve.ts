import { useState, useEffect, useRef } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Hint } from '../core/humanSolver';
import { findNextHint } from '../core/humanSolver';
import { TECHNIQUE_WEIGHT } from '../core/grader';
import { penaltyLabel, HINT_REVEAL_COST } from '../core/utils';

const AUTOSOLVE_STEP_COST = 15;
const AUTOSOLVE_APPLY_COST = 120;

interface UseAutoSolveParams {
  userGridRef: MutableRefObject<number[]>;
  notesRef: MutableRefObject<Set<number>[]>;
  solvedRef: MutableRefObject<boolean>;
  failedRef: MutableRefObject<boolean>;
  autoSolveRef: MutableRefObject<boolean>;
  solution: number[];
  setElapsed: Dispatch<SetStateAction<number>>;
  showTimerFlash: (msg: string) => void;
  setActiveHint: (hint: Hint | null) => void;
  setHintPhase: (phase: 'evidence' | 'action') => void;
  setHintRevealed: (v: boolean) => void;
  applyHintAction: (hint: Hint) => void;
  fillAllNotes: () => void;
}

export const useAutoSolve = ({
  userGridRef,
  notesRef,
  solvedRef,
  failedRef,
  autoSolveRef,
  solution,
  setElapsed,
  showTimerFlash,
  setActiveHint,
  setHintPhase,
  setHintRevealed,
  applyHintAction,
  fillAllNotes,
}: UseAutoSolveParams) => {
  const [autoSolve, setAutoSolve] = useState(false);
  const autoSolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (autoSolveTimerRef.current) clearTimeout(autoSolveTimerRef.current); }, []);

  const runAutoSolve = () => {
    if (!autoSolveRef.current) return;
    if (solvedRef.current || failedRef.current) {
      autoSolveRef.current = false;
      setAutoSolve(false);
      setActiveHint(null);
      return;
    }
    const hint = findNextHint(userGridRef.current, notesRef.current, solution);
    if (!hint) {
      autoSolveRef.current = false;
      setAutoSolve(false);
      setActiveHint(null);
      return;
    }
    const w = TECHNIQUE_WEIGHT[hint.technique];
    setElapsed(s => s + AUTOSOLVE_STEP_COST * w);
    showTimerFlash(penaltyLabel(AUTOSOLVE_STEP_COST * w));
    setActiveHint(hint);
    setHintPhase('evidence');
    setHintRevealed(true);
    autoSolveTimerRef.current = setTimeout(() => {
      if (!autoSolveRef.current || failedRef.current) return;
      setElapsed(s => s + HINT_REVEAL_COST * w);
      showTimerFlash(penaltyLabel(HINT_REVEAL_COST * w));
      setHintPhase('action');
      autoSolveTimerRef.current = setTimeout(() => {
        if (!autoSolveRef.current || failedRef.current) return;
        setElapsed(s => s + AUTOSOLVE_APPLY_COST * w);
        showTimerFlash(penaltyLabel(AUTOSOLVE_APPLY_COST * w));
        applyHintAction(hint);
        setActiveHint(null);
        autoSolveTimerRef.current = setTimeout(runAutoSolve, 300);
      }, 500);
    }, 500);
  };

  const toggleAutoSolve = () => {
    if (autoSolveRef.current) {
      autoSolveRef.current = false;
      setAutoSolve(false);
      if (autoSolveTimerRef.current) clearTimeout(autoSolveTimerRef.current);
      setActiveHint(null);
    } else {
      fillAllNotes();
      setElapsed(s => s + 30);
      showTimerFlash('+30s');
      autoSolveRef.current = true;
      setAutoSolve(true);
      // Give fillAllNotes a tick to propagate before the first hint search
      autoSolveTimerRef.current = setTimeout(runAutoSolve, 100);
    }
  };

  return { autoSolve, toggleAutoSolve };
};
