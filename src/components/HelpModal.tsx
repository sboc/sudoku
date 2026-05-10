import { useEffect, useRef, useState } from 'react';
import { TECHNIQUE_WEIGHT, DIFFICULTY_BANDS } from '../core/grader';
import type { Technique } from '../core/humanSolver';
import { TECHNIQUE_LABEL, TECHNIQUE_EXPLANATIONS, TECHNIQUE_EXAMPLES } from '../core/techniqueHelp';
import { TechniqueGrid } from './TechniqueGrid';
import './HelpModal.css';

const TECHNIQUES: { key: Technique; desc: string }[] = [
  { key: 'naked_single', desc: 'Only one digit fits in the cell.' },
  { key: 'hidden_single', desc: 'A digit can only go in one cell within a row, column, or box.' },
  { key: 'pointing_pair', desc: 'A digit in a box is confined to one row/column, eliminating it elsewhere in that line.' },
  { key: 'box_line_reduction', desc: 'A digit in a row/column is confined to one box, eliminating it elsewhere in that box.' },
  { key: 'naked_pair', desc: 'Two cells in a unit share the same two candidates, locking them out of other cells.' },
  { key: 'hidden_pair', desc: 'Two digits only appear in two cells within a unit, eliminating other candidates there.' },
  { key: 'naked_triple', desc: 'Three cells in a unit share only three candidates between them.' },
  { key: 'hidden_triple', desc: 'Three digits confined to three cells in a unit.' },
  { key: 'naked_quad', desc: 'Four cells in a unit share only four candidates between them, locking those digits out of the rest of the unit.' },
  { key: 'hidden_quad', desc: 'Four digits confined to four cells in a unit, allowing elimination of other candidates from those cells.' },
  { key: 'x_wing', desc: 'A digit appears in only two cells across two rows, forming a rectangle that eliminates the digit in two columns.' },
  { key: 'swordfish', desc: 'A three-row extension of X-Wing: a digit in 2-3 cells across three rows spans exactly three columns, eliminating it from the rest of those columns.' },
  { key: 'jellyfish', desc: 'A four-row extension of Swordfish: a digit in 2-4 cells across four rows spans exactly four columns, eliminating it from the rest of those columns.' },
  { key: 'skyscraper', desc: 'Two rows each have exactly two candidates for a digit sharing one column. Cells seeing both outer ends can be eliminated.' },
  { key: 'two_string_kite', desc: 'A row-string and column-string for a digit share a box corner. Cells seeing both outer tips can be eliminated.' },
  { key: 'empty_rectangle', desc: 'A digit in a box forms a cross pattern. Combined with an external strong link, forces a single elimination.' },
  { key: 'unique_rectangle', desc: 'Four empty cells forming a rectangle across two boxes share two candidates. Extra candidates in roof cells must be used to prevent two solutions, enabling eliminations.' },
  { key: 'y_wing', desc: 'Three cells with two candidates each form a chain that forces eliminations.' },
  { key: 'w_wing', desc: 'Two bivalue cells with the same candidates are connected by a strong link, eliminating one candidate from cells that see both.' },
  { key: 'xyz_wing', desc: 'Like Y-Wing but the pivot has three candidates. Eliminates one digit from cells that see all three cells.' },
  { key: 'simple_coloring', desc: 'Two-color a strong-link chain for a digit. Same-color conflicts or cells seeing both colors reveal eliminations.' },
  { key: 'xy_chain', desc: 'A chain of bivalue cells where the first and last share a target digit. Cells seeing both ends can have that digit eliminated.' },
];

interface Props {
  onClose: () => void;
}

export const HelpModal = ({ onClose }: Props) => {
  const [selected, setSelected] = useState<Technique | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    (selected ? backRef : closeRef).current?.focus();
  }, [selected]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (selected) setSelected(null);
        else onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, selected]);

  const explanation = selected ? TECHNIQUE_EXPLANATIONS[selected] : null;
  const example = selected ? TECHNIQUE_EXAMPLES[selected] : null;

  return (
    <div className="help-overlay" onClick={selected ? () => setSelected(null) : onClose}>
      <div className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-modal-title" onClick={e => e.stopPropagation()}>

        {selected ? (
          <>
            <button ref={backRef} className="help-back" onClick={() => setSelected(null)} aria-label="Back to techniques">← Back</button>
            <button className="help-close" onClick={onClose} aria-label="Close">✕</button>

            <h2 id="help-modal-title">{TECHNIQUE_LABEL[selected]}</h2>
            <div className="tech-detail-weight">
              Weight <span className="tech-weight-badge">{TECHNIQUE_WEIGHT[selected]}</span>
            </div>

            {explanation && (
              <>
                <section>
                  <p>{explanation.summary}</p>
                </section>
                {example && (
                  <section>
                    <h3>Example</h3>
                    <TechniqueGrid cells={example.cells} />
                    <div className="tg-legend">
                      <span className="tg-legend-item"><span className="tg-legend-swatch tg-legend-swatch--evidence" />Pattern</span>
                      <span className="tg-legend-item"><span className="tg-legend-swatch tg-legend-swatch--action" />Elimination / placement</span>
                      <span className="tg-legend-item"><span className="tg-legend-swatch tg-legend-swatch--elim" />Eliminated candidate</span>
                    </div>
                    <p className="tg-caption">{example.caption}</p>
                  </section>
                )}
                <section>
                  <h3>How to apply</h3>
                  <ol className="technique-steps">
                    {explanation.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </section>
              </>
            )}
          </>
        ) : (
          <>
            <button ref={closeRef} className="help-close" onClick={onClose} aria-label="Close">✕</button>

            <h2 id="help-modal-title">How puzzles work</h2>

            <section>
              <h3>Generation</h3>
              <p>
                A complete grid is built using randomised backtracking. Cells are then removed one by one,
                and each removal is only kept if the puzzle still has exactly one solution (checked with an
                exact-cover solver). This guarantees every puzzle is uniquely solvable.
              </p>
            </section>

            <section>
              <h3>Grading</h3>
              <p>
                A human-style solver attempts the puzzle using logic techniques in order of complexity.
                The difficulty score is the sum of the weights of every technique needed to reach a solution.
              </p>
              <div className="band-row">
                {DIFFICULTY_BANDS.map(b => (
                  <div key={b.label} className="band-chip" style={{ borderColor: b.color }}>
                    <span className="band-label" style={{ color: b.color }}>{b.label}</span>
                    <span className="band-range">{b.range}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3>Why Master &amp; Legend show "Preparing…"</h3>
              <p>
                Puzzles are generated randomly and graded after the fact. There is no way to aim for a
                specific difficulty directly. Most randomly generated puzzles land in the Easy to Hard range,
                so Master and Legend puzzles are rare finds. The app keeps generating in the background
                and queues one puzzle per high difficulty, but it can take a while before one appears.
                Tap the button once it turns green.
              </p>
            </section>

            <section>
              <h3>Techniques</h3>
              <table className="tech-table">
                <thead>
                  <tr><th>Technique</th><th>Weight</th><th>Description</th></tr>
                </thead>
                <tbody>
                  {[...TECHNIQUES].sort((a, b) => TECHNIQUE_WEIGHT[a.key] - TECHNIQUE_WEIGHT[b.key]).map(t => (
                    <tr key={t.key}>
                      <td className="tech-name">
                        <button className="tech-link" onClick={() => setSelected(t.key)}>
                          {TECHNIQUE_LABEL[t.key]}
                        </button>
                      </td>
                      <td className="tech-weight">{TECHNIQUE_WEIGHT[t.key]}</td>
                      <td className="tech-desc">{t.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
