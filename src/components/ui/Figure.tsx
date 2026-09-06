import type { ReactNode } from 'react';

interface Props {
  readonly label: string;
  readonly value: ReactNode;
  readonly hint?: string;
  readonly tone?: 'default' | 'positive' | 'negative';
}

const TONES = {
  default: 'text-gray-900',
  positive: 'text-emerald-700',
  negative: 'text-rose-700',
} as const;

/** A single labelled number. Used wherever a computed quantity is displayed. */
export function Figure({ label, value, hint, tone = 'default' }: Props) {
  return (
    <div className="p-3 rounded bg-gray-50 border border-gray-200">
      <dt className="text-[11px] font-mono text-gray-500">{label}</dt>
      <dd className={`text-base font-mono font-bold ${TONES[tone]}`}>{value}</dd>
      {hint && <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p>}
    </div>
  );
}
