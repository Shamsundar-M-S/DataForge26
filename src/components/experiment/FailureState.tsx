import { Play, RefreshCw, Wrench, XOctagon } from 'lucide-react';
import { CAPACITY_BOUNDS } from '../../data/demoProblem';
import { useExperiment } from '../../state/ExperimentContext';
import { Figure } from '../ui/Figure';

/**
 * Shown when the solver proves there is no feasible assignment.
 * Every number comes from the validator.
 *
 * The learner can manually repair the system by changing vehicle capacities,
 * then test the edited problem with the real solver.
 */
export function FailureState() {
  const { state, derived, actions } = useExperiment();

  const {
    currentSolution,
    committedProblem,
    draftProblem,
  } = state;

  const {
    validation,
    draftTotalCapacity,
    draftTotalDemand,
    hasPendingChanges,
  } = derived;

  if (currentSolution.feasible) return null;

  const deficit = validation.totalDemand - validation.totalCapacity;
  const minimumCombinedCapacity = validation.totalDemand;

  /**
   * Helper option only:
   * fills a suggested capacity repair into the draft values,
   * but does NOT claim the problem is feasible until the learner
   * runs the real solver using "Test this repair".
   */
  const handleSuggestRepair = () => {
    const extraPerVehicle =
      Math.ceil((Math.max(deficit, 0) + 15) / 2 / 5) * 5;

    const v1 = committedProblem.vehicles[0];
    const v2 = committedProblem.vehicles[1];

    if (v1) {
      actions.setVehicleCapacity(
        v1.id,
        v1.capacity + extraPerVehicle
      );
    }

    if (v2) {
      actions.setVehicleCapacity(
        v2.id,
        v2.capacity + extraPerVehicle
      );
    }
  };

  return (
    <section className="rounded-lg border-2 border-rose-400 bg-rose-50 overflow-hidden space-y-0">
      <header className="px-5 py-4 border-b border-rose-300 flex items-start gap-3 bg-rose-100/50">
        <XOctagon
          className="w-6 h-6 text-rose-700 shrink-0 mt-0.5"
          aria-hidden="true"
        />

        <div>
          <h2 className="text-xl font-serif font-semibold text-rose-950">
            No feasible solution
          </h2>

          <p className="text-sm text-rose-900 mt-0.5">
            Not &quot;the solver gave up&quot; — no assignment of these
            customers to these vehicles can satisfy every constraint at once.
          </p>
        </div>
      </header>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-5 bg-white border-b border-rose-200">
        <Figure
          label="Total demand"
          value={`${validation.totalDemand} kg`}
        />

        <Figure
          label="Total capacity"
          value={`${validation.totalCapacity} kg`}
        />

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
            <p className="text-sm text-rose-950 leading-relaxed font-semibold">
              {violation.message}
            </p>

            {violation.inequality && (
              <p className="font-mono text-xs bg-rose-900 text-rose-50 rounded px-3 py-1.5 inline-block">
                {violation.inequality}
              </p>
            )}
          </div>
        ))}

        {/* Manual repair challenge */}
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-4">
          <div className="flex items-start gap-2">
            <Wrench
              className="w-4 h-4 text-amber-800 shrink-0 mt-0.5"
              aria-hidden="true"
            />

            <div>
              <h3 className="text-xs font-mono font-bold text-amber-950 uppercase tracking-wide">
                Can you repair the system?
              </h3>

              <p className="text-xs font-mono text-amber-900 leading-relaxed mt-1">
                Adjust the vehicle capacities yourself until the fleet has
                enough capacity to serve the current demand. Then test your
                repair using the real solver.
              </p>
            </div>
          </div>

          {/* Manual capacity sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {draftProblem.vehicles.map((vehicle) => {
              const inputId = `repair-capacity-${vehicle.id}`;

              return (
                <div
                  key={vehicle.id}
                  className="rounded border border-amber-200 bg-white p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor={inputId}
                      className="text-xs font-mono font-semibold text-gray-900"
                    >
                      {vehicle.id} capacity
                    </label>

                    <span className="text-sm font-mono font-bold text-gray-950">
                      {vehicle.capacity} kg
                    </span>
                  </div>

                  <input
                    id={inputId}
                    type="range"
                    min={CAPACITY_BOUNDS.min}
                    max={CAPACITY_BOUNDS.max}
                    step={CAPACITY_BOUNDS.step}
                    value={vehicle.capacity}
                    onChange={(event) =>
                      actions.setVehicleCapacity(
                        vehicle.id,
                        Number(event.target.value)
                      )
                    }
                    className="w-full h-1.5 cursor-pointer accent-amber-900"
                  />

                  <div className="flex justify-between text-[10px] font-mono text-gray-500">
                    <span>{CAPACITY_BOUNDS.min} kg</span>
                    <span>{CAPACITY_BOUNDS.max} kg</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live draft status */}
          <div
            className={`rounded border p-3 font-mono text-xs ${draftTotalCapacity >= draftTotalDemand
                ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                : 'border-rose-300 bg-rose-50 text-rose-950'
              }`}
            aria-live="polite"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                Current fleet capacity:{' '}
                <strong>{draftTotalCapacity} kg</strong>
              </span>

              <span>
                Required demand:{' '}
                <strong>{draftTotalDemand} kg</strong>
              </span>
            </div>

            <p className="mt-2 font-semibold">
              {draftTotalCapacity >= draftTotalDemand
                ? 'Combined capacity is now sufficient to test. Run the solver to verify whether a feasible assignment exists.'
                : `${draftTotalDemand - draftTotalCapacity} kg more combined capacity is still required.`}
            </p>
          </div>

          {/* Repair actions */}
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={actions.recalculate}
              disabled={!hasPendingChanges}
              className="px-3.5 py-2 rounded bg-amber-900 text-amber-100 hover:bg-amber-950 disabled:bg-amber-200 disabled:text-amber-700 disabled:cursor-not-allowed font-mono text-xs font-semibold inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-900"
            >
              <Play
                className="w-3.5 h-3.5"
                aria-hidden="true"
              />
              Test this repair
            </button>

            {deficit > 0 && (
              <button
                type="button"
                onClick={handleSuggestRepair}
                className="px-3.5 py-2 rounded border border-amber-300 bg-white hover:bg-amber-100 text-amber-900 font-mono text-xs font-semibold inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-900"
              >
                <RefreshCw
                  className="w-3.5 h-3.5"
                  aria-hidden="true"
                />
                Suggest capacities
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

          <p className="text-[10px] font-mono text-amber-800 leading-relaxed">
            Reaching the total-demand threshold is necessary, but it does not
            automatically guarantee a feasible assignment. The exact solver
            still checks whether all customer demands can be distributed across
            the vehicles while satisfying every constraint.
          </p>
        </div>
      </div>
    </section>
  );
}