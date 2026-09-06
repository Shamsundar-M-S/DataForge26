import type {
  PredictionChoice,
  PredictionState,
  VRPProblem,
  VRPSolution,
} from '../domain/models/types';
import { SolverError } from '../domain/models/types';
import { solveVrp } from '../domain/solver';
import { compareSolutions } from '../domain/comparison/compareSolutions';
import { classifyOutcome } from '../domain/prediction/evaluatePrediction';
import {
  BASELINE_PROBLEM,
  CAPACITY_BOUNDS,
  DEMAND_BOUNDS,
  SCENARIOS,
  applyScenario,
} from '../data/demoProblem';

export type ViewId =
  | 'overview'
  | 'workstation'
  | 'before-after'
  | 'explanation'
  | 'breaking-point'
  | 'research'
  | 'learning-check';

export interface ExperimentState {
  /** Never mutated. Reset restores exactly this. */
  readonly baselineProblem: VRPProblem;
  /** The instance the current solution was computed from. */
  readonly committedProblem: VRPProblem;
  /** The instance the learner is editing. Equals committedProblem until they touch a control. */
  readonly draftProblem: VRPProblem;
  /** The instance the previous solution was computed from. */
  readonly previousProblem: VRPProblem | null;
  readonly previousSolution: VRPSolution | null;
  readonly currentSolution: VRPSolution;
  readonly prediction: PredictionState;
  readonly selectedCustomerId: string | null;
  readonly activeView: ViewId;
  /** Set when a solve fails outright. Surfaced as prose, never as a stack trace. */
  readonly error: string | null;
}

export type ExperimentAction =
  | { type: 'SET_VEHICLE_CAPACITY'; vehicleId: string; capacity: number }
  | { type: 'SET_CUSTOMER_DEMAND'; customerId: string; demand: number }
  | { type: 'APPLY_SCENARIO'; scenarioId: string }
  | { type: 'RECALCULATE' }
  | { type: 'DISCARD_DRAFT' }
  | { type: 'SUBMIT_PREDICTION'; choice: PredictionChoice }
  | { type: 'CLEAR_PREDICTION' }
  | { type: 'RESET' }
  | { type: 'SELECT_CUSTOMER'; customerId: string | null }
  | { type: 'SET_VIEW'; view: ViewId };

const EMPTY_PREDICTION: PredictionState = {
  choice: null,
  outcome: null,
  correct: null,
  outcomeDetail: null,
};

function clamp(value: number, min: number, max: number, step: number): number {
  if (!Number.isFinite(value)) return min;
  const snapped = Math.round(value / step) * step;
  return Math.min(max, Math.max(min, snapped));
}

function safeSolve(problem: VRPProblem): { solution: VRPSolution; error: string | null } {
  try {
    return { solution: solveVrp(problem), error: null };
  } catch (cause) {
    const message =
      cause instanceof SolverError
        ? cause.message
        : 'The solver could not run on this configuration.';
    return {
      solution: {
        feasible: false,
        routes: [],
        totalDistance: 0,
        violations: [
          {
            type: 'SOLVER_LIMIT_EXCEEDED',
            message,
          },
        ],
        stats: {
          algorithm: 'not run',
          assignmentsEnumerated: 0,
          assignmentsFeasible: 0,
          toursEvaluated: 0,
          elapsedMs: 0,
        },
      },
      error: message,
    };
  }
}

export function createInitialState(): ExperimentState {
  const { solution, error } = safeSolve(BASELINE_PROBLEM);
  return {
    baselineProblem: BASELINE_PROBLEM,
    committedProblem: BASELINE_PROBLEM,
    draftProblem: BASELINE_PROBLEM,
    previousProblem: null,
    previousSolution: null,
    currentSolution: solution,
    prediction: EMPTY_PREDICTION,
    selectedCustomerId: null,
    activeView: 'overview',
    error,
  };
}

export function experimentReducer(
  state: ExperimentState,
  action: ExperimentAction,
): ExperimentState {
  switch (action.type) {
    case 'SET_VEHICLE_CAPACITY': {
      const capacity = clamp(
        action.capacity,
        CAPACITY_BOUNDS.min,
        CAPACITY_BOUNDS.max,
        CAPACITY_BOUNDS.step,
      );
      return {
        ...state,
        draftProblem: {
          ...state.draftProblem,
          vehicles: state.draftProblem.vehicles.map((vehicle) =>
            vehicle.id === action.vehicleId ? { ...vehicle, capacity } : vehicle,
          ),
        },
      };
    }

    case 'SET_CUSTOMER_DEMAND': {
      const demand = clamp(
        action.demand,
        DEMAND_BOUNDS.min,
        DEMAND_BOUNDS.max,
        DEMAND_BOUNDS.step,
      );
      return {
        ...state,
        draftProblem: {
          ...state.draftProblem,
          customers: state.draftProblem.customers.map((customer) =>
            customer.id === action.customerId ? { ...customer, demand } : customer,
          ),
        },
      };
    }

    case 'APPLY_SCENARIO': {
      const scenario = SCENARIOS.find((s) => s.id === action.scenarioId);
      if (!scenario) return state;
      return {
        ...state,
        draftProblem: applyScenario(state.baselineProblem, scenario),
      };
    }

    case 'DISCARD_DRAFT':
      return { ...state, draftProblem: state.committedProblem };

    case 'RECALCULATE': {
      const nextProblem = state.draftProblem;
      const { solution, error } = safeSolve(nextProblem);

      // Score any prediction the learner made before this run.
      let prediction = state.prediction;
      if (prediction.choice !== null && prediction.outcome === null) {
        const comparison = compareSolutions(
          state.currentSolution,
          solution,
          nextProblem,
        );
        const { outcome, detail } = classifyOutcome(solution, comparison);
        prediction = {
          choice: prediction.choice,
          outcome,
          correct: prediction.choice === outcome,
          outcomeDetail: detail,
        };
      }

      return {
        ...state,
        previousProblem: state.committedProblem,
        previousSolution: state.currentSolution,
        committedProblem: nextProblem,
        currentSolution: solution,
        prediction,
        error,
      };
    }

    case 'SUBMIT_PREDICTION':
      return {
        ...state,
        prediction: {
          choice: action.choice,
          outcome: null,
          correct: null,
          outcomeDetail: null,
        },
      };

    case 'CLEAR_PREDICTION':
      return { ...state, prediction: EMPTY_PREDICTION };

    case 'RESET': {
      const fresh = createInitialState();
      // Keep the learner where they are; reset the experiment, not the navigation.
      return { ...fresh, activeView: state.activeView };
    }

    case 'SELECT_CUSTOMER':
      return { ...state, selectedCustomerId: action.customerId };

    case 'SET_VIEW':
      return { ...state, activeView: action.view };

    default:
      return state;
  }
}
