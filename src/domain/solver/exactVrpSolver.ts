import type {
  ConstraintViolation,
  Customer,
  Depot,
  Route,
  VRPProblem,
  VRPSolution,
} from '../models/types';
import { SolverError } from '../models/types';
import { round, routeDistance } from './distance';
import { permutations } from './permutations';

/**
 * Exact solver for a deliberately tiny Capacitated VRP.
 *
 * Method, in full:
 *   1. Enumerate every assignment of customers to vehicles (k^n candidates).
 *   2. Discard any candidate where some vehicle's load exceeds its capacity.
 *   3. For each surviving candidate, find each vehicle's shortest tour by trying
 *      every visiting order (brute-force TSP over that vehicle's customers).
 *   4. Keep the candidate with the smallest total distance.
 *
 * There is no heuristic and no special-casing of particular capacities,
 * customers, or vehicles: the returned solution is optimal for whatever problem
 * instance it is handed. Steps 3's per-subset results are memoised, so the same
 * customer subset is only ever toured once per solve.
 */

/** Above this, brute force stops being instant. Guarded rather than silently slow. */
const MAX_ASSIGNMENTS = 200_000;
const MAX_CUSTOMERS_PER_TOUR = 9;
/** Distances are rounded to 2dp, so anything below this is a floating-point artefact. */
const EPSILON = 1e-9;

interface TourResult {
  readonly order: readonly string[];
  readonly distance: number;
}

function shortestTour(
  depot: Depot,
  customerIds: readonly string[],
  customersById: ReadonlyMap<string, Customer>,
): TourResult {
  if (customerIds.length === 0) return { order: [], distance: 0 };
  if (customerIds.length > MAX_CUSTOMERS_PER_TOUR) {
    throw new SolverError(
      `A single vehicle was assigned ${customerIds.length} customers; the exact ` +
        `tour search is limited to ${MAX_CUSTOMERS_PER_TOUR}.`,
    );
  }

  let bestOrder: readonly string[] = customerIds;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of permutations(customerIds)) {
    const distance = routeDistance(depot, candidate, customersById);
    // Strict improvement only: the first permutation reaching the minimum wins,
    // which makes the result identical across repeated solves.
    if (distance < bestDistance - EPSILON) {
      bestDistance = distance;
      bestOrder = candidate;
    }
  }

  return { order: bestOrder, distance: bestDistance };
}

function infeasible(
  violations: readonly ConstraintViolation[],
  stats: VRPSolution['stats'],
): VRPSolution {
  return { feasible: false, routes: [], totalDistance: 0, violations, stats };
}

export function solveVrpExactly(problem: VRPProblem): VRPSolution {
  const startedAt = now();
  const { depot, vehicles, customers } = problem;

  if (vehicles.length === 0) {
    throw new SolverError('The problem has no vehicles.');
  }
  for (const vehicle of vehicles) {
    if (!Number.isFinite(vehicle.capacity) || vehicle.capacity < 0) {
      throw new SolverError(
        `${vehicle.name} has an invalid capacity (${vehicle.capacity}).`,
      );
    }
  }
  for (const customer of customers) {
    if (!Number.isFinite(customer.demand) || customer.demand < 0) {
      throw new SolverError(
        `${customer.label} has an invalid demand (${customer.demand}).`,
      );
    }
  }

  const customersById = new Map<string, Customer>(customers.map((c) => [c.id, c]));
  const totalDemand = customers.reduce((sum, c) => sum + c.demand, 0);
  const totalCapacity = vehicles.reduce((sum, v) => sum + v.capacity, 0);

  const n = customers.length;
  const k = vehicles.length;
  const assignmentCount = k ** n;

  const makeStats = (
    feasibleCount: number,
    tours: number,
  ): VRPSolution['stats'] => ({
    algorithm: 'Exhaustive assignment enumeration with exact tour ordering',
    assignmentsEnumerated: assignmentCount,
    assignmentsFeasible: feasibleCount,
    toursEvaluated: tours,
    elapsedMs: round(now() - startedAt, 3),
  });

  if (assignmentCount > MAX_ASSIGNMENTS) {
    throw new SolverError(
      `${assignmentCount.toLocaleString()} assignments exceed the exact-search ` +
        `limit of ${MAX_ASSIGNMENTS.toLocaleString()}.`,
    );
  }

  // --- Cheap necessary conditions, reported before the search ---------------
  // These are shortcuts to a clearer message, not shortcuts to an answer: the
  // search below would also fail, it just could not say why so precisely.

  if (totalDemand > totalCapacity) {
    return infeasible(
      [
        {
          type: 'FLEET_CAPACITY_DEFICIT',
          message:
            `Total customer demand is ${totalDemand} kg but the whole fleet can ` +
            `only carry ${totalCapacity} kg. At least ${totalDemand - totalCapacity} kg ` +
            'cannot be loaded onto any vehicle.',
          inequality: `${totalDemand} kg > ${totalCapacity} kg`,
        },
      ],
      makeStats(0, 0),
    );
  }

  const largestCapacity = Math.max(...vehicles.map((v) => v.capacity));
  const oversized = customers.filter((c) => c.demand > largestCapacity);
  if (oversized.length > 0) {
    return infeasible(
      oversized.map((customer) => ({
        type: 'CUSTOMER_EXCEEDS_EVERY_VEHICLE' as const,
        customerId: customer.id,
        message:
          `${customer.label} needs ${customer.demand} kg, which is more than the ` +
          `largest vehicle can carry (${largestCapacity} kg). No single vehicle can serve it.`,
        inequality: `${customer.demand} kg > ${largestCapacity} kg`,
      })),
      makeStats(0, 0),
    );
  }

  // --- Exhaustive search ----------------------------------------------------

  const tourCache = new Map<string, TourResult>();
  const tourFor = (ids: readonly string[]): TourResult => {
    // Cache key uses the problem's own customer order, so {A,C} and {C,A} share
    // one entry regardless of the order the assignment loop produced them in.
    const key = customers
      .filter((c) => ids.includes(c.id))
      .map((c) => c.id)
      .join('|');
    const cached = tourCache.get(key);
    if (cached) return cached;
    const computed = shortestTour(depot, ids, customersById);
    tourCache.set(key, computed);
    return computed;
  };

  let feasibleCount = 0;
  let bestTotalDistance = Number.POSITIVE_INFINITY;
  let bestGroups: string[][] | null = null;
  let bestLoads: number[] = [];
  let bestTours: TourResult[] = [];

  for (let code = 0; code < assignmentCount; code += 1) {
    const groups: string[][] = Array.from({ length: k }, () => []);
    const loads = new Array<number>(k).fill(0);

    // Interpret `code` as an n-digit base-k number: digit i is the vehicle
    // serving customer i.
    let remainder = code;
    let overCapacity = false;
    for (let i = 0; i < n; i += 1) {
      const vehicleIndex = remainder % k;
      remainder = Math.floor(remainder / k);
      const customer = customers[i];
      groups[vehicleIndex].push(customer.id);
      loads[vehicleIndex] += customer.demand;
      if (loads[vehicleIndex] > vehicles[vehicleIndex].capacity) {
        overCapacity = true;
        break;
      }
    }
    if (overCapacity) continue;

    feasibleCount += 1;

    const tours = groups.map((ids) => tourFor(ids));
    const total = tours.reduce((sum, tour) => sum + tour.distance, 0);

    if (total < bestTotalDistance - EPSILON) {
      bestTotalDistance = total;
      bestGroups = groups;
      bestLoads = loads;
      bestTours = tours;
    }
  }

  const stats = makeStats(feasibleCount, tourCache.size);

  if (!bestGroups) {
    const bounds = vehicles
      .map((v) => `${v.shortName} ${v.capacity} kg`)
      .join(', ');
    return infeasible(
      [
        {
          type: 'NO_FEASIBLE_PARTITION',
          message:
            `Total demand (${totalDemand} kg) fits within total capacity ` +
            `(${totalCapacity} kg), but no way of splitting these customers keeps ` +
            'every vehicle within its own limit. The demands cannot be divided finely enough.',
          inequality: `0 of ${assignmentCount} assignments satisfy ${bounds}`,
        },
      ],
      stats,
    );
  }

  const routes: Route[] = vehicles.map((vehicle, index) => ({
    vehicleId: vehicle.id,
    customerIds: bestTours[index].order,
    load: bestLoads[index],
    distance: round(bestTours[index].distance),
  }));

  return {
    feasible: true,
    routes,
    totalDistance: round(bestTotalDistance),
    violations: [],
    stats,
  };
}

function now(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}
