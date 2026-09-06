import type {
  Arc,
  ConstraintChange,
  CustomerMovement,
  RouteChange,
  SolutionComparison,
  VRPProblem,
  VRPSolution,
} from '../models/types';
import { round, routeArcs } from '../solver/distance';

function arcKey(arc: Arc): string {
  return `${arc[0]}\u2192${arc[1]}`;
}

function assignmentMap(solution: VRPSolution | null): Map<string, string> {
  const map = new Map<string, string>();
  if (!solution) return map;
  for (const route of solution.routes) {
    for (const customerId of route.customerIds) {
      map.set(customerId, route.vehicleId);
    }
  }
  return map;
}

/**
 * Diffs two solutions of (possibly different versions of) the same problem.
 *
 * Everything reported here is derived by comparing the two solution objects.
 * No customer, vehicle, or quantity is named in advance.
 */
export function compareSolutions(
  previous: VRPSolution | null,
  current: VRPSolution,
  problem: VRPProblem,
): SolutionComparison {
  const { depot, vehicles, customers } = problem;
  const hasPrevious = previous !== null;
  const previousFeasible = previous?.feasible ?? false;
  const currentFeasible = current.feasible;

  const routeChanges: RouteChange[] = vehicles.map((vehicle) => {
    const before = previous?.routes.find((r) => r.vehicleId === vehicle.id);
    const after = current.routes.find((r) => r.vehicleId === vehicle.id);
    const previousCustomerIds = before?.customerIds ?? [];
    const currentCustomerIds = after?.customerIds ?? [];
    return {
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      previousCustomerIds,
      currentCustomerIds,
      previousLoad: before?.load ?? 0,
      currentLoad: after?.load ?? 0,
      loadDelta: (after?.load ?? 0) - (before?.load ?? 0),
      previousDistance: before?.distance ?? 0,
      currentDistance: after?.distance ?? 0,
      sequenceChanged:
        previousCustomerIds.join(',') !== currentCustomerIds.join(','),
    };
  });

  const previousDistance = previous?.totalDistance ?? 0;
  const currentDistance = current.totalDistance;
  const distanceDelta =
    hasPrevious && previousFeasible && currentFeasible
      ? round(currentDistance - previousDistance)
      : 0;

  const feasibilityChanged = hasPrevious && previousFeasible !== currentFeasible;

  // Customer-level movement only means something when both solutions have routes.
  const comparable = hasPrevious && previousFeasible && currentFeasible;

  const before = assignmentMap(previous);
  const after = assignmentMap(current);

  const movedCustomers: CustomerMovement[] = [];
  const affected = new Set<string>();

  if (comparable) {
    for (const customer of customers) {
      const from = before.get(customer.id) ?? null;
      const to = after.get(customer.id) ?? null;
      if (from !== to) {
        movedCustomers.push({
          customerId: customer.id,
          customerLabel: customer.label,
          demand: customer.demand,
          fromVehicleId: from,
          toVehicleId: to,
        });
        affected.add(customer.id);
      }
    }

    // A customer whose vehicle is unchanged but whose visiting order shifted is
    // also affected — the plan around it changed.
    for (const change of routeChanges) {
      if (!change.sequenceChanged) continue;
      for (const customerId of change.currentCustomerIds) affected.add(customerId);
      for (const customerId of change.previousCustomerIds) affected.add(customerId);
    }
  }

  const previousArcs = new Map<string, Arc>();
  const currentArcs = new Map<string, Arc>();

  if (previous?.feasible) {
    for (const route of previous.routes) {
      for (const arc of routeArcs(depot, route.customerIds)) {
        previousArcs.set(arcKey(arc), arc);
      }
    }
  }
  if (current.feasible) {
    for (const route of current.routes) {
      for (const arc of routeArcs(depot, route.customerIds)) {
        currentArcs.set(arcKey(arc), arc);
      }
    }
  }

  const removedArcs: Arc[] = [];
  const addedArcs: Arc[] = [];
  if (comparable) {
    for (const [key, arc] of previousArcs) {
      if (!currentArcs.has(key)) removedArcs.push(arc);
    }
    for (const [key, arc] of currentArcs) {
      if (!previousArcs.has(key)) addedArcs.push(arc);
    }
  }

  const identical =
    comparable &&
    movedCustomers.length === 0 &&
    removedArcs.length === 0 &&
    addedArcs.length === 0 &&
    distanceDelta === 0;

  return {
    hasPrevious,
    identical,
    previousFeasible,
    currentFeasible,
    feasibilityChanged,
    previousDistance,
    currentDistance,
    distanceDelta,
    movedCustomers,
    affectedCustomerIds: [...affected].sort(),
    routeChanges,
    removedArcs,
    addedArcs,
  };
}

/**
 * Diffs two problem instances to find which constraints the learner altered.
 * Used both for the pending-change preview and for the explanation's first step.
 */
export function diffProblems(
  previous: VRPProblem | null,
  current: VRPProblem,
): ConstraintChange[] {
  if (!previous) return [];
  const changes: ConstraintChange[] = [];

  for (const vehicle of current.vehicles) {
    const before = previous.vehicles.find((v) => v.id === vehicle.id);
    if (before && before.capacity !== vehicle.capacity) {
      changes.push({
        kind: 'VEHICLE_CAPACITY',
        targetId: vehicle.id,
        targetLabel: vehicle.name,
        previousValue: before.capacity,
        currentValue: vehicle.capacity,
        delta: vehicle.capacity - before.capacity,
      });
    }
  }

  for (const customer of current.customers) {
    const before = previous.customers.find((c) => c.id === customer.id);
    if (before && before.demand !== customer.demand) {
      changes.push({
        kind: 'CUSTOMER_DEMAND',
        targetId: customer.id,
        targetLabel: customer.label,
        previousValue: before.demand,
        currentValue: customer.demand,
        delta: customer.demand - before.demand,
      });
    }
  }

  return changes;
}
