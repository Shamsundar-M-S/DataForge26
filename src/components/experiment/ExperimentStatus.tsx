import { useExperiment } from '../../state/ExperimentContext';
import { StatusBadge } from '../ui/StatusBadge';
import { Figure } from '../ui/Figure';
import { Panel } from '../ui/Panel';

/** Everything shown here is recomputed from the validator, never stored. */
export function ExperimentStatus() {
  const { state, derived } = useExperiment();
  const { currentSolution } = state;
  const { status, validation, comparison } = derived;

  return (
    <Panel
      title="Current state"
      action={
        <StatusBadge
          status={status}
          detail={
            status === 'NO_FEASIBLE_SOLUTION'
              ? `${validation.totalDemand - validation.totalCapacity} kg short`
              : `${validation.fleetSlack} kg fleet slack`
          }
        />
      }
    >
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4">
        <Figure
          label="Total distance"
          value={currentSolution.feasible ? `${currentSolution.totalDistance}` : '—'}
          hint="units"
        />
        <Figure
          label="Change since last run"
          value={
            comparison.hasPrevious && currentSolution.feasible
              ? `${comparison.distanceDelta > 0 ? '+' : ''}${comparison.distanceDelta}`
              : '—'
          }
          tone={
            comparison.distanceDelta > 0
              ? 'negative'
              : comparison.distanceDelta < 0
                ? 'positive'
                : 'default'
          }
          hint={comparison.hasPrevious ? 'units' : 'no previous run'}
        />
        <Figure
          label="Total demand"
          value={`${validation.totalDemand}`}
          hint="kg"
        />
        <Figure
          label="Fleet capacity"
          value={`${validation.totalCapacity}`}
          hint="kg"
        />
      </dl>

      <div className="px-4 pb-4">
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded overflow-hidden">
          {validation.loads.map((load) => (
            <li
              key={load.vehicleId}
              className="flex items-center justify-between gap-3 px-3 py-2 text-xs font-mono bg-white"
            >
              <span className="text-gray-900">{load.vehicleName}</span>
              <span className="flex items-center gap-3">
                <span className="text-gray-700">
                  {load.load} / {load.capacity} kg
                </span>
                <span
                  className={
                    load.overloaded ? 'text-rose-800 font-semibold' : 'text-emerald-800'
                  }
                >
                  {load.overloaded
                    ? `over by ${-load.slack} kg`
                    : `${load.slack} kg spare`}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}
