import { RotateCcw } from 'lucide-react';
import { useExperiment } from '../../state/ExperimentContext';
import { StatusBadge } from '../ui/StatusBadge';

export function Header() {
  const { state, derived, actions } = useExperiment();
  const { status, validation } = derived;

  return (
    <header className="border-b border-gray-300 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-serif font-medium tracking-tight text-gray-900">
            ConstraintRoute
          </h1>
          <p className="text-sm text-gray-700 mt-1 leading-relaxed">
            Change one constraint in a small delivery problem and watch a plan that
            was fine a moment ago stop working.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge
            status={status}
            detail={
              state.currentSolution.feasible
                ? `${state.currentSolution.totalDistance} units`
                : `${validation.totalDemand - validation.totalCapacity} kg short`
            }
          />
          <button
            type="button"
            onClick={actions.reset}
            className="px-3 py-2 rounded text-xs font-mono border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}
