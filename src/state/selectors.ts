import type {
  ConstraintChange,
  ExplanationStep,
  SolutionComparison,
  ValidationResult,
  VRPProblem,
} from '../domain/models/types';
import { compareSolutions, diffProblems } from '../domain/comparison/compareSolutions';
import { buildExplanation } from '../domain/explanation/buildExplanation';
import { validateSolution } from '../domain/validation/validateSolution';
import { matchScenario } from '../data/demoProblem';
import type { ExperimentState } from './experimentReducer';

export type FeasibilityStatus = 'FEASIBLE' | 'INVALID' | 'NO_FEASIBLE_SOLUTION';

export interface DerivedExperiment {
  /** Validation of the current solution against the committed problem. */
  readonly validation: ValidationResult;
  /**
   * The previous solution re-checked against the *committed* problem — the step
   * that shows a formerly legal plan becoming illegal.
   */
  readonly retroValidation: ValidationResult | null;
  /** The previous solution re-checked against the *draft*, before recalculating. */
  readonly draftRetroValidation: ValidationResult | null;
  readonly comparison: SolutionComparison;
  readonly explanation: readonly ExplanationStep[];
  /** Constraint edits between the committed problem and the one before it. */
  readonly appliedChanges: readonly ConstraintChange[];
  /** Uncommitted edits: draft versus committed. */
  readonly pendingChanges: readonly ConstraintChange[];
  readonly hasPendingChanges: boolean;
  readonly status: FeasibilityStatus;
  readonly activeScenarioId: string | null;
  readonly draftScenarioId: string | null;
  /** Draft totals, so the panel can warn before the learner recalculates. */
  readonly draftTotalDemand: number;
  readonly draftTotalCapacity: number;
}

function totals(problem: VRPProblem): { demand: number; capacity: number } {
  return {
    demand: problem.customers.reduce((sum, c) => sum + c.demand, 0),
    capacity: problem.vehicles.reduce((sum, v) => sum + v.capacity, 0),
  };
}

export function deriveExperiment(state: ExperimentState): DerivedExperiment {
  const {
    committedProblem,
    draftProblem,
    previousProblem,
    previousSolution,
    currentSolution,
  } = state;

  const validation = validateSolution(committedProblem, currentSolution);

  // Re-judging the old plan under new rules is the heart of the lesson, so it is
  // computed rather than asserted. Only meaningful if that plan had routes.
  const retroValidation =
    previousSolution && previousSolution.feasible
      ? validateSolution(committedProblem, previousSolution)
      : null;

  const draftRetroValidation =
    currentSolution.feasible && draftProblem !== committedProblem
      ? validateSolution(draftProblem, currentSolution)
      : null;

  const comparison = compareSolutions(
    previousSolution,
    currentSolution,
    committedProblem,
  );

  const appliedChanges = diffProblems(previousProblem, committedProblem);
  const pendingChanges = diffProblems(committedProblem, draftProblem);

  const explanation = buildExplanation({
    previousProblem,
    currentProblem: committedProblem,
    previousSolution,
    currentSolution,
    validation,
    retroValidation,
    comparison,
    changes: appliedChanges,
  });

  const status: FeasibilityStatus = !currentSolution.feasible
    ? 'NO_FEASIBLE_SOLUTION'
    : validation.valid
      ? 'FEASIBLE'
      : 'INVALID';

  const draftTotals = totals(draftProblem);

  return {
    validation,
    retroValidation,
    draftRetroValidation,
    comparison,
    explanation,
    appliedChanges,
    pendingChanges,
    hasPendingChanges: pendingChanges.length > 0,
    status,
    activeScenarioId: matchScenario(committedProblem),
    draftScenarioId: matchScenario(draftProblem),
    draftTotalDemand: draftTotals.demand,
    draftTotalCapacity: draftTotals.capacity,
  };
}

export const STATUS_LABEL: Record<FeasibilityStatus, string> = {
  FEASIBLE: 'Feasible',
  INVALID: 'Invalid',
  NO_FEASIBLE_SOLUTION: 'No feasible solution',
};
