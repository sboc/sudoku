import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSudoku } from '../hooks/useSudoku';
import type { GeneratedPuzzle } from '../hooks/usePuzzlePool';
import { loadSave, persistGame, localRemove } from '../core/persistence';
import { PencilIcon, FillAllIcon, HelpIcon, ShareIcon, PowerIcon, CheckIcon, CrossIcon } from './Icons';
import { findNextHint } from '../core/humanSolver';
import { TechniqueHelpModal } from './TechniqueHelpModal';
import { DIFFICULTY_COLOR } from '../core/grader';
import { TECHNIQUE_LABEL } from '../core/techniqueHelp';
import { formatTime } from '../core/utils';
import { useTimer } from '../hooks/useTimer';
import { useCelebration } from '../hooks/useCelebration';
import { useHint } from '../hooks/useHint';
import { useAutoSolve } from '../hooks/useAutoSolve';
import './SudokuBoard.css';

function CelebrationNumber({ value, index }: { value: number; index: number }) {
  const [vars] = useState<React.CSSProperties>(() => {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const dx = col - 4;
    const dy = row - 4;
    const d = Math.sqrt(dx * dx + dy * dy) || 0.5;
    const burst = 80 + Math.random() * 140;
    return {
      '--x1': `${(dx / d) * burst}px`,
      '--y1': `${(dy / d) * burst}px`,
      '--x2': `${(Math.random() - 0.5) * 420}px`,
      '--y2': `${(Math.random() - 0.5) * 420}px`,
      '--x3': `${(Math.random() - 0.5) * 300}px`,
      '--y3': `${(Math.random() - 0.5) * 300}px`,
      '--rot': `${(Math.random() - 0.5) * 720}deg`,
    } as React.CSSProperties;
  });
  return <span className="cel-num" style={vars}>{value}</span>;
}

interface Props {
  initialPuzzle: GeneratedPuzzle;
  onBack: () => void;
}

export function SudokuBoard({ initialPuzzle, onBack }: Props) {
  const storageKey = `sudoku:${initialPuzzle.puzzle.join('')}`;
  const savedGame = useMemo(() => loadSave(storageKey), [storageKey]);

  const { state, selectCell, enterDigit, clearCell, toggleNotesMode, fillAllNotes, placeDigitDirect, applyEliminations } = useSudoku(initialPuzzle, savedGame?.sudoku);
  const { puzzle, userGrid, selected, notes, notesMode, penaltyCount, failed, solved } = state;
  const { grade } = initialPuzzle;

  const [copied, setCopied] = useState(false);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [showTechniqueHelp, setShowTechniqueHelp] = useState(false);
  const closeTechniqueHelp = useCallback(() => setShowTechniqueHelp(false), []);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Declare refs before hooks that receive them; synced via useLayoutEffect below
  const selectedRef = useRef(selected);
  const userGridRef = useRef(userGrid);
  const notesRef = useRef(notes);
  const solvedRef = useRef(solved);
  const failedRef = useRef(failed);
  const autoSolveRef = useRef(false);

  const { elapsed, setElapsed, timerFlash, timerFlashKey, showTimerFlash } = useTimer(
    savedGame?.elapsed ?? 0,
    savedGame?.sudoku.penaltyCount ?? 0,
    penaltyCount,
    solved,
    failed,
  );

  const { celebrating, celebrationKey } = useCelebration(solved, failed, solvedRef, failedRef);

  const nextHint = useMemo(() => findNextHint(state.userGrid, state.notes), [state.userGrid, state.notes]);

  const {
    activeHint, setActiveHint,
    setHintPhase,
    hintRevealed, setHintRevealed,
    dismissHint,
    handleHelp, handleShowWhere, handleApplyHint,
    hintEvidenceSet, hintActionSet,
    applyHintAction,
  } = useHint({ nextHint, userGrid, autoSolveRef, setElapsed, showTimerFlash, placeDigitDirect, applyEliminations });

  const { autoSolve, toggleAutoSolve } = useAutoSolve({
    userGridRef, notesRef, solvedRef, failedRef, autoSolveRef,
    setElapsed, showTimerFlash,
    setActiveHint, setHintPhase, setHintRevealed,
    applyHintAction, fillAllNotes,
  });

  // Keep refs current after every render (in effect, not during render)
  const activeHintRef = useRef(activeHint);
  const saveDataRef = useRef({ state, elapsed, storageKey, difficulty: grade.difficulty });
  const exitedRef = useRef(false);
  useLayoutEffect(() => {
    selectedRef.current = selected;
    userGridRef.current = userGrid;
    notesRef.current = notes;
    solvedRef.current = solved;
    failedRef.current = failed;
    activeHintRef.current = activeHint;
    saveDataRef.current = { state, elapsed, storageKey, difficulty: grade.difficulty };
  });

  useEffect(() => {
    return () => {
      if (!exitedRef.current) persistGame(saveDataRef.current);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  // Skip saving a pristine game that wasn't loaded from a save
  useEffect(() => {
    const hasMadeProgress =
      state.penaltyCount > 0 ||
      state.notes.some(s => s.size > 0) ||
      state.userGrid.some((v, i) => v !== state.puzzle[i]);
    if (!hasMadeProgress && !savedGame) return;
    persistGame(saveDataRef.current);
  }, [state.userGrid, state.notes, state.penaltyCount, state.failed, state.solved, state.notesMode, state.puzzle, savedGame]);

  const effectiveConfirmingEnd = confirmingEnd && !solved && !failed;

  const selectedFilled = selected !== null && userGrid[selected] !== 0;

  const prevPenaltyCountRef = useRef(penaltyCount);
  const [flashingCell, setFlashingCell] = useState<number | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (penaltyCount > prevPenaltyCountRef.current) {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      setFlashingCell(selectedRef.current);
      flashTimerRef.current = setTimeout(() => setFlashingCell(null), 600);
    }
    prevPenaltyCountRef.current = penaltyCount;
  }, [penaltyCount]);

  const puzzleBlockedDigits = useMemo(() => {
    if (selected === null || userGrid[selected] !== 0) return new Set<number>();
    const row = Math.floor(selected / 9);
    const col = selected % 9;
    const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
    const blocked = new Set<number>();
    for (let k = 0; k < 9; k++) {
      if (puzzle[row * 9 + k]) blocked.add(puzzle[row * 9 + k]);
      if (puzzle[k * 9 + col]) blocked.add(puzzle[k * 9 + col]);
      const br = Math.floor(box / 3) * 3 + Math.floor(k / 3);
      const bc = (box % 3) * 3 + (k % 3);
      if (puzzle[br * 9 + bc]) blocked.add(puzzle[br * 9 + bc]);
    }
    return blocked;
  }, [selected, puzzle, userGrid]);

  function handleFillAllNotes() {
    fillAllNotes();
    setElapsed(s => s + 30);
    showTimerFlash('+30s');
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (solvedRef.current || failedRef.current) return;
      const sel = selectedRef.current;
      const locked = !!activeHintRef.current || autoSolveRef.current;
      if (e.key === 'Escape') { if (sel !== null) selectCell(sel); }
      else if (e.key === 'n' || e.key === 'N') { if (!locked) toggleNotesMode(); }
      else if (e.key >= '1' && e.key <= '9') { if (!locked) enterDigit(Number(e.key)); }
      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { if (!locked) clearCell(); }
      else if (e.key === 'ArrowRight') selectCell(sel !== null ? (sel % 9 < 8 ? sel + 1 : sel) : 0);
      else if (e.key === 'ArrowLeft') selectCell(sel !== null ? (sel % 9 > 0 ? sel - 1 : sel) : 0);
      else if (e.key === 'ArrowDown') selectCell(sel !== null ? (sel + 9 <= 80 ? sel + 9 : sel) : 0);
      else if (e.key === 'ArrowUp') selectCell(sel !== null ? (sel - 9 >= 0 ? sel - 9 : sel) : 0);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enterDigit, clearCell, selectCell, toggleNotesMode]);

  const selectedRow = selected !== null ? Math.floor(selected / 9) : -1;
  const selectedCol = selected !== null ? selected % 9 : -1;
  const selectedBox = selected !== null
    ? Math.floor(selectedRow / 3) * 3 + Math.floor(selectedCol / 3)
    : -1;

  function getCellClass(i: number): string {
    const row = Math.floor(i / 9);
    const col = i % 9;
    const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
    return ([
      'cell',
      i === selected ? 'selected'
        : (row === selectedRow || col === selectedCol || box === selectedBox) ? 'highlighted' : null,
      selected !== null && userGrid[i] !== 0 && userGrid[i] === userGrid[selected] && i !== selected ? 'same-digit' : null,
      puzzle[i] !== 0 ? 'given' : userGrid[i] !== 0 ? 'user-placed' : null,
      userGrid[i] === 0 && notes[i].size > 0 ? 'has-notes' : null,
      col % 3 === 2 && col !== 8 ? 'border-right' : null,
      row % 3 === 2 && row !== 8 ? 'border-bottom' : null,
      hintEvidenceSet?.has(i) ? 'hint-evidence' : null,
      hintActionSet?.has(i) ? (activeHint!.isPlacement ? 'hint-target' : 'hint-eliminated') : null,
      flashingCell === i ? 'flash-error' : null,
    ] as (string | null)[]).filter(Boolean).join(' ');
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    }).catch(() => showTimerFlash('Copy failed'));
  }

  return (
    <div className="sudoku-container">
      <header>
        <h1>Sudoku</h1>
        <div className="grade-badge" style={{ background: DIFFICULTY_COLOR[grade.difficulty] }}>
          {grade.difficulty.toUpperCase()}
        </div>
        <span className="timer">
          {formatTime(elapsed)}
          {timerFlash && <span key={timerFlashKey} className="penalty-flash">{timerFlash}</span>}
        </span>
        <button className="share-btn" onClick={copyLink} aria-label="Share">
          {copied ? <CheckIcon /> : <ShareIcon />}
        </button>
        {effectiveConfirmingEnd ? (
          <>
            <button className="share-btn end-confirm" onClick={() => { exitedRef.current = true; localRemove(storageKey); onBack(); }} aria-label="Confirm end">
              <CheckIcon />
            </button>
            <button className="share-btn" onClick={() => setConfirmingEnd(false)} aria-label="Cancel">
              <CrossIcon />
            </button>
          </>
        ) : (
          <button className="share-btn" onClick={() => solved || failed ? onBack() : setConfirmingEnd(true)} aria-label="End game">
            <PowerIcon />
          </button>
        )}
      </header>

      <div className="board-wrapper">
        <div className={`board${celebrating ? ' board--celebrating' : ''}`} role="grid" aria-label="Sudoku grid">
          {Array.from({ length: 9 }, (_, row) => (
            <div key={row} role="row" style={{ display: 'contents' }}>
              {Array.from({ length: 9 }, (_, col) => {
                const i = row * 9 + col;
                const val = userGrid[i];
                return (
                  <button
                    key={i}
                    role="gridcell"
                    className={getCellClass(i)}
                    onClick={() => selectCell(i)}
                    aria-label={`Row ${row + 1} Column ${col + 1}${val !== 0 ? ` value ${val}` : notes[i].size > 0 ? ` notes ${[...notes[i]].sort((a, b) => a - b).join(' ')}` : ''}`}
                  >
                    {val !== 0 ? val : notes[i].size > 0 ? (
                      <span className="notes-grid">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                          <span key={n} className="note-digit">
                            {notes[i].has(n) ? n : ''}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        {celebrating && (
          <div key={celebrationKey} className="celebration-overlay">
            {userGrid.map((val, i) => (
              <div key={i} className="cel-cell">
                {val !== 0 && <CelebrationNumber value={val} index={i} />}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="numpad">
        {solved ? (
          <div className="solved-banner">Puzzle Solved!</div>
        ) : failed ? (
          <div className="failed-banner">Game Over: {penaltyCount} wrong attempt{penaltyCount !== 1 ? 's' : ''}</div>
        ) : (
          <>
            <div className="numpad-main">
              <div className={`digit-grid${activeHint ? ' digit-grid--hidden' : ''}`}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
                  <button key={d} onClick={() => enterDigit(d)} className="num-btn" disabled={selectedFilled || puzzleBlockedDigits.has(d)} tabIndex={activeHint ? -1 : undefined}>{d}</button>
                ))}
              </div>
              {activeHint && (
                <div className="hint-panel">
                  <div className="hint-header">
                    <span className="hint-technique-name">{TECHNIQUE_LABEL[activeHint.technique]}</span>
                    <button className="hint-explain-btn" onClick={() => setShowTechniqueHelp(true)} aria-label="Explain technique">?</button>
                  </div>
                  {hintRevealed ? (
                    <>
                      <p className="hint-description">{activeHint.description}</p>
                      <div className="hint-footer">
                        <button className="hint-apply-btn" onClick={handleApplyHint}>Apply</button>
                        <button className="hint-dismiss-btn" onClick={dismissHint}>✕</button>
                      </div>
                    </>
                  ) : (
                    <div className="hint-footer">
                      <button className="hint-apply-btn" onClick={handleShowWhere}>Show where</button>
                      <button className="hint-dismiss-btn" onClick={dismissHint}>✕</button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="numpad-row">
              <button
                onClick={toggleNotesMode}
                className={`num-btn notes-toggle${notesMode ? ' active' : ''}`}
              >
                <PencilIcon /> Notes
              </button>
              <button onClick={handleFillAllNotes} className="num-btn icon-btn">
                <FillAllIcon /> All Notes
              </button>
              <button
                className={`num-btn icon-btn${activeHint && !autoSolve ? ' help-active' : ''}`}
                onClick={handleHelp}
                disabled={!nextHint && !activeHint && !autoSolve}
              >
                <HelpIcon /> Hint
              </button>
              <label className={`num-btn autosolve-label${autoSolve ? ' active' : ''}${!nextHint && !autoSolve ? ' autosolve-disabled' : ''}`}>
                <input
                  type="checkbox"
                  className="autosolve-checkbox"
                  checked={autoSolve}
                  onChange={toggleAutoSolve}
                  disabled={!nextHint && !autoSolve}
                />
                Auto
              </label>
            </div>
          </>
        )}
      </div>

      {showTechniqueHelp && activeHint && (
        <TechniqueHelpModal
          technique={activeHint.technique}
          onClose={closeTechniqueHelp}
        />
      )}

    </div>
  );
}
