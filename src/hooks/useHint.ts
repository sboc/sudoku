import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Hint } from '../core/humanSolver';
import { TECHNIQUE_WEIGHT } from '../core/grader';
import { penaltyLabel, HINT_REVEAL_COST, HINT_APPLY_COST } from '../core/utils';

interface UseHintParams {
  nextHint: Hint | null;
  userGrid: number[];
  autoSolveRef: MutableRefObject<boolean>;
  setElapsed: Dispatch<SetStateAction<number>>;
  showTimerFlash: (msg: string) => void;
  placeDigitDirect: (cell: number, digit: number) => void;
  applyEliminations: (elims: { cell: number; digit: number }[]) => void;
}

export const useHint = ({
  nextHint,
  userGrid,
  autoSolveRef,
  setElapsed,
  showTimerFlash,
  placeDigitDirect,
  applyEliminations,
}: UseHintParams) => {
  const [activeHint, setActiveHint] = useState<Hint | null>(null);
  const [hintPhase, setHintPhase] = useState<'evidence' | 'action'>('evidence');
  const [hintRevealed, setHintRevealed] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissHint = useCallback(() => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    setActiveHint(null);
    setHintRevealed(false);
    setHintPhase('evidence');
  }, []);

  useEffect(() => {
    if (!autoSolveRef.current) dismissHint();
  }, [userGrid, dismissHint, autoSolveRef]);

  useEffect(() => () => { if (hintTimerRef.current) clearTimeout(hintTimerRef.current); }, []);

  const applyHintAction = useCallback((hint: Hint) => {
    if (hint.isPlacement && hint.digit !== undefined) {
      placeDigitDirect(hint.actionCells[0], hint.digit);
    } else if (hint.eliminations.length > 0) {
      applyEliminations(hint.eliminations);
    }
  }, [placeDigitDirect, applyEliminations]);

  const handleHelp = () => {
    if (activeHint) { dismissHint(); return; }
    if (!nextHint) return;
    setActiveHint(nextHint);
    setHintPhase('evidence');
    setHintRevealed(false);
  };

  const handleShowWhere = () => {
    if (!activeHint || hintRevealed) return;
    const w = TECHNIQUE_WEIGHT[activeHint.technique];
    setElapsed(s => s + HINT_REVEAL_COST * w);
    showTimerFlash(penaltyLabel(HINT_REVEAL_COST * w));
    setHintRevealed(true);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHintPhase('action'), 700);
  };

  const handleApplyHint = () => {
    if (!activeHint) return;
    setElapsed(s => s + HINT_APPLY_COST);
    showTimerFlash(penaltyLabel(HINT_APPLY_COST));
    applyHintAction(activeHint);
    dismissHint();
  };

  const hintEvidenceSet = useMemo(
    () => (activeHint && hintRevealed ? new Set(activeHint.evidenceCells) : null),
    [activeHint, hintRevealed],
  );
  const hintActionSet = useMemo(
    () => (activeHint && hintRevealed && hintPhase === 'action' ? new Set(activeHint.actionCells) : null),
    [activeHint, hintRevealed, hintPhase],
  );

  return {
    activeHint, setActiveHint,
    hintPhase, setHintPhase,
    hintRevealed, setHintRevealed,
    dismissHint,
    handleHelp, handleShowWhere, handleApplyHint,
    hintEvidenceSet, hintActionSet,
    applyHintAction,
  };
};
