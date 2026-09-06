/**
 * Domain test suite for ConstraintRoute.
 *
 * Run with:  npm test
 *
 * These exercise the solver, validator, comparison, explanation and reset logic
 * directly. Nothing here renders a component: the point is to check that the
 * computation is right, not that React can draw it.
 */

import { euclideanDistance, routeDistance } from '../solver/distance';
import { permutations } from '../solver/permutations';
import { solveVrpExactly } from '../solver/exactVrpSolver';
import { validateSolution } from '../validation/validateSolution';
import { compareSolutions, diffProblems } from '../comparison/compareSolutions';
import { buildExplanation } from '../explanation/buildExplanation';
import { classifyOutcome } from '../prediction/evaluatePrediction';
import {
  BASELINE_PROBLEM,
  SCENARIOS,
  applyScenario,
} from '../../data/demoProblem';
import { validateSudokuCandidate } from '../../components/research/SudokuMicroDemo';
import { SolverError } from '../models/types';
import {
  createInitialState,
  experimentReducer,
  type ExperimentState,
} from '../../state/experimentReducer';
import { deriveExperiment } from '../../state/selectors';
import type { Customer, VRPProblem, VRPSolution } from '../models/types';

/* -------------------------------------------------------------------------- */
/* Tiny test harness                                                           */
/* -------------------------------------------------------------------------- */

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail = ''): void {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function group(title: string): void {
  console.log(`\n${title}`);
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function withCapacities(
  problem: VRPProblem,
  capacities: Record<string, number>,
): VRPProblem {
  return {
    ...problem,
    vehicles: problem.vehicles.map((v) => ({
      ...v,
      capacity: capacities[v.id] ?? v.capacity,
    })),
  };
}

function withDemands(
  problem: VRPProblem,
  demands: Record<string, number>,
): VRPProblem {
  return {
    ...problem,
    customers: problem.customers.map((c) => ({
      ...c,
      demand: demands[c.id] ?? c.demand,
    })),
  };
}

function scenario(id: string): VRPProblem {
  const found = SCENARIOS.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown scenario ${id}`);
  return applyScenario(BASELINE_PROBLEM, found);
}

function servedCustomers(solution: VRPSolution): string[] {
  return solution.routes.flatMap((r) => [...r.customerIds]).sort();
}

function vehicleOf(solution: VRPSolution, customerId: string): string | null {
  return (
    solution.routes.find((r) => r.customerIds.includes(customerId))?.vehicleId ?? null
  );
}

function dispatchAll(
  start: ExperimentState,
  actions: Parameters<typeof experimentReducer>[1][],
): ExperimentState {
  return actions.reduce(experimentReducer, start);
}

/* -------------------------------------------------------------------------- */
/* Distance                                                                    */
/* -------------------------------------------------------------------------- */

group('Distance');

check(
  '3-4-5 triangle',
  euclideanDistance({ x: 0, y: 0 }, { x: 3, y: 4 }) === 5,
);

check(
  'empty tour has zero length',
  routeDistance(BASELINE_PROBLEM.depot, [], new Map()) === 0,
);

{
  const map = new Map<string, Customer>(
    BASELINE_PROBLEM.customers.map((c) => [c.id, c]),
  );
  const single = routeDistance(BASELINE_PROBLEM.depot, ['A'], map);
  const a = BASELINE_PROBLEM.customers[0];
  const expected =
    Math.round(2 * euclideanDistance(BASELINE_PROBLEM.depot, a) * 100) / 100;
  check(
    'single-customer tour is out and back',
    Math.abs(single - expected) < 0.011,
    `${single} vs ${expected}`,
  );

  const forward = routeDistance(BASELINE_PROBLEM.depot, ['A', 'B', 'C'], map);
  const backward = routeDistance(BASELINE_PROBLEM.depot, ['C', 'B', 'A'], map);
  check(
    'a closed tour has the same length reversed',
    Math.abs(forward - backward) < 0.011,
  );
}

group('Permutations');
check('3 items give 6 orderings', permutations([1, 2, 3]).length === 6);
check('empty list gives one empty ordering', permutations([]).length === 1);
check(
  'permutation order is deterministic',
  JSON.stringify(permutations(['a', 'b'])) ===
    JSON.stringify(permutations(['a', 'b'])),
);

/* -------------------------------------------------------------------------- */
/* Solver                                                                      */
/* -------------------------------------------------------------------------- */

group('Solver — baseline instance');

const baselineSolution = solveVrpExactly(BASELINE_PROBLEM);

check('baseline is feasible', baselineSolution.feasible);
check(
  'every customer is served exactly once',
  JSON.stringify(servedCustomers(baselineSolution)) ===
    JSON.stringify(BASELINE_PROBLEM.customers.map((c) => c.id).sort()),
  servedCustomers(baselineSolution).join(','),
);
check(
  'each route respects its capacity',
  baselineSolution.routes.every((route) => {
    const vehicle = BASELINE_PROBLEM.vehicles.find((v) => v.id === route.vehicleId);
    return vehicle ? route.load <= vehicle.capacity : false;
  }),
);
check(
  'route loads equal the sum of their demands',
  baselineSolution.routes.every((route) => {
    const sum = route.customerIds.reduce((acc, id) => {
      const customer = BASELINE_PROBLEM.customers.find((c) => c.id === id);
      return acc + (customer?.demand ?? 0);
    }, 0);
    return sum === route.load;
  }),
);
check(
  'total distance is the sum of route distances',
  Math.abs(
    baselineSolution.routes.reduce((sum, r) => sum + r.distance, 0) -
      baselineSolution.totalDistance,
  ) < 0.011,
);
check('total distance is positive', baselineSolution.totalDistance > 0);

group('Solver — determinism');
{
  const runs = [1, 2, 3].map(() => solveVrpExactly(BASELINE_PROBLEM));
  const shapes = runs.map((r) =>
    JSON.stringify({
      feasible: r.feasible,
      totalDistance: r.totalDistance,
      routes: r.routes.map((route) => ({
        vehicleId: route.vehicleId,
        customerIds: route.customerIds,
        load: route.load,
        distance: route.distance,
      })),
    }),
  );
  check(
    'repeated solves return identical solutions',
    shapes[0] === shapes[1] && shapes[1] === shapes[2],
  );
}

group('Solver — optimality against brute force');
{
  // Independently re-derive the optimum by a separate, naive method.
  const problem = BASELINE_PROBLEM;
  const map = new Map<string, Customer>(problem.customers.map((c) => [c.id, c]));
  const ids = problem.customers.map((c) => c.id);
  let best = Number.POSITIVE_INFINITY;

  for (let mask = 0; mask < 1 << ids.length; mask += 1) {
    const g1: string[] = [];
    const g2: string[] = [];
    let l1 = 0;
    let l2 = 0;
    ids.forEach((id, i) => {
      const demand = map.get(id)!.demand;
      if (mask & (1 << i)) {
        g1.push(id);
        l1 += demand;
      } else {
        g2.push(id);
        l2 += demand;
      }
    });
    if (l1 > problem.vehicles[0].capacity) continue;
    if (l2 > problem.vehicles[1].capacity) continue;

    const cheapest = (group_: string[]): number =>
      group_.length === 0
        ? 0
        : Math.min(
            ...permutations(group_).map((p) => routeDistance(problem.depot, p, map)),
          );
    best = Math.min(best, cheapest(g1) + cheapest(g2));
  }

  check(
    'solver matches an independent brute-force optimum',
    Math.abs(best - baselineSolution.totalDistance) < 0.011,
    `brute force ${best.toFixed(2)} vs solver ${baselineSolution.totalDistance}`,
  );
}

group('Solver — responds to capacity changes');
{
  const tightened = solveVrpExactly(scenario('tighten-capacity'));
  check('tightened instance is still feasible', tightened.feasible);
  check(
    'tightening V1 changes the assignment',
    JSON.stringify(tightened.routes.map((r) => r.customerIds)) !==
      JSON.stringify(baselineSolution.routes.map((r) => r.customerIds)),
  );
  check(
    'tightened V1 stays within its new 60 kg limit',
    (tightened.routes.find((r) => r.vehicleId === 'v1')?.load ?? 0) <= 60,
  );
  check(
    'tightening cannot reduce total distance',
    tightened.totalDistance >= baselineSolution.totalDistance - 0.011,
    `${tightened.totalDistance} vs ${baselineSolution.totalDistance}`,
  );

  // Monotonicity across the whole slider range, not just the preset value.
  let previousDistance = 0;
  let monotone = true;
  for (let capacity = 140; capacity >= 45; capacity -= 5) {
    const solution = solveVrpExactly(withCapacities(BASELINE_PROBLEM, { v1: capacity }));
    if (!solution.feasible) continue;
    if (previousDistance > 0 && solution.totalDistance < previousDistance - 0.011) {
      monotone = false;
      break;
    }
    previousDistance = solution.totalDistance;
  }
  check('distance never improves as capacity shrinks', monotone);
}

group('Solver — responds to demand changes');
{
  const raised = solveVrpExactly(scenario('raise-demand'));
  check('raised-demand instance is feasible', raised.feasible);
  check(
    'raising a demand changes the assignment',
    JSON.stringify(raised.routes.map((r) => r.customerIds)) !==
      JSON.stringify(baselineSolution.routes.map((r) => r.customerIds)),
  );

  const lowered = solveVrpExactly(withDemands(BASELINE_PROBLEM, { B: 5 }));
  check(
    'lowering a demand keeps the instance feasible',
    lowered.feasible,
  );
}

group('Solver — infeasibility');
{
  const broken = solveVrpExactly(scenario('break-it'));
  check('shrinking the fleet makes it infeasible', !broken.feasible);
  check('infeasible solution has no routes', broken.routes.length === 0);
  check(
    'the violation names the fleet deficit',
    broken.violations[0]?.type === 'FLEET_CAPACITY_DEFICIT',
    broken.violations[0]?.type,
  );
  check(
    'the violation carries a real inequality',
    broken.violations[0]?.inequality?.includes('125') === true,
    broken.violations[0]?.inequality,
  );

  // Totals fit but the demands will not divide: a different kind of impossible.
  // Three 40 kg orders against 55 kg + 65 kg — enough capacity in total (120 kg
  // for 120 kg of demand), but no subset of the orders sums to a legal split.
  const indivisible: VRPProblem = {
    ...BASELINE_PROBLEM,
    vehicles: [
      { ...BASELINE_PROBLEM.vehicles[0], capacity: 55 },
      { ...BASELINE_PROBLEM.vehicles[1], capacity: 65 },
    ],
    customers: BASELINE_PROBLEM.customers.slice(0, 3).map((c) => ({
      ...c,
      demand: 40,
    })),
  };
  const result = solveVrpExactly(indivisible);
  check(
    'a fleet that is big enough but badly split is still infeasible',
    !result.feasible,
  );
  check(
    'that case is reported as a partition failure, not a deficit',
    result.violations[0]?.type === 'NO_FEASIBLE_PARTITION',
    result.violations[0]?.type,
  );

  // One order too big for any single vehicle, while the fleet total is ample.
  const oversize = solveVrpExactly(
    withDemands(withCapacities(BASELINE_PROBLEM, { v1: 100, v2: 100 }), {
      A: 110,
      B: 5,
      C: 5,
      D: 5,
      E: 5,
      F: 5,
    }),
  );
  check(
    'a customer larger than every vehicle is detected',
    !oversize.feasible &&
      oversize.violations[0]?.type === 'CUSTOMER_EXCEEDS_EVERY_VEHICLE',
    oversize.violations[0]?.type,
  );
}

group('Solver — safety bounds and error taxonomy');
{
  // Construct a problem with 20 customers and 2 vehicles (2^20 > MAX_ASSIGNMENTS)
  const hugeProblem: VRPProblem = {
    ...BASELINE_PROBLEM,
    customers: Array.from({ length: 20 }, (_, i) => ({
      id: `C${i + 1}`,
      label: `Customer ${i + 1}`,
      x: 10 + i,
      y: 10 + i,
      demand: 5,
    })),
  };

  try {
    solveVrpExactly(hugeProblem);
    check('huge assignment count should throw SolverError', false);
  } catch (err: unknown) {
    const isSolverError = err instanceof SolverError;
    check('solver limit throws SolverError', isSolverError);
    check(
      'solver limit error message describes assignment limit',
      isSolverError && err.message.includes('exceed the exact-search limit'),
    );
  }
}

group('Sudoku Micro-Demo logic');
{
  const res2 = validateSudokuCandidate(2);
  check('candidate 2 satisfies row, col, and box constraints', res2.isValid && res2.rowValid && res2.colValid && res2.boxValid);

  const res4 = validateSudokuCandidate(4);
  check('candidate 4 causes row/col/box conflicts', !res4.isValid && !res4.rowValid && !res4.colValid && !res4.boxValid);

  const res1 = validateSudokuCandidate(1);
  check('candidate 1 causes conflicts', !res1.isValid);
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

group('Validation');
{
  const result = validateSolution(BASELINE_PROBLEM, baselineSolution);
  check('a correct solution validates', result.valid);
  check('all checks pass', result.checks.every((c) => c.passed));
  check(
    'totals are computed from the problem',
    result.totalDemand === 125 && result.totalCapacity === 180,
    `${result.totalDemand} / ${result.totalCapacity}`,
  );

  const missing: VRPSolution = {
    ...baselineSolution,
    routes: baselineSolution.routes.map((r, i) =>
      i === 0 ? { ...r, customerIds: r.customerIds.slice(1) } : r,
    ),
  };
  const missingResult = validateSolution(BASELINE_PROBLEM, missing);
  check('an unserved customer is caught', !missingResult.valid);
  check(
    'the unserved customer is named',
    missingResult.violations.some((v) => v.type === 'CUSTOMER_UNSERVED'),
  );

  const duplicated: VRPSolution = {
    ...baselineSolution,
    routes: baselineSolution.routes.map((r, i) =>
      i === 1
        ? { ...r, customerIds: [...r.customerIds, baselineSolution.routes[0].customerIds[0]] }
        : r,
    ),
  };
  check(
    'a duplicated customer is caught',
    validateSolution(BASELINE_PROBLEM, duplicated).violations.some(
      (v) => v.type === 'CUSTOMER_SERVED_TWICE',
    ),
  );

  const wrongDistance: VRPSolution = { ...baselineSolution, totalDistance: 1 };
  check(
    'a wrong total distance is caught',
    validateSolution(BASELINE_PROBLEM, wrongDistance).violations.some(
      (v) => v.type === 'TOTAL_DISTANCE_MISMATCH',
    ),
  );

  const wrongLoad: VRPSolution = {
    ...baselineSolution,
    routes: baselineSolution.routes.map((r, i) =>
      i === 0 ? { ...r, load: r.load + 7 } : r,
    ),
  };
  check(
    'a wrong route load is caught',
    validateSolution(BASELINE_PROBLEM, wrongLoad).violations.some(
      (v) => v.type === 'ROUTE_LOAD_MISMATCH',
    ),
  );

  // The central move: judge an old plan by new rules.
  const tightened = withCapacities(BASELINE_PROBLEM, { v1: 60 });
  const retro = validateSolution(tightened, baselineSolution);
  check(
    'the baseline plan becomes invalid under a 60 kg V1',
    !retro.valid,
  );
  check(
    'the capacity breach is reported with real numbers',
    retro.violations.some(
      (v) => v.type === 'VEHICLE_CAPACITY_EXCEEDED' && v.inequality?.includes('60'),
    ),
    retro.violations.map((v) => v.inequality).join(' | '),
  );
}

/* -------------------------------------------------------------------------- */
/* Comparison                                                                  */
/* -------------------------------------------------------------------------- */

group('Comparison');
{
  const same = compareSolutions(baselineSolution, baselineSolution, BASELINE_PROBLEM);
  check('a solution compared with itself is identical', same.identical);
  check('no customers move', same.movedCustomers.length === 0);
  check('distance delta is zero', same.distanceDelta === 0);

  const tightenedProblem = scenario('tighten-capacity');
  const tightened = solveVrpExactly(tightenedProblem);
  const changed = compareSolutions(baselineSolution, tightened, tightenedProblem);

  check('a changed solution is not identical', !changed.identical);
  check('at least one customer moved', changed.movedCustomers.length > 0);
  check(
    'movement is detected, not assumed',
    changed.movedCustomers.every(
      (m) =>
        vehicleOf(baselineSolution, m.customerId) === m.fromVehicleId &&
        vehicleOf(tightened, m.customerId) === m.toVehicleId,
    ),
  );
  check('affected customers are listed', changed.affectedCustomerIds.length > 0);
  check('arcs were removed and added', changed.removedArcs.length > 0 && changed.addedArcs.length > 0);
  check(
    'distance delta matches the two totals',
    Math.abs(
      changed.distanceDelta -
        (tightened.totalDistance - baselineSolution.totalDistance),
    ) < 0.011,
  );

  const brokenProblem = scenario('break-it');
  const broken = solveVrpExactly(brokenProblem);
  const collapsed = compareSolutions(baselineSolution, broken, brokenProblem);
  check('a feasibility change is detected', collapsed.feasibilityChanged);
  check('no first solution means no previous', !compareSolutions(null, baselineSolution, BASELINE_PROBLEM).hasPrevious);

  const diffs = diffProblems(BASELINE_PROBLEM, tightenedProblem);
  check('the capacity edit is found by diffing', diffs.length === 1);
  check(
    'the diff records both values',
    diffs[0]?.previousValue === 100 && diffs[0]?.currentValue === 60,
  );
  check(
    'a demand edit is found by diffing',
    diffProblems(BASELINE_PROBLEM, scenario('raise-demand'))[0]?.kind ===
      'CUSTOMER_DEMAND',
  );
}

/* -------------------------------------------------------------------------- */
/* Explanation                                                                 */
/* -------------------------------------------------------------------------- */

group('Explanation');
{
  const baselineExplanation = buildExplanation({
    previousProblem: null,
    currentProblem: BASELINE_PROBLEM,
    previousSolution: null,
    currentSolution: baselineSolution,
    validation: validateSolution(BASELINE_PROBLEM, baselineSolution),
    retroValidation: null,
    comparison: compareSolutions(null, baselineSolution, BASELINE_PROBLEM),
    changes: [],
  });
  check('the opening state is explained', baselineExplanation.length > 0);
  check(
    'steps are numbered from one',
    baselineExplanation[0].index === 1 &&
      baselineExplanation[baselineExplanation.length - 1].index ===
        baselineExplanation.length,
  );

  const tightenedProblem = scenario('tighten-capacity');
  const tightened = solveVrpExactly(tightenedProblem);
  const capacityExplanation = buildExplanation({
    previousProblem: BASELINE_PROBLEM,
    currentProblem: tightenedProblem,
    previousSolution: baselineSolution,
    currentSolution: tightened,
    validation: validateSolution(tightenedProblem, tightened),
    retroValidation: validateSolution(tightenedProblem, baselineSolution),
    comparison: compareSolutions(baselineSolution, tightened, tightenedProblem),
    changes: diffProblems(BASELINE_PROBLEM, tightenedProblem),
  });
  const capacityText = JSON.stringify(capacityExplanation);
  check('a capacity reduction is described', capacityText.includes('100 kg') && capacityText.includes('60 kg'));
  check(
    'the violation step appears',
    capacityExplanation.some((s) => s.status === 'violation'),
  );
  check(
    'the reassignment step appears',
    capacityExplanation.some((s) => s.status === 'reassignment'),
  );
  check(
    'the objective step appears',
    capacityExplanation.some((s) => s.status === 'objective'),
  );
  check(
    'no customer id is hard-coded into the engine',
    !capacityExplanation.some(
      (s) => s.title.includes('Customer C') || s.title.includes('Node C'),
    ),
  );

  const demandProblem = scenario('raise-demand');
  const demandSolution = solveVrpExactly(demandProblem);
  const demandExplanation = buildExplanation({
    previousProblem: BASELINE_PROBLEM,
    currentProblem: demandProblem,
    previousSolution: baselineSolution,
    currentSolution: demandSolution,
    validation: validateSolution(demandProblem, demandSolution),
    retroValidation: validateSolution(demandProblem, baselineSolution),
    comparison: compareSolutions(baselineSolution, demandSolution, demandProblem),
    changes: diffProblems(BASELINE_PROBLEM, demandProblem),
  });
  check(
    'a demand increase is described',
    JSON.stringify(demandExplanation).includes('40 kg'),
  );

  const brokenProblem = scenario('break-it');
  const broken = solveVrpExactly(brokenProblem);
  const brokenExplanation = buildExplanation({
    previousProblem: BASELINE_PROBLEM,
    currentProblem: brokenProblem,
    previousSolution: baselineSolution,
    currentSolution: broken,
    validation: validateSolution(brokenProblem, broken),
    retroValidation: null,
    comparison: compareSolutions(baselineSolution, broken, brokenProblem),
    changes: diffProblems(BASELINE_PROBLEM, brokenProblem),
  });
  check(
    'infeasibility is explained, not just announced',
    brokenExplanation.some((s) => s.status === 'infeasible'),
  );
  check(
    'the explanation quotes the real totals',
    JSON.stringify(brokenExplanation).includes('125') &&
      JSON.stringify(brokenExplanation).includes('60'),
  );

  // Same solution twice: the engine must not invent a change.
  const noChange = buildExplanation({
    previousProblem: BASELINE_PROBLEM,
    currentProblem: BASELINE_PROBLEM,
    previousSolution: baselineSolution,
    currentSolution: baselineSolution,
    validation: validateSolution(BASELINE_PROBLEM, baselineSolution),
    retroValidation: validateSolution(BASELINE_PROBLEM, baselineSolution),
    comparison: compareSolutions(baselineSolution, baselineSolution, BASELINE_PROBLEM),
    changes: [],
  });
  check(
    'an unchanged state says nothing moved',
    noChange.some((s) => s.title.toLowerCase().includes('nothing had to move')),
  );
}

/* -------------------------------------------------------------------------- */
/* Prediction                                                                  */
/* -------------------------------------------------------------------------- */

group('Prediction');
{
  const unchanged = classifyOutcome(
    baselineSolution,
    compareSolutions(baselineSolution, baselineSolution, BASELINE_PROBLEM),
  );
  check('an unchanged result is classified', unchanged.outcome === 'UNCHANGED');

  const tightenedProblem = scenario('tighten-capacity');
  const tightened = solveVrpExactly(tightenedProblem);
  check(
    'a reassignment is classified',
    classifyOutcome(
      tightened,
      compareSolutions(baselineSolution, tightened, tightenedProblem),
    ).outcome === 'REASSIGNMENT',
  );

  const brokenProblem = scenario('break-it');
  const broken = solveVrpExactly(brokenProblem);
  check(
    'infeasibility is classified',
    classifyOutcome(
      broken,
      compareSolutions(baselineSolution, broken, brokenProblem),
    ).outcome === 'INFEASIBLE',
  );
}

/* -------------------------------------------------------------------------- */
/* State pipeline                                                              */
/* -------------------------------------------------------------------------- */

group('State — the full pipeline');
{
  const initial = createInitialState();
  check('the app opens on a solved instance', initial.currentSolution.feasible);
  check('there is no history at the start', initial.previousSolution === null);
  check('the draft starts equal to the committed problem', initial.draftProblem === initial.committedProblem);

  const edited = experimentReducer(initial, {
    type: 'SET_VEHICLE_CAPACITY',
    vehicleId: 'v1',
    capacity: 60,
  });
  check(
    'editing a slider does not resolve immediately',
    edited.currentSolution === initial.currentSolution,
  );
  check(
    'the edit lands in the draft',
    edited.draftProblem.vehicles.find((v) => v.id === 'v1')?.capacity === 60,
  );
  check(
    'the committed problem is untouched',
    edited.committedProblem.vehicles.find((v) => v.id === 'v1')?.capacity === 100,
  );
  check('pending changes are surfaced', deriveExperiment(edited).hasPendingChanges);

  const recalculated = experimentReducer(edited, { type: 'RECALCULATE' });
  check('recalculating commits the draft', recalculated.committedProblem === edited.draftProblem);
  check('the old solution is kept as history', recalculated.previousSolution === initial.currentSolution);
  check('a new solution was computed', recalculated.currentSolution !== initial.currentSolution);

  const derived = deriveExperiment(recalculated);
  check('status is computed, not stored', derived.status === 'FEASIBLE');
  check('the old plan is re-judged as invalid', derived.retroValidation?.valid === false);
  check('the comparison found movement', derived.comparison.movedCustomers.length > 0);
  check('no pending changes remain', !derived.hasPendingChanges);

  // Clamping
  const clamped = experimentReducer(initial, {
    type: 'SET_VEHICLE_CAPACITY',
    vehicleId: 'v1',
    capacity: -50,
  });
  check(
    'a negative capacity is clamped, not accepted',
    (clamped.draftProblem.vehicles.find((v) => v.id === 'v1')?.capacity ?? 0) >= 20,
  );
  const clampedDemand = experimentReducer(initial, {
    type: 'SET_CUSTOMER_DEMAND',
    customerId: 'A',
    demand: -10,
  });
  check(
    'a negative demand is clamped, not accepted',
    (clampedDemand.draftProblem.customers.find((c) => c.id === 'A')?.demand ?? 0) >= 5,
  );

  // Prediction flow
  const predicted = dispatchAll(initial, [
    { type: 'SUBMIT_PREDICTION', choice: 'REASSIGNMENT' },
    { type: 'APPLY_SCENARIO', scenarioId: 'tighten-capacity' },
    { type: 'RECALCULATE' },
  ]);
  check('the prediction is scored after recalculating', predicted.prediction.outcome !== null);
  check('a correct prediction is marked correct', predicted.prediction.correct === true);
  check('the outcome carries computed detail', (predicted.prediction.outcomeDetail ?? '').length > 0);

  const mispredicted = dispatchAll(initial, [
    { type: 'SUBMIT_PREDICTION', choice: 'INFEASIBLE' },
    { type: 'APPLY_SCENARIO', scenarioId: 'tighten-capacity' },
    { type: 'RECALCULATE' },
  ]);
  check('a wrong prediction is marked wrong', mispredicted.prediction.correct === false);

  // Breaking it
  const brokenState = dispatchAll(initial, [
    { type: 'APPLY_SCENARIO', scenarioId: 'break-it' },
    { type: 'RECALCULATE' },
  ]);
  check('the break scenario reaches infeasibility', !brokenState.currentSolution.feasible);
  check(
    'status reflects it',
    deriveExperiment(brokenState).status === 'NO_FEASIBLE_SOLUTION',
  );
}

group('State — reset');
{
  const initial = createInitialState();
  const messy = dispatchAll(initial, [
    { type: 'SET_VIEW', view: 'explanation' },
    { type: 'SUBMIT_PREDICTION', choice: 'UNCHANGED' },
    { type: 'APPLY_SCENARIO', scenarioId: 'break-it' },
    { type: 'RECALCULATE' },
    { type: 'SET_CUSTOMER_DEMAND', customerId: 'C', demand: 65 },
    { type: 'SELECT_CUSTOMER', customerId: 'C' },
  ]);
  const reset = experimentReducer(messy, { type: 'RESET' });

  check(
    'capacities return to baseline',
    JSON.stringify(reset.committedProblem.vehicles.map((v) => v.capacity)) ===
      JSON.stringify(initial.committedProblem.vehicles.map((v) => v.capacity)),
  );
  check(
    'demands return to baseline',
    JSON.stringify(reset.committedProblem.customers.map((c) => c.demand)) ===
      JSON.stringify(initial.committedProblem.customers.map((c) => c.demand)),
  );
  check('the draft is cleared', reset.draftProblem === reset.committedProblem);
  check('history is cleared', reset.previousSolution === null && reset.previousProblem === null);
  check('the prediction is cleared', reset.prediction.choice === null);
  check('feasibility is restored', reset.currentSolution.feasible);
  check(
    'the initial solution is reproduced exactly',
    reset.currentSolution.totalDistance === initial.currentSolution.totalDistance,
  );
  check('the selection is cleared', reset.selectedCustomerId === null);
  check('the learner is left where they were', reset.activeView === 'explanation');
}

group('Scenarios');
{
  for (const s of SCENARIOS) {
    const problem = applyScenario(BASELINE_PROBLEM, s);
    const solution = solveVrpExactly(problem);
    check(
      `scenario "${s.label}" solves without throwing`,
      solution !== null,
    );
  }
}

/* -------------------------------------------------------------------------- */

console.log(`\n${'='.repeat(60)}`);
console.log(`${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\nFailures:');
  for (const failure of failures) console.log(`  - ${failure}`);
}
console.log('='.repeat(60));

if (typeof process !== 'undefined' && failed > 0) {
  process.exitCode = 1;
}
