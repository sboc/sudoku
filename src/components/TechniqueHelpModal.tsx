import { TECHNIQUE_EXPLANATIONS, TECHNIQUE_LABEL } from '../core/techniqueHelp';
import type { Technique } from '../core/humanSolver';
import './HelpModal.css';

interface Props {
  technique: Technique;
  onClose: () => void;
}

export function TechniqueHelpModal({ technique, onClose }: Props) {
  const explanation = TECHNIQUE_EXPLANATIONS[technique];

  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-modal" onClick={e => e.stopPropagation()}>
        <button className="help-close" onClick={onClose} aria-label="Close">✕</button>
        <h2>{TECHNIQUE_LABEL[technique] ?? technique}</h2>
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
}
