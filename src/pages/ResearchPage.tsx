import { ExternalLink, Target } from 'lucide-react';
import {
  BDH_CQ_MODULE,
  BDH_MODULE,
  CITATIONS,
  CVRP_FORMULATION,
  SCOPE_STATEMENT,
} from '../data/researchContent';
import { EvidenceBlock } from '../components/research/EvidenceBlock';
import { BdhArchitecture } from '../components/research/BdhArchitecture';
import { SudokuMicroDemo } from '../components/research/SudokuMicroDemo';
import { Panel } from '../components/ui/Panel';
import { Callout } from '../components/ui/Callout';

export function ResearchPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <span className="text-xs font-mono text-gray-500 uppercase tracking-wide">
          FRONTIER RESEARCH CONNECTION
        </span>
        <h2 className="text-xl font-serif font-semibold text-gray-900">
          BDH, BDH-CQ, and where this experiment actually sits
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed max-w-prose">
          The routing problem you have been playing with belongs to a class that
          frontier reasoning research uses as a testbed. This section says what that
          connection is, and — just as importantly — what it is not.
        </p>
      </div>

      {/* Explicit Research Learning Objective */}
      <div className="rounded-lg border border-teal-300 bg-teal-50/60 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-teal-800" aria-hidden="true" />
          <h3 className="text-xs font-mono font-bold text-teal-950 uppercase tracking-wide">
            Research Learning Objective
          </h3>
        </div>
        <p className="text-xs font-mono text-teal-900 leading-relaxed">
          "Understand how a frontier reasoning system can approach complex constraint tasks through learned internal state dynamics, and distinguish published research evidence from our own educational simulation."
        </p>
      </div>

      {/* The honest boundary, stated before anything else */}
      <Callout tone="warning" title="Read this before the rest">
        <div className="space-y-2 text-sm">
          <p>
            <strong>Our solver is not BDH.</strong> It is exhaustive enumeration over 64
            assignments. BDH is a trained sequence-model architecture. They share no
            mechanism, and nothing measured in this app is evidence about BDH.
          </p>
          <p>{SCOPE_STATEMENT.bridge}</p>
        </div>
      </Callout>

      {/* VRP -> Sudoku Side-by-Side Bridge */}
      <Panel title="The Conceptual Bridge: VRP vs. Sudoku">
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="rounded border border-gray-300 bg-gray-50 p-3 space-y-2">
              <h4 className="font-bold text-gray-900 uppercase border-b border-gray-200 pb-1">
                Vehicle Routing (Our Experiment)
              </h4>
              <p><strong>Variables:</strong> Customer assignments & route orderings</p>
              <p><strong>Constraints:</strong> Capacity limits, coverage, tour closure</p>
              <p><strong>Goal:</strong> Globally optimal, feasible routes</p>
            </div>

            <div className="rounded border border-gray-300 bg-gray-50 p-3 space-y-2">
              <h4 className="font-bold text-gray-900 uppercase border-b border-gray-200 pb-1">
                Sudoku (BDH Case Study)
              </h4>
              <p><strong>Variables:</strong> Grid cell numerical values</p>
              <p><strong>Constraints:</strong> Row, column, and 3x3 box uniqueness</p>
              <p><strong>Goal:</strong> Globally consistent grid completion</p>
            </div>
          </div>

          <div className="rounded border border-amber-300 bg-amber-50/70 p-3 text-xs font-mono text-amber-950">
            <strong className="block text-amber-900 uppercase mb-1">
              Different domains. Same broad reasoning challenge.
            </strong>
            "Local choices must remain consistent with a larger system of interacting constraints."
          </div>
        </div>
      </Panel>

      {/* Interactive Sudoku Micro-Demo */}
      <SudokuMicroDemo />

      {/* BDH Module */}
      <Panel
        title={BDH_MODULE.name}
        subtitle={`${BDH_MODULE.developer} — primary source: arXiv:2509.26507`}
      >
        <div className="p-4 space-y-5">
          <p className="text-sm text-gray-800 leading-relaxed max-w-prose">
            {BDH_MODULE.oneLine}
          </p>

          {BDH_MODULE.whatItChanges.map((section) => (
            <div key={section.heading} className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-900">{section.heading}</h3>
              <p className="text-sm text-gray-700 leading-relaxed max-w-prose">
                {section.body}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200">
          <BdhArchitecture />
        </div>

        <div className="border-t border-gray-200 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">
            The two local rules, as the paper states them
          </h3>
          {BDH_MODULE.equations.map((equation) => (
            <div
              key={equation.label}
              className="rounded border border-gray-200 overflow-hidden"
            >
              <div className="px-3 py-2 bg-gray-900 text-gray-100 font-mono text-sm">
                {equation.plain}
              </div>
              <div className="px-3 py-2 space-y-1">
                <p className="text-xs font-mono font-semibold text-gray-900">
                  {equation.label}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {equation.reading}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Published findings for BDH"
        subtitle="Each labelled with how strong the evidence actually is."
      >
        <EvidenceBlock items={BDH_MODULE.publishedFindings} />
        <div className="border-t border-gray-200 p-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              How this connects to the concept
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed max-w-prose">
              {BDH_MODULE.connectionToOurConcept}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {BDH_MODULE.commonMisconception.heading}
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed max-w-prose">
              {BDH_MODULE.commonMisconception.body}
            </p>
          </div>
        </div>
      </Panel>

      {/* BDH-CQ */}
      <Panel title={BDH_CQ_MODULE.name} subtitle="Primary source: arXiv:2608.09888">
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-800 leading-relaxed max-w-prose">
            {BDH_CQ_MODULE.oneLine}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed max-w-prose">
            {BDH_CQ_MODULE.mechanism}
          </p>
        </div>
        <div className="border-t border-gray-200">
          <EvidenceBlock items={BDH_CQ_MODULE.publishedFindings} />
        </div>
        <div className="border-t border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            How relevant is it here?
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed max-w-prose">
            {BDH_CQ_MODULE.relevanceToOurConcept}
          </p>
        </div>
      </Panel>

      {/* Our own formal model */}
      <Panel title={CVRP_FORMULATION.heading}>
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed max-w-prose">
            {CVRP_FORMULATION.intro}
          </p>

          <div className="rounded border border-gray-200 overflow-hidden">
            <div className="px-3 py-2 bg-gray-900 text-gray-100 font-mono text-sm">
              minimise Σ route distances
            </div>
            <p className="px-3 py-2 text-sm text-gray-700 leading-relaxed">
              {CVRP_FORMULATION.objective.detail}
            </p>
          </div>

          <ul className="divide-y divide-gray-200 border border-gray-200 rounded overflow-hidden">
            {CVRP_FORMULATION.constraints.map((constraint) => (
              <li key={constraint.id} className="p-3 space-y-1">
                <p className="text-sm font-semibold text-gray-900">
                  {constraint.label}
                </p>
                <p className="font-mono text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 inline-block text-gray-800">
                  {constraint.plain}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {constraint.detail}
                </p>
              </li>
            ))}
          </ul>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Method</h3>
            <p className="text-sm text-gray-700 leading-relaxed max-w-prose">
              {CVRP_FORMULATION.method}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Limits, stated rather than hidden
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              {CVRP_FORMULATION.limits.map((limit) => (
                <li key={limit} className="leading-relaxed">
                  {limit}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>

      {/* Sources */}
      <Panel title="Primary Research Sources">
        <ul className="divide-y divide-gray-200">
          {CITATIONS.map((citation) => (
            <li key={citation.id} className="p-4 space-y-1.5">
              <a
                href={citation.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-gray-900 underline decoration-gray-300 hover:decoration-gray-900 inline-flex items-start gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 rounded"
              >
                {citation.title}
                <ExternalLink className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
              </a>
              <p className="text-xs font-mono text-gray-600">
                {citation.authors} · {citation.venue} · {citation.year}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed max-w-prose">
                {citation.relevance}
              </p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
