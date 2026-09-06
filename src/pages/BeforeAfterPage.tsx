import { BeforeAfter } from '../components/experiment/BeforeAfter';
import { RouteVisualizer } from '../components/experiment/RouteVisualizer';
import { ValidationEvidence } from '../components/experiment/ValidationEvidence';

export function BeforeAfterPage() {
  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <div className="max-w-3xl space-y-2">
        <h2 className="text-xl font-serif font-semibold text-gray-900">
          Before and after
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          The two plans side by side, with the constraint edit that separates them.
          Turn on the overlay in the map to see the old tours as dashed lines.
        </p>
      </div>

      <RouteVisualizer heightClass="h-[400px]" />
      <BeforeAfter />
      <ValidationEvidence />
    </div>
  );
}
