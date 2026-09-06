import { XOctagon, Wrench, RefreshCw } from 'lucide-react';
import { useExperiment } from '../../state/ExperimentContext';
import { Figure } from '../ui/Figure';

/**
 * Shown when the solver proves there is no feasible assignment. Every
 * number comes from the validator. Includes interactive system repair calculations.
 */
export function FailureState() {
  const { state, derived, actions } = useExperiment();
  const { currentSolution } = state;
  const { validation } = derived;

  if (currentSolution.feasible) return null;

  const deficit = validation.totalDemand - validation.totalCapacity;
  const minimumCombinedCapacity = validation.totalDemand;

  const handleQuickRepair = () => {
    // Add equal capacity to both vehicles to cover the shortfall + 15kg safety margin
    const extraPerVehicle = Math.ceil((deficit + 15) / 2 / 5) * 5;
    const v1 = state.committedProblem.vehicles[0];
    const v2 = state.committedProblem.vehicles[1];
    if (v1) actions.setVehicleCapacity(v1.id, v1.capacity + extraPerVehicle);
    if (v2) actions.setVehicleCapacity(v2.id, v2.capacity + extraPerVehicle);
    actions.recalculate();
  };

  return (
    <section className="rounded-lg border-2 border-rose-400 bg-rose-50 overflow-hidden space-y-0">
      <header className="px-5 py-4 border-b border-rose-300 flex items-start gap-3 bg-rose-100/50">
        <XOctagon className="w-6 h-6 text-rose-700 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-serif font-semibold text-rose-950">
            No feasible solution
          </h2>
          <p className="text-sm text-rose-900 mt-0.5">
            Not "the solver gave up" — no assignment of these customers to these
            vehicles can satisfy every constraint at once.
          </p>
        </div>
      </header>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-5 bg-white border-b border-rose-200">
        <Figure label="Total demand" value={`${validation.totalDemand} kg`} />
        <Figure label="Total capacity" value={`${validation.totalCapacity} kg`} />
        <Figure
          label={deficit > 0 ? 'Capacity Shortfall' : 'Fleet Slack'}
          value={`${Math.abs(deficit)} kg`}
          tone={deficit > 0 ? 'negative' : 'default'}
        />
        <Figure
          label="Min. Combined Needed"
          value={`${minimumCombinedCapacity} kg`}
          tone="positive"
        />
      </dl>

      <div className="p-5 space-y-4">
        {currentSolution.violations.map((violation, index) => (
          <div
            key={index}
            className="rounded border border-rose-300 bg-white p-4 space-y-2"
          >
            <p className="text-sm text-rose-950 leading-relaxed font-semibold">{violation.message}</p>
            {violation.inequality && (
              <p className="font-mono text-xs bg-rose-900 text-rose-50 rounded px-3 py-1.5 inline-block">
                {violation.inequality}
              </p>
            )}
          </div>
        ))}

        {/* Can you repair the system section */}
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-800" aria-hidden="true" />
            <h3 className="text-xs font-mono font-bold text-amber-950 uppercase tracking-wide">
              Can you repair the system?
            </h3>
          </div>
          <p className="text-xs font-mono text-amber-900 leading-relaxed">
            Minimum total capacity required to serve all orders is{' '}
            <strong>{minimumCombinedCapacity} kg</strong>. Your fleet currently provides only{' '}
            <strong>{validation.totalCapacity} kg</strong>.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {deficit > 0 && (
              <button
                type="button"
                onClick={handleQuickRepair}
                className="px-3.5 py-2 rounded bg-amber-900 text-amber-100 hover:bg-amber-950 font-mono text-xs font-semibold inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-900"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                Auto-boost capacity to {validation.totalCapacity + Math.ceil((deficit + 15) / 2 / 5) * 10} kg & recalculate
              </button>
            )}
            <button
              type="button"
              onClick={actions.reset}
              className="px-3.5 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 font-mono text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
            >
              Restore baseline setup
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
