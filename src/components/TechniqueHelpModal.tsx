import { useEffect, useRef } from 'react';
import { TECHNIQUE_EXPLANATIONS, TECHNIQUE_LABEL } from '../core/techniqueHelp';
import type { Technique } from '../core/humanSolver';
import './HelpModal.css';

interface Props {
  technique: Technique;
  onClose: () => void;
}

export const TechniqueHelpModal = ({ technique, onClose }: Props) => {
  const explanation = TECHNIQUE_EXPLANATIONS[technique];
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-modal" role="dialog" aria-modal="true" aria-labelledby="technique-modal-title" onClick={e => e.stopPropagation()}>
        <button ref={closeRef} className="help-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 id="technique-modal-title">{TECHNIQUE_LABEL[technique] ?? technique}</h2>
        {explanation ? (
          <>
            <section>
              <p>{explanation.summary}</p>
            </section>
            <section>
              <h3>How to apply</h3>
              <ol className="technique-steps">
                {explanation.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </section>
          </>
        ) : (
          <p>No explanation available for this technique.</p>
        )}
      </div>
    </div>
  );
};
