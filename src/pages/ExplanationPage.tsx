import { ExplanationPanel } from '../components/experiment/ExplanationPanel';
import { ValidationEvidence } from '../components/experiment/ValidationEvidence';
import { RouteVisualizer } from '../components/experiment/RouteVisualizer';

export function ExplanationPage() {
  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      <div className="max-w-3xl space-y-2">
        <h2 className="text-xl font-serif font-semibold text-gray-900">
          Why it changed
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          A chain from the constraint you moved to the plan you are looking at. Each
          step names the numbers it rests on, so you can check any of them against the
          map.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <ExplanationPanel />
        </div>
        <div className="lg:col-span-5 space-y-6">
          <RouteVisualizer heightClass="h-[320px]" showOverlayToggle={false} />
          <ValidationEvidence />
        </div>
      </div>
    </div>
  );
}
