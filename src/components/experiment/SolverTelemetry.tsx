import { useExperiment } from '../../state/ExperimentContext';

/**
 * What the solver actually did on the last run. Reported so a learner can see
 * that the answer came from a search, not from a lookup.
 */
export function SolverTelemetry() {
  const { state, derived } = useExperiment();
  const { stats } = state.currentSolution;
  const { validation } = derived;

  const rows: Array<[string, string]> = [
    ['Method', stats.algorithm],
    ['Assignments enumerated', String(stats.assignmentsEnumerated)],
    ['Within every capacity limit', String(stats.assignmentsFeasible)],
    ['Distinct tours ordered', String(stats.toursEvaluated)],
    ['Solve time', `${stats.elapsedMs} ms`],
    ['Distance re-measured by validator', `${validation.recomputedTotalDistance} units`],
  ];

  return (
    <div className="rounded-lg border border-slate-800 bg-[#0f172a] text-slate-200 overflow-hidden">
      <h2 className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/70 text-[11px] font-mono font-semibold tracking-wide text-slate-100">
        Solver run
      </h2>
      <dl className="divide-y divide-slate-800">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-2 text-xs font-mono">
            <dt className="text-slate-400">{label}</dt>
            <dd className="text-slate-100 text-right">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="px-4 py-2.5 border-t border-slate-800 text-[11px] font-mono text-slate-400 leading-relaxed">
        Runs in this browser tab. No server, no model, no network call.
      </p>
    </div>
  );
}
