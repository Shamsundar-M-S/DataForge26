import type {
  ConstraintViolation,
  Customer,
  ValidationCheck,
  ValidationResult,
  VehicleLoadInfo,
  VRPProblem,
  VRPSolution,
} from '../models/types';
import { round, routeDistance } from '../solver/distance';

/** Distances are stored to 2dp, so agreement is checked at that resolution. */
const DISTANCE_TOLERANCE = 0.011;

/**
 * Re-derives every claim a solution makes, from the problem alone.
 *
 * This deliberately trusts nothing the solver reported: loads are re-summed from
 * customer demands and distances are re-measured from coordinates. If the solver
 * were wrong, this layer would say so — which is what lets the application state
 * "FEASIBLE" or "INVALID" on its own authority rather than the solver's.
 */
export function validateSolution(
  problem: VRPProblem,
  solution: VRPSolution,
): ValidationResult {
  const { depot, vehicles, customers } = problem;
  const customersById = new Map<string, Customer>(customers.map((c) => [c.id, c]));
  const vehiclesById = new Map(vehicles.map((v) => [v.id, v]));

  const totalDemand = customers.reduce((sum, c) => sum + c.demand, 0);
  const totalCapacity = vehicles.reduce((sum, v) => sum + v.capacity, 0);
  const fleetSlack = totalCapacity - totalDemand;

  const violations: ConstraintViolation[] = [];
  const checks: ValidationCheck[] = [];
  const loads: VehicleLoadInfo[] = [];

  // An infeasible solution has no routes to check. Its own violations stand,
  // and the fleet-level arithmetic is still worth reporting.
  if (!solution.feasible) {
    return {
      valid: false,
      checks: [
        {
          id: 'feasibility',
          label: 'A feasible assignment exists',
          passed: false,
          detail:
            `Total demand ${totalDemand} kg against total capacity ${totalCapacity} kg ` +
            `(slack ${fleetSlack} kg).`,
        },
      ],
      violations:
        solution.violations.length > 0
          ? solution.violations
          : [
              {
                type: 'NO_FEASIBLE_PARTITION',
                message: 'No assignment of customers to vehicles satisfies every constraint.',
              },
            ],
      loads: vehicles.map((v) => ({
        vehicleId: v.id,
        vehicleName: v.name,
        load: 0,
        capacity: v.capacity,
        slack: v.capacity,
        overloaded: false,
      })),
      totalDemand,
      totalCapacity,
      fleetSlack,
      recomputedTotalDistance: 0,
    };
  }

  // --- Coverage: every customer served exactly once -------------------------

  const serviceCount = new Map<string, number>(customers.map((c) => [c.id, 0]));

  for (const route of solution.routes) {
    if (!vehiclesById.has(route.vehicleId)) {
      violations.push({
        type: 'UNKNOWN_VEHICLE',
        vehicleId: route.vehicleId,
        message: `A route refers to vehicle "${route.vehicleId}", which is not in the fleet.`,
      });
      continue;
    }
    for (const customerId of route.customerIds) {
      if (!customersById.has(customerId)) {
        violations.push({
          type: 'UNKNOWN_CUSTOMER',
          customerId,
          message: `A route visits "${customerId}", which is not a customer in this problem.`,
        });
        continue;
      }
      serviceCount.set(customerId, (serviceCount.get(customerId) ?? 0) + 1);
    }
  }

  const unserved = customers.filter((c) => (serviceCount.get(c.id) ?? 0) === 0);
  const duplicated = customers.filter((c) => (serviceCount.get(c.id) ?? 0) > 1);

  for (const customer of unserved) {
    violations.push({
      type: 'CUSTOMER_UNSERVED',
      customerId: customer.id,
      message: `${customer.label} is never visited.`,
    });
  }
  for (const customer of duplicated) {
    violations.push({
      type: 'CUSTOMER_SERVED_TWICE',
      customerId: customer.id,
      message: `${customer.label} is visited ${serviceCount.get(customer.id)} times; it must be visited once.`,
    });
  }

  checks.push({
    id: 'coverage',
    label: 'Every customer is served',
    passed: unserved.length === 0,
    detail:
      unserved.length === 0
        ? `All ${customers.length} customers appear in a route.`
        : `Missing: ${unserved.map((c) => c.id).join(', ')}.`,
  });
  checks.push({
    id: 'uniqueness',
    label: 'No customer is served twice',
    passed: duplicated.length === 0,
    detail:
      duplicated.length === 0
        ? 'Each customer appears in exactly one route, once.'
        : `Repeated: ${duplicated.map((c) => c.id).join(', ')}.`,
  });

  // --- Per-vehicle load and capacity ---------------------------------------

  let capacityRespected = true;

  for (const vehicle of vehicles) {
    const route = solution.routes.find((r) => r.vehicleId === vehicle.id);
    const customerIds = route?.customerIds ?? [];
    const recomputedLoad = customerIds.reduce(
      (sum, id) => sum + (customersById.get(id)?.demand ?? 0),
      0,
    );

    if (route && route.load !== recomputedLoad) {
      violations.push({
        type: 'ROUTE_LOAD_MISMATCH',
        vehicleId: vehicle.id,
        message:
          `${vehicle.name} reports a load of ${route.load} kg, but its customers' ` +
          `demands sum to ${recomputedLoad} kg.`,
      });
    }

    const overloaded = recomputedLoad > vehicle.capacity;
    if (overloaded) {
      capacityRespected = false;
      violations.push({
        type: 'VEHICLE_CAPACITY_EXCEEDED',
        vehicleId: vehicle.id,
        message:
          `${vehicle.name} is carrying ${recomputedLoad} kg but can only hold ` +
          `${vehicle.capacity} kg — ${recomputedLoad - vehicle.capacity} kg too much.`,
        inequality: `${recomputedLoad} kg > ${vehicle.capacity} kg`,
      });
    }

    loads.push({
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      load: recomputedLoad,
      capacity: vehicle.capacity,
      slack: vehicle.capacity - recomputedLoad,
      overloaded,
    });
  }

  checks.push({
    id: 'capacity',
    label: 'No vehicle exceeds its capacity',
    passed: capacityRespected,
    detail: loads
      .map((l) => `${l.vehicleName}: ${l.load}/${l.capacity} kg`)
      .join(' · '),
  });

  // --- Depot start and end --------------------------------------------------
  // Routes store customers only; the depot is implicit at both ends. The check
  // that matters is therefore that every non-empty route can be closed back to
  // the depot, which holds as long as the depot has coordinates.

  const depotWellFormed = Number.isFinite(depot.x) && Number.isFinite(depot.y);
  checks.push({
    id: 'depot',
    label: 'Every route starts and ends at the depot',
    passed: depotWellFormed,
    detail: depotWellFormed
      ? `All tours are closed through ${depot.label} at (${depot.x}, ${depot.y}).`
      : 'The depot has no valid coordinates.',
  });

  // --- Distances ------------------------------------------------------------

  let distancesAgree = true;
  let recomputedTotal = 0;

  for (const route of solution.routes) {
    const recomputed = routeDistance(depot, route.customerIds, customersById);
    recomputedTotal += recomputed;
    if (Math.abs(recomputed - route.distance) > DISTANCE_TOLERANCE) {
      distancesAgree = false;
      violations.push({
        type: 'ROUTE_DISTANCE_MISMATCH',
        vehicleId: route.vehicleId,
        message:
          `A route reports a distance of ${route.distance} but re-measuring its ` +
          `coordinates gives ${round(recomputed)}.`,
      });
    }
  }

  recomputedTotal = round(recomputedTotal);
  if (Math.abs(recomputedTotal - solution.totalDistance) > DISTANCE_TOLERANCE) {
    distancesAgree = false;
    violations.push({
      type: 'TOTAL_DISTANCE_MISMATCH',
      message:
        `The solution reports a total distance of ${solution.totalDistance} but the ` +
        `routes measure ${recomputedTotal}.`,
    });
  }

  checks.push({
    id: 'distance',
    label: 'Reported distances match the coordinates',
    passed: distancesAgree,
    detail: `Re-measured total: ${recomputedTotal} units.`,
  });

  return {
    valid: violations.length === 0,
    checks,
    violations,
    loads,
    totalDemand,
    totalCapacity,
    fleetSlack,
    recomputedTotalDistance: recomputedTotal,
  };
}

/**
 * Checks a solution that was computed for one problem against a *different*
 * problem — the question "is what we were doing before still allowed?".
 *
 * This is what makes the central lesson visible: the previous assignment is not
 * re-solved, it is re-judged under the new constraints.
 */
export function validateAgainstProblem(
  problem: VRPProblem,
  priorSolution: VRPSolution,
): ValidationResult {
  return validateSolution(problem, priorSolution);
}
