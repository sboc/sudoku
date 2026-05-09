import type { ExampleCell } from '../core/techniqueHelp';
import './TechniqueGrid.css';

interface Props {
  cells: ExampleCell[];
}

export const TechniqueGrid = ({ cells }: Props) => {
  const cellMap = new Map<string, ExampleCell>();
  cells.forEach(c => cellMap.set(`${c.r},${c.c}`, c));

  return (
    <div className="tg-grid">
      {Array.from({ length: 9 }, (_, r) =>
        Array.from({ length: 9 }, (_, c) => {
          const spec = cellMap.get(`${r},${c}`);
          const boxRight = c === 2 || c === 5 ? ' tg-box-right' : '';
          const boxBottom = r === 2 || r === 5 ? ' tg-box-bottom' : '';
          const key = `${r},${c}`;

          if (!spec) {
            return <div key={key} className={`tg-cell tg-inactive${boxRight}${boxBottom}`} />;
          }

          const roleCls = spec.role === 'evidence' ? ' tg-evidence' : spec.role === 'action' ? ' tg-action' : ' tg-context';
          const cls = `tg-cell${roleCls}${boxRight}${boxBottom}`;

          if (spec.value !== undefined) {
            return (
              <div key={key} className={cls}>
                <span className="tg-value">{spec.value}</span>
              </div>
            );
          }

          const candSet = new Set(spec.cands ?? []);
          const elimSet = new Set(spec.elim ?? []);

          return (
            <div key={key} className={cls}>
              <div className="tg-cands">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => {
                  const shown = candSet.has(d);
                  const elim = elimSet.has(d);
                  return (
                    <span key={d} className={`tg-cand${shown ? ' tg-cand-shown' : ''}${elim ? ' tg-cand-elim' : ''}`}>
                      {(shown || elim) ? d : ''}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
