import { FailureState } from '../components/experiment/FailureState';
import { ExplanationPanel } from '../components/experiment/ExplanationPanel';
import { RouteVisualizer } from '../components/experiment/RouteVisualizer';
import { Panel } from '../components/ui/Panel';
import { Callout } from '../components/ui/Callout';
import { useExperiment } from '../state/ExperimentContext';

/**
 * Nothing on this page is a special screen. It reads the same state as every
 * other view; it just gives the infeasible case room to be explained properly.
 */
export function BreakingPointPage() {
  const { state, derived, actions } = useExperiment();
  const feasible = state.currentSolution.feasible;
  const { validation } = derived;

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <div className="max-w-3xl space-y-2">
        <h2 className="text-xl font-serif font-semibold text-gray-900">
          Breaking point
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Constraints can conflict badly enough that no plan exists at all. That is a
          different situation from a search that failed, and it is worth being able to
          tell them apart.
        </p>
      </div>

      {feasible ? (
        <Panel title="Currently satisfiable">
          <div className="p-4 space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed max-w-prose">
              Right now the fleet can carry {validation.totalCapacity} kg and the
              customers need {validation.totalDemand} kg, leaving{' '}
              {validation.fleetSlack} kg of slack. Shrink the vehicles far enough and
              that slack goes negative — at which point no assignment can work, whatever
              order you try them in.
            </p>
            <button
              type="button"
              onClick={() => {
                actions.applyScenario('break-it');
                actions.recalculate();
              }}
              className="px-4 py-2.5 rounded bg-rose-700 text-white font-mono text-xs font-semibold hover:bg-rose-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-rose-700"
            >
              Shrink both vehicles to 30 kg and recalculate
            </button>
            <p className="text-xs font-mono text-gray-600">
              Or set the sliders yourself in the workstation — this button is a shortcut,
              not a separate code path.
            </p>
          </div>
        </Panel>
      ) : (
        <>
          <FailureState />
          <ExplanationPanel />
          <Callout tone="note" title="Getting back">
            <p>
              Raise capacity above {validation.totalDemand} kg in total, or lower demand
              below {validation.totalCapacity} kg, and a plan exists again. Reset returns
              everything to the starting instance.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  actions.applyScenario('baseline');
                  actions.recalculate();
                }}
                className="px-3 py-2 rounded bg-gray-900 text-white font-mono text-xs hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
              >
                Restore the baseline capacities
              </button>
              <button
                type="button"
                onClick={() => actions.setView('workstation')}
                className="px-3 py-2 rounded border border-gray-300 bg-white font-mono text-xs text-gray-800 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
              >
                Adjust it yourself
              </button>
            </div>
          </Callout>
        </>
      )}

      <RouteVisualizer heightClass="h-[380px]" showOverlayToggle={false} />
    </div>
  );
}
