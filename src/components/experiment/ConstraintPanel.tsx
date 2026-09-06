import { RotateCcw, Play, Undo2 } from 'lucide-react';
import { CAPACITY_BOUNDS, DEMAND_BOUNDS, SCENARIOS } from '../../data/demoProblem';
import { useExperiment } from '../../state/ExperimentContext';
import { Panel } from '../ui/Panel';
import { BindingGauge } from './BindingGauge';
import type { VehicleLoadInfo } from '../../domain/models/types';

/**
 * The only place constraint values can be edited. Edits go into the draft
 * problem; nothing is re-solved until Recalculate is pressed, which is what
 * makes a genuine before/after possible.
 */
export function ConstraintPanel() {
  const { state, derived, actions } = useExperiment();
  const { draftProblem, committedProblem } = state;
  const {
    pendingChanges,
    hasPendingChanges,
    draftScenarioId,
    draftTotalDemand,
    draftTotalCapacity,
    validation,
  } = derived;

  const loadFor = (vehicleId: string) =>
    validation.loads.find((l) => l.vehicleId === vehicleId);

  return (
    <Panel
      title="Constraints"
      subtitle="Change a value, then recalculate. Nothing re-solves until you do."
      action={
        <button
          type="button"
          onClick={actions.reset}
          className="px-2.5 py-1.5 rounded text-xs font-mono border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Reset
        </button>
      }
    >
      <div className="divide-y divide-gray-200">
        {/* Presets */}
        <fieldset className="p-4">
          <legend className="text-xs font-mono font-semibold text-gray-900 mb-2">
            Starting points
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SCENARIOS.map((scenario) => {
              const active = draftScenarioId === scenario.id;
              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => actions.applyScenario(scenario.id)}
                  aria-pressed={active}
                  className={`p-2.5 rounded border text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 ${
                    active
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <span className="block text-xs font-mono font-semibold text-gray-900">
                    {active ? '● ' : ''}
                    {scenario.label}
                  </span>
                  <span className="block text-[11px] text-gray-600 mt-0.5 leading-snug">
                    {scenario.description}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Capacities */}
        <fieldset className="p-4 space-y-4">
          <legend className="text-xs font-mono font-semibold text-gray-900">
            Vehicle capacity & slack gauges
          </legend>
          {draftProblem.vehicles.map((vehicle) => {
            const committed = committedProblem.vehicles.find((v) => v.id === vehicle.id);
            const edited = committed && committed.capacity !== vehicle.capacity;
            const load = loadFor(vehicle.id);
            const inputId = `capacity-${vehicle.id}`;

            const currentLoad = load?.load ?? 0;
            const draftLoadInfo: VehicleLoadInfo = {
              vehicleId: vehicle.id,
              vehicleName: vehicle.name,
              load: currentLoad,
              capacity: vehicle.capacity,
              slack: vehicle.capacity - currentLoad,
              overloaded: currentLoad > vehicle.capacity,
            };

            return (
              <div key={vehicle.id} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor={inputId}
                    className="text-xs font-mono text-gray-900 flex items-center gap-2 font-semibold"
                  >
                    <span
                      className="w-3 h-3 rounded-xs"
                      style={{ backgroundColor: vehicle.color }}
                      aria-hidden="true"
                    />
                    {vehicle.name}
                  </label>
                  <span className="text-xs font-mono">
                    <strong className="text-gray-900">{vehicle.capacity} kg</strong>
                    {edited && (
                      <span className="text-amber-800 ml-1.5 font-semibold">
                        (was {committed.capacity})
                      </span>
                    )}
                  </span>
                </div>
                <input
                  id={inputId}
                  type="range"
                  min={CAPACITY_BOUNDS.min}
                  max={CAPACITY_BOUNDS.max}
                  step={CAPACITY_BOUNDS.step}
                  value={vehicle.capacity}
                  onChange={(e) =>
                    actions.setVehicleCapacity(vehicle.id, Number(e.target.value))
                  }
                  className="w-full h-1.5 cursor-pointer accent-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 rounded"
                  aria-describedby={`${inputId}-load`}
                />
                <BindingGauge loadInfo={draftLoadInfo} color={vehicle.color} />
              </div>
            );
          })}
          <p className="text-[11px] font-mono text-gray-600 pt-1 border-t border-gray-100">
            Draft fleet capacity {draftTotalCapacity} kg · total demand{' '}
            {draftTotalDemand} kg ·{' '}
            {draftTotalCapacity >= draftTotalDemand
              ? `${draftTotalCapacity - draftTotalDemand} kg spare`
              : `${draftTotalDemand - draftTotalCapacity} kg short`}
          </p>
        </fieldset>

        {/* Demands */}
        <fieldset className="p-4 space-y-3">
          <legend className="text-xs font-mono font-semibold text-gray-900">
            Customer demand
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {draftProblem.customers.map((customer) => {
              const committed = committedProblem.customers.find(
                (c) => c.id === customer.id,
              );
              const edited = committed && committed.demand !== customer.demand;
              const inputId = `demand-${customer.id}`;

              return (
                <div
                  key={customer.id}
                  className={`p-2.5 rounded border ${
                    edited ? 'border-amber-400 bg-amber-50/50' : 'border-gray-200'
                  }`}
                >
                  <label
                    htmlFor={inputId}
                    className="flex items-center justify-between text-xs font-mono"
                  >
                    <span className="font-semibold text-gray-900">{customer.id}</span>
                    <span className="text-gray-800">{customer.demand} kg</span>
                  </label>
                  <input
                    id={inputId}
                    type="range"
                    min={DEMAND_BOUNDS.min}
                    max={DEMAND_BOUNDS.max}
                    step={DEMAND_BOUNDS.step}
                    value={customer.demand}
                    onChange={(e) =>
                      actions.setCustomerDemand(customer.id, Number(e.target.value))
                    }
                    className="w-full h-1 mt-1.5 cursor-pointer accent-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 rounded"
                  />
                  {edited && (
                    <span className="text-[10px] font-mono text-amber-800">
                      was {committed.demand} kg
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>

        {/* Commit */}
        <div className="p-4 bg-gray-50/70 space-y-3">
          {hasPendingChanges ? (
            <div className="text-xs font-mono text-amber-950 bg-amber-50 border border-amber-300 rounded p-3">
              <p className="font-semibold mb-1">Not yet applied:</p>
              <ul className="space-y-0.5">
                {pendingChanges.map((change) => (
                  <li key={`${change.kind}-${change.targetId}`}>
                    {change.targetLabel}: {change.previousValue} kg →{' '}
                    {change.currentValue} kg
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs font-mono text-gray-600">
              The plan on screen matches these constraints.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={actions.recalculate}
              disabled={!hasPendingChanges}
              className="px-4 py-2 rounded font-mono text-xs font-semibold inline-flex items-center gap-2 bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-900"
            >
              <Play className="w-3.5 h-3.5" aria-hidden="true" />
              Recalculate
            </button>
            {hasPendingChanges && (
              <button
                type="button"
                onClick={actions.discardDraft}
                className="px-3 py-2 rounded font-mono text-xs border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
              >
                <Undo2 className="w-3.5 h-3.5" aria-hidden="true" />
                Discard edits
              </button>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
