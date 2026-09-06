import { ExternalLink } from 'lucide-react';
import {
  EVIDENCE_LABELS,
  citationById,
  type EvidenceItem,
  type EvidenceLevel,
} from '../../data/researchContent';

const TONE: Record<EvidenceLevel, string> = {
  'live-computation': 'bg-emerald-100 text-emerald-900 border-emerald-300',
  'published-primary': 'bg-blue-100 text-blue-900 border-blue-300',
  'developer-reported': 'bg-amber-100 text-amber-900 border-amber-400',
  'independently-reproduced': 'bg-emerald-100 text-emerald-900 border-emerald-300',
  'our-interpretation': 'bg-gray-100 text-gray-800 border-gray-300',
};

/**
 * Every research claim is shown with its evidence level attached. A benchmark
 * reported by the people who built the system is labelled as exactly that.
 */
export function EvidenceBlock({ items }: { readonly items: readonly EvidenceItem[] }) {
  return (
    <ul className="divide-y divide-gray-200">
      {items.map((item, index) => {
        const citation = citationById(item.citationId);
        return (
          <li key={index} className="px-4 py-4 space-y-2">
            <p className="text-sm text-gray-900 leading-relaxed">{item.claim}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${TONE[item.level]}`}
              >
                {EVIDENCE_LABELS[item.level]}
              </span>
              {citation && (
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-mono text-gray-700 underline decoration-gray-300 hover:decoration-gray-900 inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 rounded"
                >
                  {citation.venue}
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              )}
            </div>
            <p className="text-xs text-gray-600 leading-relaxed max-w-prose">
              {item.detail}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
