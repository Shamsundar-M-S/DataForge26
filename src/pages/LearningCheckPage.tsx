import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { LEARNING_CHECK } from '../data/learningCheck';
import { Panel } from '../components/ui/Panel';
import { useExperiment } from '../state/ExperimentContext';

export function LearningCheckPage() {
  const { actions } = useExperiment();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const answered = Object.keys(answers).length;
  const correct = LEARNING_CHECK.filter(
    (q) => answers[q.id] === q.correctOptionId,
  ).length;

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-serif font-semibold text-gray-900">
          Learning check
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Five questions about what you just did. Every answer can be settled by going
          back to the workstation and trying it, which is the better way to disagree
          with one.
        </p>
      </div>

      {LEARNING_CHECK.map((question, index) => {
        const chosen = answers[question.id];
        const isAnswered = chosen !== undefined;
        const isCorrect = chosen === question.correctOptionId;

        return (
          <Panel key={question.id} title={`Question ${index + 1} of ${LEARNING_CHECK.length}`}>
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-900 leading-relaxed">{question.prompt}</p>

              <fieldset disabled={isAnswered} className="space-y-2">
                <legend className="sr-only">{question.prompt}</legend>
                {question.options.map((option) => {
                  const isThisChosen = chosen === option.id;
                  const isRight = option.id === question.correctOptionId;
                  const reveal = isAnswered && (isThisChosen || isRight);

                  return (
                    <label
                      key={option.id}
                      className={`flex gap-3 p-2.5 rounded border text-sm cursor-pointer ${
                        reveal && isRight
                          ? 'border-emerald-400 bg-emerald-50'
                          : reveal && isThisChosen
                            ? 'border-rose-400 bg-rose-50'
                            : 'border-gray-200 hover:bg-gray-50'
                      } ${isAnswered ? 'cursor-default' : ''}`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        checked={isThisChosen}
                        onChange={() =>
                          setAnswers((prev) => ({ ...prev, [question.id]: option.id }))
                        }
                        className="mt-0.5 accent-gray-900"
                      />
                      <span className="text-gray-800">{option.text}</span>
                    </label>
                  );
                })}
              </fieldset>

              {isAnswered && (
                <div
                  className={`rounded border p-3 space-y-1.5 ${
                    isCorrect
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-amber-400 bg-amber-50'
                  }`}
                >
                  <p className="flex items-center gap-2 text-xs font-mono font-bold">
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                        <span className="text-emerald-900">Correct</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-amber-700" aria-hidden="true" />
                        <span className="text-amber-900">Not quite</span>
                      </>
                    )}
                  </p>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {question.explanation}
                  </p>
                </div>
              )}
            </div>
          </Panel>
        );
      })}

      {answered === LEARNING_CHECK.length && (
        <Panel title="Done">
          <div className="p-4 space-y-3">
            <p className="text-sm text-gray-800">
              {correct} of {LEARNING_CHECK.length} correct.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAnswers({})}
                className="px-3 py-2 rounded border border-gray-300 bg-white font-mono text-xs text-gray-800 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
              >
                Clear answers
              </button>
              <button
                type="button"
                onClick={() => actions.setView('workstation')}
                className="px-3 py-2 rounded bg-gray-900 text-white font-mono text-xs hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
              >
                Back to the workstation
              </button>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
