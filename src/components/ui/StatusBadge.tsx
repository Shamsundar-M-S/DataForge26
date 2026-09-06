import { CheckCircle2, AlertTriangle, XOctagon } from 'lucide-react';
import type { FeasibilityStatus } from '../../state/selectors';

const STYLES: Record<
  FeasibilityStatus,
  { className: string; label: string; Icon: typeof CheckCircle2 }
> = {
  FEASIBLE: {
    className: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    label: 'Feasible',
    Icon: CheckCircle2,
  },
  INVALID: {
    className: 'bg-amber-50 border-amber-400 text-amber-900',
    label: 'Invalid',
    Icon: AlertTriangle,
  },
  NO_FEASIBLE_SOLUTION: {
    className: 'bg-rose-50 border-rose-300 text-rose-900',
    label: 'No feasible solution',
    Icon: XOctagon,
  },
};

interface Props {
  readonly status: FeasibilityStatus;
  readonly detail?: string;
  readonly size?: 'sm' | 'md';
}

/**
 * Status is always shown with an icon, a shape and a word — never colour alone,
 * so it survives a monochrome screen or colour-blind vision.
 */
export function StatusBadge({ status, detail, size = 'md' }: Props) {
  const { className, label, Icon } = STYLES[status];
  const padding = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border font-mono ${padding} ${className}`}
      role="status"
    >
      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span className="flex flex-col leading-tight">
        <span className="text-xs font-semibold">{label}</span>
        {detail && <span className="text-[10px] opacity-80">{detail}</span>}
      </span>
    </span>
  );
}
