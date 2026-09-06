/**
 * Research content for the BDH / BDH-CQ module.
 *
 * Every factual claim below is traceable to a primary source listed in
 * CITATIONS. Nothing here is a measurement taken by this application. Where a
 * result was reported by the developer rather than independently reproduced,
 * the evidence level says so.
 *
 * If you are editing this file: do not add a number, capability, or result you
 * cannot point at in a primary source.
 */

export type EvidenceLevel =
  | 'live-computation'
  | 'published-primary'
  | 'developer-reported'
  | 'independently-reproduced'
  | 'our-interpretation';

export interface Citation {
  readonly id: string;
  readonly title: string;
  readonly authors: string;
  readonly venue: string;
  readonly year: number;
  readonly url: string;
  readonly relevance: string;
}

export interface EvidenceItem {
  readonly claim: string;
  readonly level: EvidenceLevel;
  readonly detail: string;
  readonly citationId?: string;
}

export const EVIDENCE_LABELS: Record<EvidenceLevel, string> = {
  'live-computation': 'Computed live in this app',
  'published-primary': 'Published in a primary source',
  'developer-reported': 'Reported by the developer',
  'independently-reproduced': 'Independently reproduced',
  'our-interpretation': 'Our reading of the sources',
};

/* -------------------------------------------------------------------------- */
/* What this app is and is not                                                 */
/* -------------------------------------------------------------------------- */

export const SCOPE_STATEMENT = {
  heading: 'What runs here, and what does not',
  isDoing: [
    'A deterministic exact solver for a six-customer, two-vehicle routing problem, running in your browser.',
    'It enumerates every assignment, discards the ones that break a capacity limit, and orders each tour by trying every permutation.',
    'Loads, distances, feasibility and the before/after difference are all measured from the instance on screen.',
  ],
  isNotDoing: [
    'This solver is not BDH. It shares no mechanism with BDH, BDH-GPU or BDH-CQ.',
    'No language model is involved anywhere in the experiment or the explanations.',
    'Nothing here reproduces, approximates or benchmarks a Pathway model. We have not run one.',
    'The routing instance is invented for teaching. It is not sampled from a real delivery network.',
  ],
  bridge:
    'What the experiment gives you is first-hand experience of one property of constrained reasoning: ' +
    'a change that is local in the problem statement is not local in the solution. That property is why ' +
    'constraint tasks are used to test reasoning systems — and it is the honest link to the research below.',
} as const;

/* -------------------------------------------------------------------------- */
/* The concept                                                                 */
/* -------------------------------------------------------------------------- */

export const CONCEPT = {
  name: 'Reasoning Under Complex Constraints',
  claim:
    'In a constrained routing problem, changing one active constraint can invalidate a previously ' +
    'feasible assignment and force a different globally feasible solution.',
  whyItIsFalsifiable:
    'The claim fails if you can find a constraint change that breaks the current plan and yet leaves ' +
    'the optimal assignment untouched. The sliders let you look: most small changes do nothing at all, ' +
    'and the interesting question is exactly where the threshold sits.',
  whyItMatters:
    'A system that reasons under constraints cannot treat its decisions as independent. Deciding where ' +
    'one customer goes changes what is still possible for every other customer. Locally sensible choices ' +
    'can add up to a globally impossible plan — which is the failure mode that constraint benchmarks probe.',
  prerequisites: [
    'Comfort reading a simple inequality such as load ≤ capacity.',
    'No optimisation background needed. No machine-learning background needed.',
  ],
  audience:
    'Students and practitioners meeting constraint reasoning for the first time, and anyone who wants ' +
    'a concrete handle on why constraint-satisfaction tasks are used to evaluate reasoning models.',
  learningObjectives: [
    'Read a capacity constraint and say whether a given plan satisfies it.',
    'Predict, before recalculating, whether a constraint change will leave the plan alone, force a reassignment, or make the problem impossible.',
    'Explain why a vehicle nobody edited can still end up with different work.',
    'Distinguish "no solution was found" from "no solution exists", and say which one the failure screen shows.',
    'State where BDH and BDH-CQ sit relative to this problem, and what this app does not establish about them.',
  ],
} as const;

/* -------------------------------------------------------------------------- */
/* BDH                                                                         */
/* -------------------------------------------------------------------------- */

export const BDH_MODULE = {
  name: 'BDH — Dragon Hatchling',
  developer: 'Pathway (Palo Alto)',
  oneLine:
    'A language-model architecture built as a network of locally interacting neuron particles, ' +
    'in which the working memory used during inference lives on the connections between neurons ' +
    'rather than in a growing token history.',

  whatItChanges: [
    {
      heading: 'Where the state lives',
      body:
        'BDH separates a fixed set of connections, learned by training, from an evolving set that changes ' +
        'during inference. The paper identifies the evolving set with what earlier work called "fast weights": ' +
        'a system over n facts has O(n²) trainable parameters and O(n²) state entries, whereas a classical ' +
        'recurrent network keeps only O(n) state variables. Sparsity is then chosen so that the number of ' +
        'connections m sits between those extremes, n ≪ m ≪ n².',
    },
    {
      heading: 'What updates as it reads',
      body:
        'The paper frames inference as two local rules over facts and the connections between them. ' +
        'A reasoning rule propagates belief along a connection; a Hebbian rule strengthens a connection ' +
        'when one fact has just contributed evidence for another. Attention, in this account, is not a ' +
        'separate mechanism bolted on — it is what the synaptic state does.',
    },
    {
      heading: 'How it is actually trained',
      body:
        'BDH-GPU is a tensor-friendly special case obtained by treating the particles as communicating ' +
        'through a mean field rather than along specific wires. It combines a "ReLU-lowrank" feed-forward ' +
        'block with linear attention, both operating in the same high neuron dimension n, with a second ' +
        'parameter d (256 in the paper\'s experiments) and (3 + o(1))·n·d parameters in total.',
    },
  ],

  equations: [
    {
      label: 'Reasoning step',
      latex: 'X(i),\\ \\sigma(i,j)\\ \\longrightarrow\\ A(j)',
      plain: 'X(i), σ(i,j) → A(j)',
      reading:
        'If the system believes fact i to degree X(i), and a connection σ(i,j) says i supports j, then ' +
        'that belief contributes X(i)·σ(i,j) to its belief in j.',
    },
    {
      label: 'Hebbian update',
      latex: 'Y(i),\\ X(j)\\ \\longrightarrow\\ \\sigma(i,j)',
      plain: 'Y(i), X(j) → σ(i,j)',
      reading:
        'When activity at i is followed by activity at j, the connection σ(i,j) is strengthened by Y(i)·X(j). ' +
        'This is the state that changes as the model reads; the trained weights do not move.',
    },
  ],

  publishedFindings: [
    {
      claim:
        'BDH-GPU follows the parameter-versus-loss scaling of GPT-2-architecture Transformers between ' +
        '10M and 1B parameters on the next-token tasks tested, including language and translation.',
      level: 'published-primary' as EvidenceLevel,
      detail:
        'Reported by the architecture\'s authors in the Dragon Hatchling paper, on their own training runs.',
      citationId: 'bdh2025',
    },
    {
      claim:
        'Positive activations in BDH-GPU are sparse, at roughly the 5% level, and sparsity varies with how ' +
        'much work the model is doing on a given token rather than following a fixed budget.',
      level: 'published-primary' as EvidenceLevel,
      detail: 'Empirical finding in the same paper.',
      citationId: 'bdh2025',
    },
    {
      claim:
        'In-context state localises on the same individual synapses across multiple prompts, so for some ' +
        'basic features the current state can be read off a single connection.',
      level: 'published-primary' as EvidenceLevel,
      detail:
        'The paper\'s monosemantic-synapse experiment. It is presented for some basic features, not as a general guarantee.',
      citationId: 'bdh2025',
    },
    {
      claim:
        'On Sudoku Extreme, across roughly 250,000 difficult puzzles, BDH is reported at 97.4% accuracy ' +
        'without chain-of-thought, backtracking or external tools, against leading LLMs at approximately 0%.',
      level: 'developer-reported' as EvidenceLevel,
      detail:
        'This is the result the DataForge brief points to as a constraint-reasoning case study, and it is ' +
        'the closest published point to what this app teaches. Read it carefully: Pathway states the figure ' +
        'comes from internal data on an internal implementation, that the public repository does not ' +
        'reproduce it out of the box, and the LLM baseline is taken from a separate paper. It is a ' +
        'developer-reported benchmark result, not an independent reproduction and not a deployment.',
      citationId: 'bdhRepo',
    },
  ] satisfies readonly EvidenceItem[],

  connectionToOurConcept:
    'Sudoku and vehicle routing are both problems where many rules must hold at once and a locally ' +
    'plausible choice can create a contradiction somewhere else. That is the shared structure, and it is ' +
    'the whole of the connection. Our solver reaches its answer by exhaustive search over a six-customer ' +
    'instance; BDH reaches its answers by learned dynamics over a trained network. The two are not ' +
    'variants of one method, and a result about one says nothing about the other.',

  commonMisconception: {
    heading: 'A misconception worth naming',
    body:
      'BDH is sometimes described as a constraint solver, or as an SSM in the Mamba sense. Neither is right. ' +
      'It is a sequence-model architecture whose reported constraint-task performance is evidence about the ' +
      'architecture, not a claim that it implements constraint propagation. The DataForge brief makes the ' +
      'second point explicitly: BDH should not be classified as an SSM in the Mamba sense, and BDH-GPU is a ' +
      'separate GPU-friendly formulation built from ReLU-lowrank transformations with linear attention.',
  },
} as const;

/* -------------------------------------------------------------------------- */
/* BDH-CQ                                                                      */
/* -------------------------------------------------------------------------- */

export const BDH_CQ_MODULE = {
  name: 'BDH-CQ',
  oneLine:
    'A later system in the same family that takes in demonstrations at inference time, updates a recurrent ' +
    'memory from them, and then reasons by iterating in a latent space instead of writing out its steps.',

  mechanism:
    'Demonstrations presented at inference modify the recurrent memory; the query is then solved by repeated ' +
    'computation in a high-dimensional latent state, and only the final answer is decoded. The intermediate ' +
    'reasoning is never turned into tokens. Because reasoning effort is spent on latent iterations rather than ' +
    'generated text, more effort does not mean more output tokens.',

  publishedFindings: [
    {
      claim:
        'A 150M-parameter configuration reaches 29.5% pass@2 on the public ARC-AGI-1 evaluation set at a ' +
        'computed inference cost of about $0.0007 per task.',
      level: 'published-primary' as EvidenceLevel,
      detail:
        'Reported in the BDH-CQ technical report. The cost is computed from roughly 0.85 H200 GPU-seconds ' +
        'per task at an assumed price per GPU-hour, so it is a computed operating cost, not a billed price.',
      citationId: 'bdhcq2026',
    },
    {
      claim:
        'The report presents this as a new point on the ARC-AGI-1 cost–accuracy frontier: a cost-efficiency ' +
        'result, not the highest standalone accuracy on the benchmark.',
      level: 'published-primary' as EvidenceLevel,
      detail:
        'Worth stating precisely, because "state of the art" here means state of the art in cost efficiency.',
      citationId: 'bdhcq2026',
    },
    {
      claim:
        'The report documents concrete limitations: ordering larger sets of objects, nesting, conditional ' +
        'rule selection, unseen parameter values and composition remain difficult.',
      level: 'published-primary' as EvidenceLevel,
      detail:
        'Named failure modes from the paper\'s own controlled interventions — the kind of limitation the ' +
        'brief asks submissions to surface rather than hide.',
      citationId: 'bdhcq2026',
    },
  ] satisfies readonly EvidenceItem[],

  relevanceToOurConcept:
    'BDH-CQ is the weaker of the two connections for this concept, and we would rather say so than invent a ' +
    'link. Its evidence is about acquiring a rule from demonstrations on ARC-style grids, not about holding ' +
    'many constraints consistent. It is relevant here for one reason: it is a worked example of reasoning ' +
    'effort being spent somewhere other than a written chain of thought, which is the same question our ' +
    'explanation panel answers in miniature — the steps you read there are reconstructed from computed ' +
    'state, not narrated by the thing that did the computing. The report itself lists constraint-satisfaction ' +
    'domains as future work rather than demonstrated ground.',
} as const;

/* -------------------------------------------------------------------------- */
/* The formal problem this app solves                                          */
/* -------------------------------------------------------------------------- */

export const CVRP_FORMULATION = {
  heading: 'The problem, written out',
  intro:
    'What the solver optimises, stated plainly. This is the classical Capacitated Vehicle Routing Problem ' +
    'introduced by Dantzig and Ramser in 1959.',
  objective: {
    label: 'Objective',
    plain: 'minimise the total distance travelled by all vehicles',
    detail:
      'Distance between two points is the straight-line distance √((x₁−x₂)² + (y₁−y₂)²). ' +
      'A route\'s distance is the sum over depot → first customer → … → last customer → depot.',
  },
  constraints: [
    {
      id: 'coverage',
      label: 'Every customer is served',
      plain: 'each customer appears in exactly one route',
      detail: 'No customer may be skipped, and none may be visited twice.',
    },
    {
      id: 'depot',
      label: 'Tours are closed',
      plain: 'each route starts at the depot and returns to it',
      detail: 'A vehicle with no customers stays at the depot and travels zero distance.',
    },
    {
      id: 'capacity',
      label: 'Capacity is respected',
      plain: 'Σ demand of customers on vehicle k ≤ capacity of vehicle k',
      detail:
        'This is the constraint the experiment moves. It is the one that couples decisions together: ' +
        'the moment it binds, where one customer goes constrains where the others can go.',
    },
  ],
  method:
    'Because the instance is tiny — six customers, two vehicles — the solver can be exact rather than ' +
    'heuristic. It enumerates all 2⁶ = 64 assignments of customers to vehicles, keeps those within capacity, ' +
    'and finds each vehicle\'s shortest tour by trying every visiting order. The answer is therefore optimal ' +
    'for the instance on screen, and the same inputs always produce the same output.',
  limits: [
    'Six customers and two vehicles. The search is exhaustive, so it does not scale; the code refuses instances beyond its stated bounds rather than quietly approximating.',
    'Distances are straight lines on a plane. There are no roads, no traffic, no time windows and no driver hours.',
    'Capacity is the only coupling constraint. Real routing has many more, and they interact in ways this instance cannot show.',
    'Distances are rounded to two decimal places, which is why repeated solves are bit-identical.',
  ],
} as const;

/* -------------------------------------------------------------------------- */
/* Citations                                                                   */
/* -------------------------------------------------------------------------- */

export const CITATIONS: readonly Citation[] = [
  {
    id: 'bdh2025',
    title:
      'The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain',
    authors:
      'A. Kosowski, P. Uznański, J. Chorowski, Z. Stamirowska, M. Bartoszkiewicz',
    venue: 'arXiv:2509.26507',
    year: 2025,
    url: 'https://arxiv.org/abs/2509.26507',
    relevance:
      'The primary source for BDH. Source of the two local rules quoted above, the fast-weights state ' +
      'argument, the BDH-GPU formulation, and the sparsity and monosemanticity findings.',
  },
  {
    id: 'bdhcq2026',
    title: 'BDH-CQ: In-Context Learning with Recurrent Latent Reasoning',
    authors: 'Pathway',
    venue: 'arXiv:2608.09888',
    year: 2026,
    url: 'https://arxiv.org/abs/2608.09888',
    relevance:
      'The primary source for BDH-CQ. Source of the ARC-AGI-1 figures, the cost computation, and the ' +
      'documented failure modes.',
  },
  {
    id: 'bdhRepo',
    title: 'pathwaycom/bdh — architecture, code, and the Sudoku Extreme note',
    authors: 'Pathway',
    venue: 'GitHub (MIT licence)',
    year: 2025,
    url: 'https://github.com/pathwaycom/bdh',
    relevance:
      'Public implementation of the paper\'s baseline variant, and the source of the Sudoku Extreme figure ' +
      'together with its own caveat that the repository does not reproduce that result.',
  },
  {
    id: 'hrm2025',
    title: 'Hierarchical Reasoning Model',
    authors: 'G. Wang, J. Li, Y. Sun, X. Chen, C. Liu, Y. Wu, M. Lu, S. Song, Y. Abbasi Yadkori',
    venue: 'arXiv:2506.21734',
    year: 2025,
    url: 'https://arxiv.org/abs/2506.21734',
    relevance:
      'A recurrent, non-chain-of-thought approach evaluated on Sudoku-style constraint tasks. Cited here ' +
      'because it is the source Pathway credits for the LLM baseline in its Sudoku Extreme comparison — ' +
      'so it is where that "approximately 0%" number actually comes from.',
  },
  {
    id: 'lr2bench2025',
    title:
      'LR²Bench: Evaluating Long-chain Reflective Reasoning Capabilities of Large Language Models via Constraint Satisfaction Problems',
    authors: 'J. Chen et al.',
    venue: 'arXiv:2502.17848',
    year: 2025,
    url: 'https://arxiv.org/abs/2502.17848',
    relevance:
      'Uses constraint-satisfaction problems specifically to test whether models can backtrack and revise ' +
      'when an assumption fails — the behaviour our recalculation step performs by construction.',
  },
  {
    id: 'riddlebench2025',
    title: 'RiddleBench: A New Generative Reasoning Benchmark for LLMs',
    authors: 'Various',
    venue: 'arXiv:2510.24932',
    year: 2025,
    url: 'https://arxiv.org/abs/2510.24932',
    relevance:
      'Reports that model performance on constraint-rich puzzles degrades when constraints are reordered ' +
      'or irrelevant information is added — evidence that constraint handling in current models is fragile ' +
      'in ways an exact solver is not.',
  },
];

export function citationById(id: string | undefined): Citation | undefined {
  return id ? CITATIONS.find((c) => c.id === id) : undefined;
}
