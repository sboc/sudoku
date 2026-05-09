import { useCallback, useState } from 'react';
import type { PlayableDifficulty } from '../hooks/usePuzzlePool';
import type { UnfinishedGame } from '../App';
import type { ThemeId } from '../core/themes';
import { HelpModal } from './HelpModal';
import { SettingsModal } from './SettingsModal';
import { formatTime } from '../core/utils';
import { DIFFICULTY_COLOR } from '../core/grader';
import { GearIcon } from './Icons';
import './StartPage.css';

const DIFFICULTIES: PlayableDifficulty[] = ['easy', 'medium', 'hard', 'expert', 'master', 'legend'];

interface Props {
  counts: Record<PlayableDifficulty, number>;
  onSelect: (difficulty: PlayableDifficulty) => void;
  unfinished?: UnfinishedGame | null;
  onContinue?: () => void;
  theme: ThemeId;
  onChangeTheme: (t: ThemeId) => void;
}

export const StartPage = ({ counts, onSelect, unfinished, onContinue, theme, onChangeTheme }: Props) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const closeHelp = useCallback(() => setShowHelp(false), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);

  return (
    <div className="start-container">
      <h1>Sudoku</h1>
      {unfinished && onContinue && (
        <button className="continue-btn" onClick={onContinue}>
          <span className="continue-label">Continue</span>
          <span className="continue-meta">
            <span
              className="continue-diff"
              style={{ color: DIFFICULTY_COLOR[unfinished.difficulty] ?? 'var(--c-text-2)' }}
            >
              {unfinished.difficulty.toUpperCase()}
            </span>
            <span className="continue-time">{formatTime(unfinished.elapsed)}</span>
          </span>
        </button>
      )}
      <div className="subtitle-row">
        <p className="subtitle">New game</p>
        <button className="help-btn" onClick={() => setShowHelp(true)} aria-label="Help">?</button>
        <button className="settings-btn" onClick={() => setShowSettings(true)} aria-label="Settings"><GearIcon /></button>
      </div>
      <div className="difficulty-grid">
        {DIFFICULTIES.map(d => {
          const count = counts[d];
          const ready = count >= 1;
          return (
            <button
              key={d}
              className="difficulty-btn"
              style={{ '--accent': DIFFICULTY_COLOR[d] } as React.CSSProperties}
              onClick={() => onSelect(d)}
              disabled={!ready}
            >
              <span className="diff-name">{d.charAt(0).toUpperCase() + d.slice(1)}</span>
              {ready ? (
                <span className="diff-status ready">{count} ready</span>
              ) : (
                <span className="diff-status loading">
                  <span className="dot-pulse" />
                  Preparing…
                </span>
              )}
            </button>
          );
        })}
      </div>
      {showHelp && <HelpModal onClose={closeHelp} />}
      {showSettings && <SettingsModal theme={theme} onChangeTheme={onChangeTheme} onClose={closeSettings} />}
    </div>
  );
};
