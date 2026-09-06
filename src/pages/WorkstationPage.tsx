import { RouteVisualizer } from '../components/experiment/RouteVisualizer';
import { ConstraintPanel } from '../components/experiment/ConstraintPanel';
import { PredictionPanel } from '../components/experiment/PredictionPanel';
import { ExperimentStatus } from '../components/experiment/ExperimentStatus';
import { SolverTelemetry } from '../components/experiment/SolverTelemetry';
import { FailureState } from '../components/experiment/FailureState';
import { ConstraintTrace } from '../components/experiment/ConstraintTrace';
import { Callout } from '../components/ui/Callout';
import { useExperiment } from '../state/ExperimentContext';

export function WorkstationPage() {
  const { state, derived, actions } = useExperiment();

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-6">
      <div className="max-w-3xl space-y-2">
        <span className="text-xs font-mono text-gray-500 uppercase tracking-wide">
          PRIMARY EXPERIMENT WORKSTATION
        </span>
        <h2 className="text-xl font-serif font-semibold text-gray-900">
          The workstation
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Move a slider, commit to a prediction, then recalculate. Watch how local constraint edits trigger global solution reorganization.
        </p>
      </div>

      {state.error && (
        <Callout tone="danger" title="The solver safety limit was reached">
          <p>{state.error}</p>
          <p className="mt-2 text-sm">
            Try a smaller change, or press Reset to return to the starting instance.
          </p>
        </Callout>
      )}

      {!state.currentSolution.feasible && <FailureState />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dominant Route Visualizer (67% Desktop Width) */}
        <div className="lg:col-span-8 space-y-6">
          <RouteVisualizer heightClass="h-[480px]" />
          <ConstraintTrace />
          <ExperimentStatus />
          <SolverTelemetry />
        </div>

        {/* Controls & Prediction Sidebar (33% Desktop Width) */}
        <div className="lg:col-span-4 space-y-6">
          <ConstraintPanel />
          <PredictionPanel />

          {derived.comparison.movedCustomers.length > 0 && (
            <Callout tone="warning" title="Reassignment Occurred">
              <p>
                {derived.comparison.movedCustomers
                  .map((m) => m.customerLabel)
                  .join(', ')}{' '}
                changed vehicle on the last run, and total distance moved by{' '}
                {derived.comparison.distanceDelta > 0 ? '+' : ''}
                {derived.comparison.distanceDelta} units.
              </p>
              <button
                type="button"
                onClick={() => actions.setView('explanation')}
                className="mt-2 text-xs font-mono underline text-amber-900 hover:text-amber-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 rounded font-semibold"
              >
                View full step-by-step breakdown →
              </button>
            </Callout>
          )}
        </div>
      </div>
    </div>
  );
}
