import type {
  PredictionChoice,
  SolutionComparison,
  VRPSolution,
} from '../models/types';

export interface PredictionOption {
  readonly id: PredictionChoice;
  readonly label: string;
  readonly description: string;
}

export const PREDICTION_OPTIONS: readonly PredictionOption[] = [
  {
    id: 'UNCHANGED',
    label: 'The plan stays exactly as it is',
    description:
      'Every customer keeps the same vehicle and every tour keeps the same order.',
  },
  {
    id: 'REASSIGNMENT',
    label: 'The plan changes but still works',
    description:
      'At least one customer moves to a different vehicle, or a tour is re-ordered, and a legal plan is still found.',
  },
  {
    id: 'INFEASIBLE',
    label: 'No legal plan exists any more',
    description:
      'The constraints can no longer all be satisfied at once, whatever the assignment.',
  },
];

/**
 * Classifies what actually happened, so a learner's prediction can be scored
 * against the computed result rather than against a stored expectation.
 */
export function classifyOutcome(
  solution: VRPSolution,
  comparison: SolutionComparison,
): { outcome: PredictionChoice; detail: string } {
  if (!solution.feasible) {
    return {
      outcome: 'INFEASIBLE',
      detail:
        solution.violations[0]?.message ??
        'The solver found no assignment satisfying every constraint.',
    };
  }

  if (comparison.identical) {
    return {
      outcome: 'UNCHANGED',
      detail:
        `The same assignment is still optimal. Total distance is unchanged at ` +
        `${solution.totalDistance} units.`,
    };
  }

  const moved = comparison.movedCustomers;
  const resequenced = comparison.routeChanges.filter((c) => c.sequenceChanged);

  const parts: string[] = [];
  if (moved.length > 0) {
    parts.push(
      `${moved.length === 1 ? 'One customer' : `${moved.length} customers`} changed vehicle ` +
        `(${moved.map((m) => m.customerId).join(', ')})`,
    );
  }
  if (resequenced.length > 0) {
    parts.push(`${resequenced.length} tour${resequenced.length === 1 ? '' : 's'} were re-ordered`);
  }
  if (comparison.distanceDelta !== 0) {
    parts.push(
      `total distance moved by ${comparison.distanceDelta > 0 ? '+' : ''}${comparison.distanceDelta} units`,
    );
  }

  return {
    outcome: 'REASSIGNMENT',
    detail:
      parts.length > 0
        ? `${parts.join(', ')}.`
        : 'A different assignment is now optimal.',
  };
}
