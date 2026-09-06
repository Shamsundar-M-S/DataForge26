import { ArrowDown, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useExperiment } from '../../state/ExperimentContext';
import { Panel } from '../ui/Panel';

/**
 * Signature feature: Constraint Trace
 * Formats a visual, data-driven causal chain showing how a local constraint edit
 * cascades through validation, reassignment, and global distance objective.
 */
export function ConstraintTrace() {
  const { state, derived } = useExperiment();
  const { comparison, appliedChanges, retroValidation } = derived;
  const { committedProblem, currentSolution } = state;

  if (!comparison.hasPrevious) {
    return (
      <Panel title="Constraint Trace" subtitle="Visual causal chain of system recalculation">
        <p className="p-4 text-xs font-mono text-gray-600">
          Make a constraint edit in the workstation and press <strong>Recalculate</strong> to trace the exact causal chain from local edit to global solution reorganization.
        </p>
      </Panel>
    );
  }

  const vehicleName = (id: string | null) =>
    committedProblem.vehicles.find((v) => v.id === id)?.shortName ?? 'unassigned';

  const primaryChange = appliedChanges[0];
  const brokenViolation = retroValidation?.violations[0];

  return (
    <Panel
      title="Constraint Trace"
      subtitle="Data-driven causal chain derived directly from solver computation"
    >
      <div className="p-4 space-y-4">
        {/* Step 1: Parameter Edit */}
        <div className="rounded border border-blue-200 bg-blue-50/50 p-3 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-blue-900">1. PARAMETER EDIT</span>
            <span className="text-[10px] text-blue-700 font-semibold px-2 py-0.5 bg-blue-100 rounded">
              User Input
            </span>
          </div>
          {primaryChange ? (
            <p className="text-xs font-mono text-gray-900">
              {primaryChange.targetLabel} {primaryChange.kind === 'VEHICLE_CAPACITY' ? 'Capacity' : 'Demand'}:{' '}
              <strong className="text-blue-950">{primaryChange.previousValue} kg</strong> →{' '}
              <strong className="text-blue-950">{primaryChange.currentValue} kg</strong>{' '}
              ({primaryChange.delta > 0 ? '+' : ''}{primaryChange.delta} kg)
            </p>
          ) : (
            <p className="text-xs font-mono text-gray-700">No constraint values were modified on this run.</p>
          )}
        </div>

        <div className="flex justify-center text-gray-400">
          <ArrowDown className="w-4 h-4" aria-hidden="true" />
        </div>

        {/* Step 2: Retro-Validation Check */}
        <div
          className={`rounded border p-3 space-y-1 ${
            brokenViolation
              ? 'border-rose-300 bg-rose-50/60'
              : 'border-emerald-300 bg-emerald-50/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono">
            <span className={`font-semibold ${brokenViolation ? 'text-rose-900' : 'text-emerald-900'}`}>
              2. PREVIOUS PLAN FEASIBILITY CHECK
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                brokenViolation
                  ? 'bg-rose-100 text-rose-950 border border-rose-200'
                  : 'bg-emerald-100 text-emerald-950 border border-emerald-200'
              }`}
            >
              {brokenViolation ? 'VIOLATED' : 'FEASIBLE'}
            </span>
          </div>

          {brokenViolation ? (
            <div className="space-y-1 text-xs font-mono text-rose-950">
              <p className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0" aria-hidden="true" />
                Previous assignment breaks updated bound
              </p>
              {brokenViolation.inequality && (
                <p className="bg-rose-950 text-rose-100 px-2.5 py-1 rounded inline-block text-[11px]">
                  {brokenViolation.inequality} → FALSE
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1 text-xs font-mono text-emerald-900">
              <p className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                Previous assignment satisfies updated rules
              </p>
              <p className="text-[11px] text-emerald-800">
                All vehicle loads remain strictly within updated capacity bounds.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-center text-gray-400">
          <ArrowDown className="w-4 h-4" aria-hidden="true" />
        </div>

        {/* Step 3: Exact Solver Reassignment */}
        <div className="rounded border border-amber-300 bg-amber-50/50 p-3 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-amber-900">3. EXACT SOLVER REASSIGNMENT</span>
            <span className="text-[10px] text-amber-800 font-semibold px-2 py-0.5 bg-amber-100 rounded">
              Search Result
            </span>
          </div>

          {!currentSolution.feasible ? (
            <p className="text-xs font-mono text-rose-900 font-semibold">
              No feasible assignment exists for this configuration.
            </p>
          ) : comparison.movedCustomers.length > 0 ? (
            <ul className="space-y-1 text-xs font-mono text-amber-950">
              {comparison.movedCustomers.map((m) => (
                <li key={m.customerId} className="flex items-center gap-2">
                  <span>Customer {m.customerLabel} ({m.demand} kg):</span>
                  <span className="font-semibold">{vehicleName(m.fromVehicleId)}</span>
                  <ArrowRight className="w-3 h-3 text-amber-600" aria-hidden="true" />
                  <span className="font-semibold text-amber-900">{vehicleName(m.toVehicleId)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs font-mono text-amber-900">
              No customer reassignments were required. The original routing structure remains optimal.
            </p>
          )}
        </div>

        <div className="flex justify-center text-gray-400">
          <ArrowDown className="w-4 h-4" aria-hidden="true" />
        </div>

        {/* Step 4: Global Objective Effect */}
        <div className="rounded border border-gray-900 bg-gray-900 text-gray-100 p-3 space-y-1 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-amber-400">4. GLOBAL CONSEQUENCE</span>
            <span className="text-[10px] text-gray-300">Objective Delta</span>
          </div>

          {currentSolution.feasible ? (
            <div className="flex items-center justify-between pt-1">
              <span>Total Distance:</span>
              <span className="font-bold text-sm text-white">
                {comparison.previousDistance} → {comparison.currentDistance} units ({comparison.distanceDelta > 0 ? '+' : ''}{comparison.distanceDelta})
              </span>
            </div>
          ) : (
            <p className="text-rose-300">Objective undefined (instance is mathematically infeasible).</p>
          )}
        </div>
      </div>
    </Panel>
  );
}
