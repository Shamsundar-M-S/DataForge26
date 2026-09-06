import { ArrowRight } from 'lucide-react';
import { CONCEPT, SCOPE_STATEMENT } from '../data/researchContent';
import { NAV_ITEMS } from '../app/navigation';
import { useExperiment } from '../state/ExperimentContext';
import { RouteVisualizer } from '../components/experiment/RouteVisualizer';
import { Panel } from '../components/ui/Panel';
import { Callout } from '../components/ui/Callout';

export function OverviewPage() {
  const { state, actions } = useExperiment();

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      <section className="space-y-4">
        <p className="text-xs font-mono text-gray-600">{CONCEPT.name}</p>
        <h2 className="text-2xl sm:text-3xl font-serif font-medium text-gray-900 leading-snug max-w-3xl">
          {CONCEPT.claim}
        </h2>
        <p className="text-base text-gray-700 leading-relaxed max-w-prose">
          {CONCEPT.whyItMatters}
        </p>
        <button
          type="button"
          onClick={() => actions.setView('workstation')}
          className="px-4 py-2.5 rounded bg-gray-900 text-white font-mono text-xs font-semibold inline-flex items-center gap-2 hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-900"
        >
          Start the experiment
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-serif font-semibold text-gray-900">
          The instance, already running
        </h3>
        <p className="text-sm text-gray-700 max-w-prose leading-relaxed">
          Six customers, two vehicles, one depot. Each customer must be visited exactly
          once, every tour starts and ends at the depot, and no vehicle may carry more
          than its capacity. The solver minimises total distance. Nothing is animated —
          this is the plan it computed for the numbers currently loaded.
        </p>
        <RouteVisualizer heightClass="h-[400px]" showOverlayToggle={false} />
      </section>

      <Callout tone="note" title="What is running, and what is not">
        <div className="space-y-3">
          <ul className="space-y-1.5 list-disc pl-5">
            {SCOPE_STATEMENT.isDoing.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <ul className="space-y-1.5 list-disc pl-5">
            {SCOPE_STATEMENT.isNotDoing.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </Callout>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Panel title="Who this is for">
          <div className="p-4 space-y-3 text-sm text-gray-700">
            <p className="leading-relaxed">{CONCEPT.audience}</p>
            <div>
              <p className="font-semibold text-gray-900 text-xs font-mono mb-1">
                You will need
              </p>
              <ul className="list-disc pl-5 space-y-0.5">
                {CONCEPT.prerequisites.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>

        <Panel title="By the end you should be able to">
          <ol className="p-4 space-y-2 text-sm text-gray-700 list-decimal pl-8">
            {CONCEPT.learningObjectives.map((line) => (
              <li key={line} className="leading-relaxed">
                {line}
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <Panel title="How to test the claim">
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed max-w-prose">
            {CONCEPT.whyItIsFalsifiable}
          </p>
          <ol className="space-y-1.5">
            {NAV_ITEMS.slice(1).map((item, index) => (
              <li key={item.id} className="flex items-center gap-3 text-sm">
                <span className="font-mono text-xs text-gray-500 w-5">{index + 1}</span>
                <button
                  type="button"
                  onClick={() => actions.setView(item.id)}
                  className="text-gray-900 underline decoration-gray-300 hover:decoration-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 rounded"
                >
                  {item.label}
                </button>
                <span className="text-gray-500 text-xs">{item.stage}</span>
              </li>
            ))}
          </ol>
        </div>
      </Panel>

      <p className="text-xs font-mono text-gray-500">
        Currently loaded: {state.committedProblem.label}.
      </p>
    </div>
  );
}
