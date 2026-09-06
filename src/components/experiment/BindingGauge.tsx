import type { VehicleLoadInfo } from '../../domain/models/types';

interface BindingGaugeProps {
  readonly loadInfo: VehicleLoadInfo;
  readonly color: string;
}

export function BindingGauge({ loadInfo, color }: BindingGaugeProps) {
  const { vehicleName, load, capacity, slack, overloaded } = loadInfo;
  
  const percentage = capacity > 0 ? Math.min(100, Math.max(0, (load / capacity) * 100)) : 100;
  const isBoundary = load === capacity;
  
  let statusText = 'SLACK';
  let badgeStyle = 'bg-emerald-100 text-emerald-900 border-emerald-300';
  let barColor = color;
  
  if (overloaded) {
    statusText = 'VIOLATED';
    badgeStyle = 'bg-rose-100 text-rose-900 border-rose-400 font-bold';
    barColor = '#e11d48'; // Rose red
  } else if (isBoundary) {
    statusText = 'BINDING';
    badgeStyle = 'bg-amber-100 text-amber-900 border-amber-400 font-bold';
  }

  return (
    <div className="rounded border border-gray-200 bg-gray-50/50 p-2.5 space-y-1.5 font-mono text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-gray-900 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: color }} aria-hidden="true" />
          {vehicleName}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-gray-700">
            <strong>{load}</strong> / {capacity} kg
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badgeStyle}`}>
            {statusText}
          </span>
        </div>
      </div>

      {/* Visual gauge bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden relative">
        <div
          className="h-full transition-all duration-300 rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: barColor,
          }}
        />
      </div>

      <div className="flex justify-between items-center text-[10px] text-gray-600">
        <span>
          {overloaded ? (
            <span className="text-rose-700 font-semibold">
              Exceeds limit by {-slack} kg
            </span>
          ) : isBoundary ? (
            <span className="text-amber-800 font-semibold">
              Exact capacity bound reached
            </span>
          ) : (
            <span>{slack} kg spare slack</span>
          )}
        </span>
        <span>{percentage.toFixed(0)}% capacity</span>
      </div>
    </div>
  );
}
