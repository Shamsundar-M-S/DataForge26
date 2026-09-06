/**
 * ConstraintRoute domain model.
 *
 * These types describe the Capacitated Vehicle Routing Problem (CVRP) instance,
 * its solutions, and the analysis artefacts derived from them. Nothing in this
 * file (or anywhere under src/domain) may import React, touch the DOM, or know
 * about rendering.
 */

export interface Depot {
  readonly id: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
}

export interface Customer {
  readonly id: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly demand: number;
}

export interface Vehicle {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly capacity: number;
  /** Presentation hint kept on the domain object so every view agrees on it. */
  readonly color: string;
}

export interface VRPProblem {
  readonly id: string;
  readonly label: string;
  readonly depot: Depot;
  readonly vehicles: readonly Vehicle[];
  readonly customers: readonly Customer[];
}

/** One vehicle's tour. The depot is implicit at both ends of `customerIds`. */
export interface Route {
  readonly vehicleId: string;
  readonly customerIds: readonly string[];
  readonly load: number;
  readonly distance: number;
}

export type ViolationType =
  | 'FLEET_CAPACITY_DEFICIT'
  | 'CUSTOMER_EXCEEDS_EVERY_VEHICLE'
  | 'NO_FEASIBLE_PARTITION'
  | 'SOLVER_LIMIT_EXCEEDED'
  | 'VEHICLE_CAPACITY_EXCEEDED'
  | 'CUSTOMER_UNSERVED'
  | 'CUSTOMER_SERVED_TWICE'
  | 'UNKNOWN_CUSTOMER'
  | 'UNKNOWN_VEHICLE'
  | 'ROUTE_LOAD_MISMATCH'
  | 'ROUTE_DISTANCE_MISMATCH'
  | 'TOTAL_DISTANCE_MISMATCH';

export interface ConstraintViolation {
  readonly type: ViolationType;
  readonly vehicleId?: string;
  readonly customerId?: string;
  /** Plain-language description, safe to show a learner. */
  readonly message: string;
  /** The failing inequality with the actual numbers substituted in, if one exists. */
  readonly inequality?: string;
}

export interface SolverStats {
  readonly algorithm: string;
  /** Number of vehicle-assignment candidates enumerated (k^n). */
  readonly assignmentsEnumerated: number;
  /** How many of those satisfied every capacity bound. */
  readonly assignmentsFeasible: number;
  /** Distinct customer subsets whose optimal tour was computed. */
  readonly toursEvaluated: number;
  readonly elapsedMs: number;
}

export interface VRPSolution {
  readonly feasible: boolean;
  readonly routes: readonly Route[];
  readonly totalDistance: number;
  readonly violations: readonly ConstraintViolation[];
  readonly stats: SolverStats;
}

export interface VehicleLoadInfo {
  readonly vehicleId: string;
  readonly vehicleName: string;
  readonly load: number;
  readonly capacity: number;
  /** capacity - load. Negative means the capacity bound is broken. */
  readonly slack: number;
  readonly overloaded: boolean;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly checks: readonly ValidationCheck[];
  readonly violations: readonly ConstraintViolation[];
  readonly loads: readonly VehicleLoadInfo[];
  readonly totalDemand: number;
  readonly totalCapacity: number;
  /** totalCapacity - totalDemand. Negative means the instance is unsatisfiable. */
  readonly fleetSlack: number;
  readonly recomputedTotalDistance: number;
}

/** One independently verified property of a solution, shown as evidence. */
export interface ValidationCheck {
  readonly id: string;
  readonly label: string;
  readonly passed: boolean;
  readonly detail: string;
}

export interface CustomerMovement {
  readonly customerId: string;
  readonly customerLabel: string;
  readonly demand: number;
  readonly fromVehicleId: string | null;
  readonly toVehicleId: string | null;
}

export interface RouteChange {
  readonly vehicleId: string;
  readonly vehicleName: string;
  readonly previousCustomerIds: readonly string[];
  readonly currentCustomerIds: readonly string[];
  readonly previousLoad: number;
  readonly currentLoad: number;
  readonly loadDelta: number;
  readonly previousDistance: number;
  readonly currentDistance: number;
  readonly sequenceChanged: boolean;
}

export type Arc = readonly [string, string];

export interface SolutionComparison {
  readonly hasPrevious: boolean;
  readonly identical: boolean;
  readonly previousFeasible: boolean;
  readonly currentFeasible: boolean;
  readonly feasibilityChanged: boolean;
  readonly previousDistance: number;
  readonly currentDistance: number;
  readonly distanceDelta: number;
  readonly movedCustomers: readonly CustomerMovement[];
  /** Customers whose vehicle OR position within a tour changed. */
  readonly affectedCustomerIds: readonly string[];
  readonly routeChanges: readonly RouteChange[];
  readonly removedArcs: readonly Arc[];
  readonly addedArcs: readonly Arc[];
}

/* -------------------------------------------------------------------------- */
/* Constraint changes                                                          */
/* -------------------------------------------------------------------------- */

export type ConstraintKind = 'VEHICLE_CAPACITY' | 'CUSTOMER_DEMAND';

export interface ConstraintChange {
  readonly kind: ConstraintKind;
  /** Vehicle id or customer id. */
  readonly targetId: string;
  readonly targetLabel: string;
  readonly previousValue: number;
  readonly currentValue: number;
  readonly delta: number;
}

/* -------------------------------------------------------------------------- */
/* Explanation                                                                 */
/* -------------------------------------------------------------------------- */

export type ExplanationStatus =
  | 'baseline'
  | 'change'
  | 'violation'
  | 'reassignment'
  | 'objective'
  | 'infeasible';

export interface ExplanationStep {
  readonly index: number;
  readonly title: string;
  readonly status: ExplanationStatus;
  /** One sentence saying what happened. */
  readonly statement: string;
  /** The numbers this statement rests on, taken from computed state. */
  readonly evidence: readonly string[];
  /** The relevant inequality with actual values, when one applies. */
  readonly inequality?: string;
}

/* -------------------------------------------------------------------------- */
/* Prediction                                                                  */
/* -------------------------------------------------------------------------- */

export type PredictionChoice =
  | 'UNCHANGED'
  | 'REASSIGNMENT'
  | 'INFEASIBLE';

export interface PredictionState {
  /** What the learner picked, before recalculating. */
  readonly choice: PredictionChoice | null;
  /** What actually happened, filled in after the solver ran. */
  readonly outcome: PredictionChoice | null;
  readonly correct: boolean | null;
  /** Data-derived sentence describing the actual outcome. */
  readonly outcomeDetail: string | null;
}

/* -------------------------------------------------------------------------- */
/* Errors                                                                      */
/* -------------------------------------------------------------------------- */

export class SolverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SolverError';
  }
}
