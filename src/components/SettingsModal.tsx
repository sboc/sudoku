import { useEffect, useRef } from 'react';
import type { ThemeId } from '../core/themes';
import { THEMES } from '../core/themes';
import './SettingsModal.css';

interface Props {
  theme: ThemeId;
  onChangeTheme: (t: ThemeId) => void;
  onClose: () => void;
}

export const SettingsModal = ({ theme, onChangeTheme, onClose }: Props) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={e => e.stopPropagation()}>
        <button ref={closeRef} className="settings-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 id="settings-title">Settings</h2>

        <section>
          <h3>Theme</h3>
          <div className="theme-grid">
            {THEMES.map(t => (
              <button
                key={t.id}
                className={`theme-card${theme === t.id ? ' theme-card--active' : ''}`}
                onClick={() => onChangeTheme(t.id)}
                aria-pressed={theme === t.id}
                style={{
                  background: t.bgCell,
                  borderColor: theme === t.id ? t.accent : t.borderBox,
                }}
              >
                <div className="theme-preview">
                  <div className="theme-preview-grid" style={{ background: t.bgCell, borderColor: t.borderBox }}>
                    <div style={{ background: t.bgCellHi }} />
                    <div style={{ background: t.bgCell }} />
                    <div style={{ background: t.accent, opacity: 0.9 }} />
                    <div style={{ background: t.bgCell }} />
                    <div style={{ background: t.bgCellHi }} />
                    <div style={{ background: t.bgCell }} />
                    <div style={{ background: t.bgCell }} />
                    <div style={{ background: t.accentSoft, opacity: 0.5 }} />
                    <div style={{ background: t.bgCellHi }} />
                  </div>
                </div>
                <span className="theme-name" style={{ color: t.text1 }}>{t.name}</span>
                {theme === t.id && <span className="theme-check" style={{ color: t.accent }}>✓</span>}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
