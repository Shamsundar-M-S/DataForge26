import { useState } from 'react';
import { Layers } from 'lucide-react';
import type { Customer, VRPProblem, VRPSolution } from '../../domain/models/types';
import { useExperiment } from '../../state/ExperimentContext';

interface Props {
  readonly heightClass?: string;
  readonly showOverlayToggle?: boolean;
  readonly interactive?: boolean;
}

function pathFor(
  problem: VRPProblem,
  customerIds: readonly string[],
  byId: ReadonlyMap<string, Customer>,
): string {
  if (customerIds.length === 0) return '';
  const points = [
    [problem.depot.x, problem.depot.y],
    ...customerIds.flatMap((id) => {
      const c = byId.get(id);
      return c ? [[c.x, c.y]] : [];
    }),
    [problem.depot.x, problem.depot.y],
  ];
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
}

/**
 * Draws exactly what the current solution says. Every line, colour and label is
 * read from solver output — this component computes no routes of its own.
 */
export function RouteVisualizer({
  heightClass = 'h-[440px]',
  showOverlayToggle = true,
  interactive = true,
}: Props) {
  const { state, derived, actions } = useExperiment();
  const { committedProblem: problem, currentSolution, previousSolution, selectedCustomerId } = state;
  const { comparison } = derived;

  const [showPrevious, setShowPrevious] = useState(false);
  const canOverlay = Boolean(previousSolution?.feasible) && !comparison.identical;

  const byId = new Map<string, Customer>(problem.customers.map((c) => [c.id, c]));
  const colourOf = (vehicleId: string) =>
    problem.vehicles.find((v) => v.id === vehicleId)?.color ?? '#475569';

  const assignedVehicle = (customerId: string): string | null =>
    currentSolution.routes.find((r) => r.customerIds.includes(customerId))?.vehicleId ??
    null;

  return (
    <div className="rounded-lg border border-gray-300 bg-white shadow-xs overflow-hidden">
      <div className="bg-gray-50/90 border-b border-gray-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <span className="text-gray-700">
          Controlled demo instance · plane 0–100 · straight-line distance
        </span>
        <div className="flex items-center gap-4">
          {showOverlayToggle && canOverlay && (
            <label className="flex items-center gap-1.5 cursor-pointer text-gray-700">
              <input
                type="checkbox"
                checked={showPrevious}
                onChange={(e) => setShowPrevious(e.target.checked)}
                className="rounded border-gray-400 text-amber-700 focus:ring-2 focus:ring-amber-600"
              />
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Overlay previous plan</span>
            </label>
          )}
          <ul className="flex items-center gap-3">
            {problem.vehicles.map((vehicle) => (
              <li key={vehicle.id} className="flex items-center gap-1.5 text-gray-700">
                <span
                  className="w-3 h-3 rounded-xs border border-white outline outline-1 outline-gray-300"
                  style={{ backgroundColor: vehicle.color }}
                  aria-hidden="true"
                />
                <span>{vehicle.shortName}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={`relative w-full ${heightClass} bg-[#fcfdfd]`}>
        <svg
          viewBox="-6 -6 112 112"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
          role="img"
          aria-label={describe(problem, currentSolution)}
        >
          <defs>
            <pattern id="cr-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="0.4"
              />
            </pattern>
            {problem.vehicles.map((vehicle) => (
              <marker
                key={vehicle.id}
                id={`cr-arrow-${vehicle.id}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="4"
                markerHeight="4"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={vehicle.color} />
              </marker>
            ))}
          </defs>

          <rect x="0" y="0" width="100" height="100" fill="url(#cr-grid)" />

          {/* Previous plan, when the learner asks for it */}
          {showPrevious && previousSolution?.feasible && (
            <g opacity="0.4" aria-hidden="true">
              {previousSolution.routes.map((route) => (
                <path
                  key={`prev-${route.vehicleId}`}
                  d={pathFor(problem, route.customerIds, byId)}
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="1.4"
                  strokeDasharray="3,2"
                />
              ))}
            </g>
          )}

          {/* Current plan */}
          {currentSolution.feasible &&
            currentSolution.routes.map((route) => (
              <g key={route.vehicleId}>
                {route.customerIds.length > 0 && (
                  <path
                    d={pathFor(problem, route.customerIds, byId)}
                    fill="none"
                    stroke={colourOf(route.vehicleId)}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    markerMid={`url(#cr-arrow-${route.vehicleId})`}
                  />
                )}
              </g>
            ))}

          {/* Depot */}
          <g transform={`translate(${problem.depot.x}, ${problem.depot.y})`}>
            <rect
              x="-3"
              y="-3"
              width="6"
              height="6"
              fill="#0f172a"
              stroke="#ffffff"
              strokeWidth="1"
            />
            <text
              y="-6"
              textAnchor="middle"
              className="fill-gray-900 font-mono font-bold"
              style={{ fontSize: '3.4px' }}
            >
              Depot
            </text>
          </g>

          {/* Customers */}
          {problem.customers.map((customer) => {
            const vehicleId = assignedVehicle(customer.id);
            const colour = vehicleId ? colourOf(vehicleId) : '#94a3b8';
            const moved = comparison.movedCustomers.some(
              (m) => m.customerId === customer.id,
            );
            const selected = selectedCustomerId === customer.id;

            return (
              <g
                key={customer.id}
                transform={`translate(${customer.x}, ${customer.y})`}
                onClick={
                  interactive ? () => actions.selectCustomer(customer.id) : undefined
                }
                className={interactive ? 'cursor-pointer' : undefined}
              >
                {moved && (
                  <>
                    <circle
                      r="6.5"
                      fill="none"
                      stroke="#b45309"
                      strokeWidth="0.7"
                      strokeDasharray="2,1.5"
                    />
                    {/* Non-colour marker for the reassigned customer */}
                    <text
                      y="-6.2"
                      textAnchor="middle"
                      className="fill-amber-800 font-mono font-bold"
                      style={{ fontSize: '2.8px' }}
                    >
                      moved
                    </text>
                  </>
                )}
                {selected && (
                  <circle r="5.6" fill="none" stroke="#0f172a" strokeWidth="0.6" />
                )}
                <circle
                  r="3.6"
                  fill={colour}
                  stroke="#ffffff"
                  strokeWidth="0.9"
                />
                <text
                  y="1.3"
                  textAnchor="middle"
                  className="fill-white font-mono font-bold"
                  style={{ fontSize: '3.6px' }}
                >
                  {customer.id}
                </text>
                <text
                  y="7.6"
                  textAnchor="middle"
                  className="fill-gray-600 font-mono"
                  style={{ fontSize: '3px' }}
                >
                  {customer.demand} kg
                </text>
              </g>
            );
          })}
        </svg>

        {!currentSolution.feasible && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/85">
            <p className="font-mono text-sm text-rose-900 border border-rose-300 bg-rose-50 rounded px-4 py-3 max-w-sm text-center">
              No feasible solution — there are no routes to draw. The customers are
              shown unassigned.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 px-4 py-2.5 text-xs font-mono text-gray-700 flex flex-wrap gap-x-6 gap-y-1">
        {currentSolution.feasible ? (
          <>
            {currentSolution.routes.map((route) => {
              const vehicle = problem.vehicles.find((v) => v.id === route.vehicleId);
              return (
                <span key={route.vehicleId}>
                  <strong>{vehicle?.shortName}</strong>{' '}
                  {route.customerIds.length > 0
                    ? `Depot → ${route.customerIds.join(' → ')} → Depot`
                    : 'stays at the depot'}{' '}
                  <span className="text-gray-500">
                    ({route.load} kg, {route.distance} units)
                  </span>
                </span>
              );
            })}
            <span className="text-gray-900">
              <strong>Total {currentSolution.totalDistance} units</strong>
            </span>
          </>
        ) : (
          <span className="text-rose-800">
            Total demand {derived.validation.totalDemand} kg · total capacity{' '}
            {derived.validation.totalCapacity} kg
          </span>
        )}
      </div>
    </div>
  );
}

function describe(problem: VRPProblem, solution: VRPSolution): string {
  if (!solution.feasible) {
    return `Map of ${problem.customers.length} customers around a central depot. No feasible routes exist for the current constraints.`;
  }
  const parts = solution.routes.map((route) => {
    const vehicle = problem.vehicles.find((v) => v.id === route.vehicleId);
    return `${vehicle?.name ?? route.vehicleId} visits ${
      route.customerIds.length > 0 ? route.customerIds.join(', ') : 'nobody'
    }`;
  });
  return `Route map. ${parts.join('. ')}. Total distance ${solution.totalDistance} units.`;
}
