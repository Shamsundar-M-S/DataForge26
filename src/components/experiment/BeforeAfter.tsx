import { ArrowRight } from 'lucide-react';
import { useExperiment } from '../../state/ExperimentContext';
import { Panel } from '../ui/Panel';
import { Figure } from '../ui/Figure';

const tour = (ids: readonly string[]): string =>
  ids.length === 0 ? 'stays at depot' : `Depot → ${ids.join(' → ')} → Depot`;

/**
 * The whole diff, read from the comparison layer. No number in this component
 * is written here; each one is measured elsewhere and displayed.
 */
export function BeforeAfter() {
  const { state, derived } = useExperiment();
  const { comparison, appliedChanges, retroValidation } = derived;
  const { committedProblem } = state;

  if (!comparison.hasPrevious) {
    return (
      <Panel title="Before and after">
        <p className="p-4 text-sm text-gray-700">
          Nothing to compare yet. Change a constraint in the workstation and press
          Recalculate — this panel then holds both plans side by side.
        </p>
      </Panel>
    );
  }

  const vehicleName = (id: string | null) =>
    committedProblem.vehicles.find((v) => v.id === id)?.shortName ?? 'none';

  return (
    <div className="space-y-5">
      {/* What changed */}
      <Panel title="What you changed">
        {appliedChanges.length === 0 ? (
          <p className="p-4 text-sm text-gray-700">
            The constraints are the same as the previous run.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {appliedChanges.map((change) => (
              <li
                key={`${change.kind}-${change.targetId}`}
                className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm font-mono"
              >
                <span className="text-gray-900">
                  {change.targetLabel}{' '}
                  <span className="text-gray-500">
                    {change.kind === 'VEHICLE_CAPACITY' ? 'capacity' : 'demand'}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-gray-600">{change.previousValue} kg</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                  <span className="font-semibold text-gray-900">
                    {change.currentValue} kg
                  </span>
                  <span
                    className={
                      change.delta < 0 ? 'text-rose-700' : 'text-emerald-700'
                    }
                  >
                    ({change.delta > 0 ? '+' : ''}
                    {change.delta})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Was the old plan still legal */}
      {retroValidation && (
        <Panel
          title="The previous plan, re-checked against the new constraints"
          subtitle="Not re-solved — re-judged. This is the step that shows a plan going from legal to illegal."
        >
          <ul className="divide-y divide-gray-200">
            {retroValidation.loads.map((load) => (
              <li
                key={load.vehicleId}
                className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs font-mono"
              >
                <span className="text-gray-900">{load.vehicleName}</span>
                <span className={load.overloaded ? 'text-rose-800' : 'text-emerald-800'}>
                  {load.load} kg {load.overloaded ? '>' : '≤'} {load.capacity} kg —{' '}
                  {load.overloaded ? 'breaks the limit' : 'still fits'}
                </span>
              </li>
            ))}
          </ul>
          {retroValidation.violations.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-rose-50">
              {retroValidation.violations.map((violation, index) => (
                <p key={index} className="text-sm text-rose-950">
                  {violation.message}
                  {violation.inequality && (
                    <span className="block font-mono text-xs mt-1">
                      {violation.inequality}
                    </span>
                  )}
                </p>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* Route ledger */}
      <Panel title="Plan before and after">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <caption className="sr-only">
              Each vehicle's route, load and distance before and after recalculating
            </caption>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-600">
                <th scope="col" className="px-4 py-2 font-semibold">Vehicle</th>
                <th scope="col" className="px-4 py-2 font-semibold">Before</th>
                <th scope="col" className="px-4 py-2 font-semibold">After</th>
                <th scope="col" className="px-4 py-2 font-semibold text-right">Load</th>
                <th scope="col" className="px-4 py-2 font-semibold text-right">Distance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {comparison.routeChanges.map((change) => (
                <tr key={change.vehicleId} className={change.sequenceChanged ? 'bg-amber-50/40' : ''}>
                  <th scope="row" className="px-4 py-2.5 text-left font-semibold text-gray-900">
                    {change.vehicleName}
                    {change.sequenceChanged && (
                      <span className="block text-[10px] font-normal text-amber-800">
                        changed
                      </span>
                    )}
                  </th>
                  <td className="px-4 py-2.5 text-gray-600">
                    {tour(change.previousCustomerIds)}
                  </td>
                  <td className="px-4 py-2.5 text-gray-900 font-semibold">
                    {tour(change.currentCustomerIds)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-700 whitespace-nowrap">
                    {change.previousLoad} → {change.currentLoad} kg
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-700 whitespace-nowrap">
                    {change.previousDistance} → {change.currentDistance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Movement + objective */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Customers that changed vehicle">
          {comparison.movedCustomers.length === 0 ? (
            <p className="p-4 text-sm text-gray-700">
              None. Every customer kept the vehicle it had.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {comparison.movedCustomers.map((moved) => (
                <li
                  key={moved.customerId}
                  className="px-4 py-3 flex items-center justify-between gap-3 text-sm font-mono"
                >
                  <span className="text-gray-900">
                    {moved.customerLabel}{' '}
                    <span className="text-gray-500">({moved.demand} kg)</span>
                  </span>
                  <span className="flex items-center gap-2 text-gray-900">
                    {vehicleName(moved.fromVehicleId)}
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                    <strong>{vehicleName(moved.toVehicleId)}</strong>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Cost of the change">
          <dl className="grid grid-cols-3 gap-2 p-4">
            <Figure label="Before" value={comparison.previousDistance} hint="units" />
            <Figure label="After" value={comparison.currentDistance} hint="units" />
            <Figure
              label="Difference"
              value={`${comparison.distanceDelta > 0 ? '+' : ''}${comparison.distanceDelta}`}
              tone={
                comparison.distanceDelta > 0
                  ? 'negative'
                  : comparison.distanceDelta < 0
                    ? 'positive'
                    : 'default'
              }
              hint="units"
            />
          </dl>
          <p className="px-4 pb-4 text-xs text-gray-600 leading-relaxed">
            {comparison.removedArcs.length} route segment
            {comparison.removedArcs.length === 1 ? '' : 's'} disappeared and{' '}
            {comparison.addedArcs.length} new one
            {comparison.addedArcs.length === 1 ? '' : 's'} were created.
          </p>
        </Panel>
      </div>
    </div>
  );
}
