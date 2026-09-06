import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { PREDICTION_OPTIONS } from '../../domain/prediction/evaluatePrediction';
import { useExperiment } from '../../state/ExperimentContext';
import { Panel } from '../ui/Panel';

/**
 * The learner makes the prediction; the solver settles it. There is no model
 * predicting anything here — the "outcome" is a classification of what the
 * recalculation actually did.
 */
export function PredictionPanel() {
  const { state, derived, actions } = useExperiment();
  const { prediction } = state;
  const { hasPendingChanges } = derived;

  const settled = prediction.outcome !== null;

  return (
    <Panel
      title="Before you recalculate"
      subtitle="Commit to an answer first. Being wrong here is the most useful thing that can happen."
    >
      <div className="p-4 space-y-3">
        {!hasPendingChanges && !settled && (
          <p className="text-xs font-mono text-gray-600 bg-gray-50 border border-gray-200 rounded p-2.5">
            <HelpCircle className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" aria-hidden="true" />
            Change a constraint first, then predict what recalculating will do.
          </p>
        )}

        <fieldset disabled={settled} className="space-y-2">
          <legend className="sr-only">What will happen when you recalculate?</legend>
          {PREDICTION_OPTIONS.map((option) => {
            const chosen = prediction.choice === option.id;
            const isActual = settled && prediction.outcome === option.id;

            return (
              <label
                key={option.id}
                className={`flex gap-3 p-3 rounded border cursor-pointer transition-colors ${
                  isActual
                    ? 'border-emerald-500 bg-emerald-50'
                    : chosen
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:bg-gray-50'
                } ${settled ? 'cursor-default' : ''}`}
              >
                <input
                  type="radio"
                  name="prediction"
                  value={option.id}
                  checked={chosen}
                  onChange={() => actions.submitPrediction(option.id)}
                  className="mt-0.5 accent-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                />
                <span className="min-w-0">
                  <span className="block text-xs font-mono font-semibold text-gray-900">
                    {option.label}
                    {isActual && (
                      <span className="ml-2 text-emerald-800">← what happened</span>
                    )}
                    {chosen && !isActual && settled && (
                      <span className="ml-2 text-rose-800">← your answer</span>
                    )}
                  </span>
                  <span className="block text-[11px] text-gray-600 mt-0.5 leading-snug">
                    {option.description}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>

        {settled && (
          <div
            className={`rounded border p-3 space-y-2 ${
              prediction.correct
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-amber-400 bg-amber-50'
            }`}
          >
            <p className="flex items-center gap-2 font-mono text-xs font-bold">
              {prediction.correct ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  <span className="text-emerald-900">You called it</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-amber-700" aria-hidden="true" />
                  <span className="text-amber-900">Not what happened</span>
                </>
              )}
            </p>
            <p className="text-sm text-gray-800 leading-relaxed">
              {prediction.outcomeDetail}
            </p>
            <button
              type="button"
              onClick={actions.clearPrediction}
              className="text-xs font-mono underline text-gray-700 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 rounded"
            >
              Predict again
            </button>
          </div>
        )}
      </div>
    </Panel>
  );
}
