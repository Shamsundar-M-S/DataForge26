import type { Customer, Depot } from '../models/types';

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Distances are rounded to this many decimals so repeated solves are bit-identical. */
const DECIMALS = 2;

export function round(value: number, decimals: number = DECIMALS): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Straight-line distance on the plane. */
export function euclideanDistance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Length of depot -> c1 -> c2 -> ... -> depot.
 * An empty tour has length 0 (the vehicle never leaves).
 */
export function routeDistance(
  depot: Depot,
  customerIds: readonly string[],
  customersById: ReadonlyMap<string, Customer>,
): number {
  if (customerIds.length === 0) return 0;

  let total = 0;
  let current: Point = depot;

  for (const id of customerIds) {
    const customer = customersById.get(id);
    if (!customer) continue;
    total += euclideanDistance(current, customer);
    current = customer;
  }

  total += euclideanDistance(current, depot);
  return round(total);
}

/** Node ids in visiting order, depot at both ends. Used by the visualizer. */
export function routeNodeSequence(
  depot: Depot,
  customerIds: readonly string[],
): string[] {
  return [depot.id, ...customerIds, depot.id];
}

/** Consecutive node pairs of a tour, including the depot legs. */
export function routeArcs(
  depot: Depot,
  customerIds: readonly string[],
): Array<readonly [string, string]> {
  if (customerIds.length === 0) return [];
  const sequence = routeNodeSequence(depot, customerIds);
  const arcs: Array<readonly [string, string]> = [];
  for (let i = 0; i < sequence.length - 1; i += 1) {
    arcs.push([sequence[i], sequence[i + 1]] as const);
  }
  return arcs;
}
