import type { Customer, Depot, Vehicle, VRPProblem } from '../domain/models/types';

/**
 * CONTROLLED DEMO VRP INSTANCE
 *
 * These coordinates and demands are invented for teaching. They are not sampled
 * from a real logistics network, and no claim is made that they resemble one.
 * The instance is tuned so that a learner can reach three distinct regimes by
 * moving one slider — see SCENARIOS below — but the outcomes themselves are
 * computed by the solver, not stored here.
 *
 * Coordinates live on a 100 x 100 plane; distances are plain Euclidean units.
 */

export const DEMO_DEPOT: Depot = {
  id: 'depot',
  label: 'Depot',
  x: 50,
  y: 50,
};

export const DEMO_VEHICLES: readonly Vehicle[] = [
  {
    id: 'v1',
    name: 'Vehicle 1',
    shortName: 'V1',
    capacity: 100,
    color: '#b45309',
  },
  {
    id: 'v2',
    name: 'Vehicle 2',
    shortName: 'V2',
    capacity: 80,
    color: '#1d4ed8',
  },
];

export const DEMO_CUSTOMERS: readonly Customer[] = [
  { id: 'A', label: 'Customer A', x: 22, y: 68, demand: 30 },
  { id: 'B', label: 'Customer B', x: 16, y: 40, demand: 25 },
  { id: 'C', label: 'Customer C', x: 30, y: 24, demand: 35 },
  { id: 'D', label: 'Customer D', x: 76, y: 70, demand: 15 },
  { id: 'E', label: 'Customer E', x: 84, y: 44, demand: 10 },
  { id: 'F', label: 'Customer F', x: 66, y: 26, demand: 10 },
];

export const BASELINE_PROBLEM: VRPProblem = {
  id: 'demo-baseline',
  label: 'Controlled demo VRP instance',
  depot: DEMO_DEPOT,
  vehicles: DEMO_VEHICLES,
  customers: DEMO_CUSTOMERS,
};

/** Bounds for the interactive controls. Stated openly rather than hidden. */
export const CAPACITY_BOUNDS = { min: 20, max: 140, step: 5 } as const;
export const DEMAND_BOUNDS = { min: 5, max: 70, step: 5 } as const;

export interface Scenario {
  readonly id: string;
  readonly label: string;
  /** What the learner is invited to try — never what will happen. */
  readonly description: string;
  readonly vehicleCapacities: Readonly<Record<string, number>>;
  readonly customerDemands: Readonly<Record<string, number>>;
}

const BASELINE_CAPACITIES = { v1: 100, v2: 80 } as const;
const BASELINE_DEMANDS = { A: 30, B: 25, C: 35, D: 15, E: 10, F: 10 } as const;

/**
 * Preset starting points. Each one only sets input values; what the solver does
 * with them is computed live and is not recorded here.
 */
export const SCENARIOS: readonly Scenario[] = [
  {
    id: 'baseline',
    label: 'Baseline',
    description: 'The starting instance. V1 holds 100 kg, V2 holds 80 kg.',
    vehicleCapacities: BASELINE_CAPACITIES,
    customerDemands: BASELINE_DEMANDS,
  },
  {
    id: 'tighten-capacity',
    label: 'Tighten one capacity',
    description: 'Drop V1 from 100 kg to 60 kg and leave everything else alone.',
    vehicleCapacities: { v1: 60, v2: 80 },
    customerDemands: BASELINE_DEMANDS,
  },
  {
    id: 'raise-demand',
    label: 'Raise one demand',
    description: "Increase Customer B's order from 25 kg to 40 kg, capacities untouched.",
    vehicleCapacities: BASELINE_CAPACITIES,
    customerDemands: { A: 30, B: 40, C: 35, D: 15, E: 10, F: 10 },
  },
  {
    id: 'break-it',
    label: 'Break it',
    description: 'Shrink both vehicles to 30 kg and see what the system says.',
    vehicleCapacities: { v1: 30, v2: 30 },
    customerDemands: BASELINE_DEMANDS,
  },
];

export function applyScenario(base: VRPProblem, scenario: Scenario): VRPProblem {
  return {
    ...base,
    vehicles: base.vehicles.map((vehicle) => ({
      ...vehicle,
      capacity: scenario.vehicleCapacities[vehicle.id] ?? vehicle.capacity,
    })),
    customers: base.customers.map((customer) => ({
      ...customer,
      demand: scenario.customerDemands[customer.id] ?? customer.demand,
    })),
  };
}

/** Which preset, if any, the current inputs correspond to. */
export function matchScenario(problem: VRPProblem): string | null {
  for (const scenario of SCENARIOS) {
    const capacitiesMatch = problem.vehicles.every(
      (v) => scenario.vehicleCapacities[v.id] === v.capacity,
    );
    const demandsMatch = problem.customers.every(
      (c) => scenario.customerDemands[c.id] === c.demand,
    );
    if (capacitiesMatch && demandsMatch) return scenario.id;
  }
  return null;
}
