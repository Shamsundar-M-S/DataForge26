import { useExperiment } from '../../state/ExperimentContext';
import type { ExplanationStatus } from '../../domain/models/types';
import { Panel } from '../ui/Panel';

const STATUS_STYLE: Record<ExplanationStatus, { border: string; tag: string; word: string }> = {
  baseline: { border: 'border-gray-300', tag: 'bg-gray-100 text-gray-800', word: 'Setup' },
  change: { border: 'border-blue-300', tag: 'bg-blue-100 text-blue-900', word: 'Change' },
  violation: { border: 'border-rose-300', tag: 'bg-rose-100 text-rose-900', word: 'Rule broken' },
  reassignment: { border: 'border-amber-400', tag: 'bg-amber-100 text-amber-900', word: 'Consequence' },
  objective: { border: 'border-emerald-300', tag: 'bg-emerald-100 text-emerald-900', word: 'Cost' },
  infeasible: { border: 'border-rose-400', tag: 'bg-rose-100 text-rose-900', word: 'Impossible' },
};

/**
 * Renders explanation steps. All reasoning happens in the domain layer; this
 * component only lays the steps out.
 */
export function ExplanationPanel() {
  const { derived } = useExperiment();
  const { explanation } = derived;

  return (
    <Panel
      title="Why the plan looks like this"
      subtitle="Each step is assembled from measured state. No language model wrote any of it."
    >
      <ol className="divide-y divide-gray-200">
        {explanation.map((step) => {
          const style = STATUS_STYLE[step.status];
          return (
            <li key={step.index} className="p-4">
              <div className={`border-l-4 pl-4 ${style.border}`}>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs text-gray-500">
                    Step {step.index}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${style.tag}`}
                  >
                    {style.word}
                  </span>
                  <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
                </div>

                <p className="text-sm text-gray-800 leading-relaxed max-w-prose">
                  {step.statement}
                </p>

                {step.inequality && (
                  <p className="mt-2 inline-block font-mono text-xs bg-gray-900 text-gray-100 rounded px-2.5 py-1.5">
                    {step.inequality}
                  </p>
                )}

                {step.evidence.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {step.evidence.map((line, index) => (
                      <li
                        key={index}
                        className="text-[11px] font-mono text-gray-600"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
