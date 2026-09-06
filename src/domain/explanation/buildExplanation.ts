import type {
  ConstraintChange,
  ExplanationStep,
  SolutionComparison,
  ValidationResult,
  VRPProblem,
  VRPSolution,
} from '../models/types';

export interface ExplanationInput {
  readonly previousProblem: VRPProblem | null;
  readonly currentProblem: VRPProblem;
  readonly previousSolution: VRPSolution | null;
  readonly currentSolution: VRPSolution;
  /** Validation of the current solution against the current problem. */
  readonly validation: ValidationResult;
  /**
   * The previous solution re-checked against the *current* constraints.
   * Null when there is no previous solution to re-check.
   */
  readonly retroValidation: ValidationResult | null;
  readonly comparison: SolutionComparison;
  readonly changes: readonly ConstraintChange[];
}

/**
 * Turns computed state into an ordered chain of statements.
 *
 * Every sentence below is assembled from values that were measured elsewhere:
 * the solver's routes, the validator's arithmetic, the comparison layer's diff.
 * Nothing is written in advance about which customer moves, which vehicle is
 * tightened, or by how much. There is no language model involved.
 */
export function buildExplanation(input: ExplanationInput): ExplanationStep[] {
  const steps = input.currentSolution.feasible
    ? buildFeasibleExplanation(input)
    : buildInfeasibleExplanation(input);

  return steps.map((step, index) => ({ ...step, index: index + 1 }));
}

type DraftStep = Omit<ExplanationStep, 'index'>;

/* -------------------------------------------------------------------------- */

function describeChange(change: ConstraintChange): string {
  const unit = 'kg';
  const direction = change.delta < 0 ? 'reduced' : 'increased';
  const noun =
    change.kind === 'VEHICLE_CAPACITY' ? 'capacity' : 'demand';
  return (
    `${change.targetLabel} ${noun} ${direction} from ${change.previousValue} ` +
    `${unit} to ${change.currentValue} ${unit} (${change.delta > 0 ? '+' : ''}${change.delta} ${unit}).`
  );
}

function changeStep(changes: readonly ConstraintChange[]): DraftStep {
  return {
    title: changes.length === 1 ? 'A constraint changed' : 'Constraints changed',
    status: 'change',
    statement: changes.map(describeChange).join(' '),
    evidence: changes.map(
      (c) =>
        `${c.targetLabel}: ${c.previousValue} kg \u2192 ${c.currentValue} kg`,
    ),
  };
}

function tourText(customerIds: readonly string[]): string {
  return customerIds.length === 0
    ? 'stays at the depot'
    : `Depot \u2192 ${customerIds.join(' \u2192 ')} \u2192 Depot`;
}

/* -------------------------------------------------------------------------- */
/* Infeasible                                                                  */
/* -------------------------------------------------------------------------- */

function buildInfeasibleExplanation(input: ExplanationInput): DraftStep[] {
  const { currentSolution, validation, changes, previousSolution } = input;
  const steps: DraftStep[] = [];

  if (changes.length > 0) {
    steps.push(changeStep(changes));
  }

  if (previousSolution?.feasible) {
    steps.push({
      title: 'The previous plan is no longer available',
      status: 'violation',
      statement:
        'The assignment that was in use before cannot be repaired by moving customers around, ' +
        'because no assignment at all satisfies the new constraints.',
      evidence: previousSolution.routes.map(
        (r) => `${r.vehicleId}: ${tourText(r.customerIds)} carrying ${r.load} kg`,
      ),
    });
  }

  for (const violation of currentSolution.violations) {
    if (violation.type === 'SOLVER_LIMIT_EXCEEDED') {
      steps.push({
        title: 'Exact-search limit reached',
        status: 'infeasible',
        statement: violation.message,
        evidence: [
          'Safety limit reached for browser-side exact enumeration.',
          'This is a solver computational bound, not proof of mathematical infeasibility.',
        ],
      });
    } else {
      steps.push({
        title: 'Why no plan exists',
        status: 'infeasible',
        statement: violation.message,
        evidence: [
          `Total demand: ${validation.totalDemand} kg`,
          `Total fleet capacity: ${validation.totalCapacity} kg`,
          `Fleet slack: ${validation.fleetSlack} kg`,
        ],
        inequality: violation.inequality,
      });
    }
  }

  const deficit = -validation.fleetSlack;
  steps.push({
    title: 'What would restore feasibility',
    status: 'infeasible',
    statement:
      deficit > 0
        ? `Either the fleet needs at least ${deficit} kg more capacity, or total demand ` +
          `must fall by at least ${deficit} kg. Nothing less can work, because the shortfall ` +
          'is in the totals themselves.'
        : 'The totals fit, so the fix is finer-grained: capacity has to be distributed so that ' +
          'some split of these particular demands fits inside the individual vehicle limits.',
    evidence:
      deficit > 0
        ? [`Shortfall: ${validation.totalDemand} kg \u2212 ${validation.totalCapacity} kg = ${deficit} kg`]
        : [
            `Totals are satisfiable: ${validation.totalDemand} kg \u2264 ${validation.totalCapacity} kg`,
            'The obstruction is how the demands divide, not how much capacity exists.',
          ],
  });

  return steps;
}

/* -------------------------------------------------------------------------- */
/* Feasible                                                                    */
/* -------------------------------------------------------------------------- */

function buildFeasibleExplanation(input: ExplanationInput): DraftStep[] {
  const {
    currentProblem,
    currentSolution,
    validation,
    retroValidation,
    comparison,
    changes,
    previousSolution,
  } = input;

  // --- No history yet: describe the starting point --------------------------
  if (!comparison.hasPrevious || !previousSolution) {
    return [
      {
        title: 'The starting instance',
        status: 'baseline',
        statement:
          `${currentProblem.customers.length} customers must each be visited exactly once by ` +
          `one of ${currentProblem.vehicles.length} vehicles, and every tour begins and ends at the depot.`,
        evidence: [
          `Total demand: ${validation.totalDemand} kg`,
          `Total capacity: ${validation.totalCapacity} kg`,
          `Fleet slack: ${validation.fleetSlack} kg`,
        ],
      },
      {
        title: 'The shortest legal assignment',
        status: 'baseline',
        statement:
          'Of every assignment that respects the capacity limits, this one travels the least distance.',
        evidence: currentSolution.routes.map((route) => {
          const vehicle = currentProblem.vehicles.find((v) => v.id === route.vehicleId);
          return `${vehicle?.name ?? route.vehicleId}: ${tourText(route.customerIds)} — ${route.load} kg, ${route.distance} units`;
        }),
      },
      {
        title: 'Checked independently',
        status: 'baseline',
        statement:
          'Loads and distances were re-derived from the customer data rather than taken from the solver.',
        evidence: validation.checks.map(
          (check) => `${check.passed ? 'Pass' : 'Fail'} — ${check.label}. ${check.detail}`,
        ),
      },
      {
        title: 'The number to watch',
        status: 'objective',
        statement:
          `Total travel distance is ${currentSolution.totalDistance} units. Changing a constraint ` +
          'will move this number, and the amount it moves is the cost of that constraint.',
        evidence: [
          `Assignments enumerated: ${currentSolution.stats.assignmentsEnumerated}`,
          `Of those, within capacity: ${currentSolution.stats.assignmentsFeasible}`,
        ],
      },
    ];
  }

  const steps: DraftStep[] = [];

  if (changes.length > 0) {
    steps.push(changeStep(changes));
  }

  // --- Was the previous plan still legal? -----------------------------------

  const brokenRules = retroValidation?.violations ?? [];
  const previousStillLegal = brokenRules.length === 0;

  if (retroValidation) {
    if (previousStillLegal) {
      steps.push({
        title: 'The previous plan is still legal',
        status: 'change',
        statement:
          'Re-checking the earlier assignment against the new constraints finds no broken rule. ' +
          'Whatever changes below are about cost, not legality.',
        evidence: retroValidation.loads.map(
          (l) => `${l.vehicleName}: ${l.load}/${l.capacity} kg, ${l.slack} kg spare`,
        ),
      });
    } else {
      const capacityBreaks = brokenRules.filter(
        (v) => v.type === 'VEHICLE_CAPACITY_EXCEEDED',
      );
      const primary = capacityBreaks[0] ?? brokenRules[0];
      steps.push({
        title: 'The previous plan is now illegal',
        status: 'violation',
        statement:
          'The earlier assignment was not re-solved — it was re-checked against the new numbers, ' +
          `and it breaks a rule. ${primary.message}`,
        evidence: retroValidation.loads.map(
          (l) =>
            `${l.vehicleName}: ${l.load}/${l.capacity} kg` +
            (l.overloaded ? ` — over by ${-l.slack} kg` : ` — ${l.slack} kg spare`),
        ),
        inequality: primary.inequality,
      });
    }
  }

  // --- What the solver did about it -----------------------------------------

  if (comparison.identical) {
    steps.push({
      title: 'Nothing had to move',
      status: 'reassignment',
      statement:
        'The same assignment is still the cheapest legal one, so every customer stays with the ' +
        'vehicle it had and every tour keeps its order.',
      evidence: [
        `Customers reassigned: 0`,
        `Distance unchanged at ${currentSolution.totalDistance} units`,
      ],
    });
    return steps;
  }

  if (comparison.movedCustomers.length > 0) {
    const vehicleName = (id: string | null): string =>
      currentProblem.vehicles.find((v) => v.id === id)?.shortName ?? 'unassigned';

    steps.push({
      title:
        comparison.movedCustomers.length === 1
          ? 'One customer changed vehicle'
          : `${comparison.movedCustomers.length} customers changed vehicle`,
      status: 'reassignment',
      statement:
        'To get back inside the limits at the lowest distance, the solver moved these customers. ' +
        'Which ones moved was decided by the search, not chosen in advance.',
      evidence: comparison.movedCustomers.map(
        (m) =>
          `${m.customerLabel} (${m.demand} kg): ${vehicleName(m.fromVehicleId)} \u2192 ${vehicleName(m.toVehicleId)}`,
      ),
    });
  }

  // --- Knock-on effects on vehicles that were never touched -----------------

  const touchedVehicleIds = new Set(
    changes.filter((c) => c.kind === 'VEHICLE_CAPACITY').map((c) => c.targetId),
  );
  const untouchedButChanged = comparison.routeChanges.filter(
    (change) => change.sequenceChanged && !touchedVehicleIds.has(change.vehicleId),
  );

  if (untouchedButChanged.length > 0) {
    steps.push({
      title: 'Vehicles nobody edited had to change too',
      status: 'reassignment',
      statement:
        'A limit was changed in one place, but the plan had to be rebuilt in others: these ' +
        'vehicles kept their own constraints untouched and still ended up with different work.',
      evidence: untouchedButChanged.map(
        (change) =>
          `${change.vehicleName}: ${tourText(change.previousCustomerIds)} \u2192 ${tourText(change.currentCustomerIds)} ` +
          `(${change.previousLoad} kg \u2192 ${change.currentLoad} kg)`,
      ),
    });
  }

  // --- Objective ------------------------------------------------------------

  const delta = comparison.distanceDelta;
  const direction =
    delta > 0 ? 'rose' : delta < 0 ? 'fell' : 'stayed the same';

  steps.push({
    title: 'What it cost',
    status: 'objective',
    statement:
      delta === 0
        ? `Total distance ${direction} at ${comparison.currentDistance} units, even though the ` +
          'assignment itself is different.'
        : `Total distance ${direction} from ${comparison.previousDistance} to ` +
          `${comparison.currentDistance} units, a change of ${delta > 0 ? '+' : ''}${delta}. ` +
          'This is the price of satisfying the new constraint.',
    evidence: comparison.routeChanges.map(
      (change) =>
        `${change.vehicleName}: ${change.previousDistance} \u2192 ${change.currentDistance} units`,
    ),
  });

  return steps;
}
