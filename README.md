# ConstraintRoute

An interactive explainer for **Reasoning Under Complex Constraints**, built for the
DataForge 2026 Pathway track ("Explain the Frontier").

## The claim it teaches

> In a constrained routing problem, changing one active constraint can invalidate a
> previously feasible assignment and force a different globally feasible solution.

The claim is falsifiable inside the artifact. If you can find a constraint change that
breaks the current plan and yet leaves the optimal assignment untouched, the claim as
stated is wrong. The sliders let you look — and most small changes do nothing at all,
which is itself part of the lesson: a constraint only matters once it binds.

## Intended learner

Students and practitioners meeting constraint reasoning for the first time, and anyone
who wants a concrete handle on why constraint-satisfaction tasks are used to evaluate
reasoning models.

**Prerequisites:** the ability to read `load ≤ capacity`. No optimisation or machine
learning background required.

**Learning objectives.** After using this, a learner should be able to:

1. Read a capacity constraint and say whether a given plan satisfies it.
2. Predict, before recalculating, whether a change will leave the plan alone, force a
   reassignment, or make the problem impossible.
3. Explain why a vehicle nobody edited can still end up with different work.
4. Distinguish "no solution was found" from "no solution exists".
5. State where BDH and BDH-CQ sit relative to this problem, and what this app does
   **not** establish about them.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # typecheck + production build
npm test           # 103 domain tests
npm run smoke      # 40 interaction tests in jsdom
npm run typecheck
```

Node 18+. No backend, no database, no API keys. Everything runs in the browser tab.

## What is live, and what is not

| Part | Status |
|---|---|
| Routing solver, loads, distances, feasibility | **Live**, computed in your browser on every recalculation |
| Before/after diff, moved customers, changed arcs | **Live**, derived by comparing two solution objects |
| Explanation steps | **Live**, assembled deterministically from measured state |
| Prediction scoring | **Live**, classifies what the solver actually did |
| The demo instance itself | **Synthetic**, invented for teaching — not real logistics data |
| BDH / BDH-CQ results | **Published**, cited to primary sources with evidence levels attached |
| BDH architecture diagram | **Our illustration** of the paper's framing, labelled as such |

Nothing in this repository runs, reproduces, approximates or benchmarks a Pathway
model. **No language model is involved anywhere** — not in the experiment, not in the
explanations. There is no chatbot, no confidence score, and no invented metric.

### The solver is not BDH

Our solver is exhaustive enumeration over 64 customer-to-vehicle assignments. BDH is a
trained sequence-model architecture. They share no mechanism, and nothing measured here
is evidence about BDH. The honest connection is the *class of problem* — many rules
that must hold simultaneously, where a locally sensible choice can be globally
impossible — which is why constraint tasks are used to probe reasoning systems.

## The demo instance

One depot at (50, 50), two vehicles, six customers on a 100 × 100 plane.

| Customer | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| Demand (kg) | 30 | 25 | 35 | 15 | 10 | 10 |

Baseline capacities: V1 = 100 kg, V2 = 80 kg. Total demand 125 kg, total capacity 180 kg.

The instance is tuned so a learner can reach three distinct regimes by moving one
slider. The outcomes below are **computed**, not stored — they are recorded here so you
can verify the build reproduces them:

| Scenario | Result |
|---|---|
| Baseline | V1 `A→B→C` (90 kg), V2 `D→E→F` (35 kg), total **230.3** |
| V1 capacity → 60 kg | V1 `A→B` (55 kg), V2 `C→F→E→D` (70 kg), total **251.68**. Customer C moves. |
| Customer B demand → 40 kg | Assignment changes again with no capacity touched, total **251.68** |
| Both vehicles → 30 kg | **Infeasible.** 125 kg > 60 kg |

Note the threshold: nothing changes until V1 drops below 90 kg, because that is the load
its cluster carries. The constraint does no work until it binds.

## Architecture

```
src/
├── domain/            no React, no DOM, no JSX anywhere below this line
│   ├── models/        typed domain objects
│   ├── solver/        distance, permutations, exact solver, solver interface
│   ├── validation/    independent re-derivation of every claim a solution makes
│   ├── comparison/    solution and problem diffing
│   ├── explanation/   deterministic explanation engine
│   └── prediction/    outcome classification
├── state/             reducer, selectors, context definition
├── data/              demo instance, research content, learning check
├── components/        layout, experiment, research, ui
├── pages/             one per stage of the journey
└── app/               App, routes, provider
```

The invariant the whole codebase is organised around:

```
user input → application state → domain logic → computed result
          → validation → comparison → explanation → UI
```

Some specifics worth knowing:

- **The solver never imports React**, and the UI never calls enumeration functions.
  Everything goes through the `VrpSolver` interface in `src/domain/solver/index.ts`.
  Moving the solver behind an HTTP API means providing a different implementation
  there; nothing above that line changes.
- **Draft vs committed state.** Slider edits land in `draftProblem`. Nothing re-solves
  until Recalculate commits it. This is what makes a genuine before/after possible —
  without it, "previous solution" would mean one slider tick ago.
- **Validation is independent of the solver.** Loads are re-summed from demands and
  distances re-measured from coordinates. The application can say a solution is invalid
  even if the solver claims otherwise.
- **The explanation engine names nothing in advance.** No customer id, vehicle id or
  quantity is hard-coded. Which customer moves is read from the comparison layer.

## Determinism

The solver enumerates assignments in a fixed order, generates permutations in a fixed
order, improves only on strict inequality, and rounds distances to two decimal places.
Repeated solves of the same instance are bit-identical; a test asserts this.

## Stated limits

- Six customers, two vehicles. The search is exhaustive, so it does not scale. The code
  refuses instances beyond its bounds (`SolverError`) rather than quietly approximating.
- Straight-line distances on a plane. No roads, traffic, time windows or driver hours.
- Capacity is the only coupling constraint.
- Distances are rounded to 2dp, which is why route distances summed to a total may
  differ from an unrounded computation in the last digit.

## Sources

Primary papers, cited beside the claims they support in the app's research section:

1. Kosowski, Uznański, Chorowski, Stamirowska, Bartoszkiewicz — *The Dragon Hatchling:
   The Missing Link between the Transformer and Models of the Brain*,
   [arXiv:2509.26507](https://arxiv.org/abs/2509.26507) (2025).
2. Pathway — *BDH-CQ: In-Context Learning with Recurrent Latent Reasoning*,
   [arXiv:2608.09888](https://arxiv.org/abs/2608.09888) (2026).
3. Wang et al. — *Hierarchical Reasoning Model*,
   [arXiv:2506.21734](https://arxiv.org/abs/2506.21734) (2025). Source of the LLM
   baseline that Pathway credits in its Sudoku Extreme comparison.
4. Chen et al. — *LR²Bench: Evaluating Long-chain Reflective Reasoning Capabilities of
   LLMs via Constraint Satisfaction Problems*,
   [arXiv:2502.17848](https://arxiv.org/abs/2502.17848) (2025).
5. *RiddleBench: A New Generative Reasoning Benchmark for LLMs*,
   [arXiv:2510.24932](https://arxiv.org/abs/2510.24932) (2025).
6. [github.com/pathwaycom/bdh](https://github.com/pathwaycom/bdh) — public
   implementation (MIT), and the source of the Sudoku Extreme figure together with
   Pathway's own note that the repository does not reproduce it.

### On the Sudoku Extreme number

The 97.4% figure is **reported by the developer**, on an internal implementation, and
the public repository states it is not reproduced out of the box. The LLM baseline it
is compared against comes from a separate paper. The app labels it accordingly. A
developer-reported benchmark is not an independent reproduction and not a deployment.

## Credits and licences

- Code in this repository: MIT.
- Fonts: Newsreader, Hanken Grotesk, JetBrains Mono via Google Fonts (SIL Open Font
  License).
- Icons: [lucide-react](https://lucide.dev) (ISC).
- Build: Vite, React 19, Tailwind CSS v4.
- No third-party datasets, model weights or copyrighted material are bundled.

## AI assistance disclosure

The frontend visual language originated from a UI exploration. The domain layer
(solver, validation, comparison, explanation, state), the test suites, and the research
content were written with AI assistance and reviewed by the team. Every component,
equation, number and citation is one the team can explain and defend.

Three things were corrected during that review and are worth recording:

1. The original demo instance did not demonstrate the claim — reducing V1's capacity
   merely swapped two symmetric clusters, leaving total distance unchanged. The
   instance was redesigned so the effect is real, and verified computationally.
2. An earlier draft of the research section described BDH as "Bilinear Dynamic
   Hypergraphs", cited a paper that does not exist, and quoted an invented latency
   figure. All of it was removed and rewritten from primary sources.
3. An earlier explanation engine hard-coded the "violated" inequality, the affected
   customer, and the resulting distance. It now derives all three from computed state,
   and a test asserts no customer id appears in the engine's output titles.
