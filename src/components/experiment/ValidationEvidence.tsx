import { Check, X } from 'lucide-react';
import { useExperiment } from '../../state/ExperimentContext';
import { Panel } from '../ui/Panel';

/**
 * The validator's independent verdict, shown next to the solver's claim so a
 * learner can see the two agree rather than taking the solver's word for it.
 */
export function ValidationEvidence() {
  const { derived } = useExperiment();
  const { validation } = derived;

  return (
    <Panel
      title="Checked independently"
      subtitle="Loads re-summed from demands and distances re-measured from coordinates, without consulting the solver."
    >
      <ul className="divide-y divide-gray-200">
        {validation.checks.map((check) => (
          <li key={check.id} className="px-4 py-3 flex items-start gap-3">
            <span
              className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                check.passed
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
              aria-hidden="true"
            >
              {check.passed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            </span>
            <span className="min-w-0">
              <span className="block text-sm text-gray-900">
                {check.label}
                <span className="sr-only">: {check.passed ? 'passed' : 'failed'}</span>
              </span>
              <span className="block text-[11px] font-mono text-gray-600 mt-0.5">
                {check.detail}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
