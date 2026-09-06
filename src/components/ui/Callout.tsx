import type { ReactNode } from 'react';

type Tone = 'neutral' | 'note' | 'warning' | 'danger' | 'success';

const TONES: Record<Tone, string> = {
  neutral: 'bg-gray-50 border-gray-300 text-gray-800',
  note: 'bg-blue-50/70 border-blue-300 text-blue-950',
  warning: 'bg-amber-50/80 border-amber-400 text-amber-950',
  danger: 'bg-rose-50 border-rose-300 text-rose-950',
  success: 'bg-emerald-50 border-emerald-300 text-emerald-950',
};

interface Props {
  readonly tone?: Tone;
  readonly title?: string;
  readonly icon?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}

export function Callout({
  tone = 'neutral',
  title,
  icon,
  children,
  className = '',
}: Props) {
  return (
    <div className={`rounded-lg border p-4 space-y-2 ${TONES[tone]} ${className}`}>
      {title && (
        <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-wide">
          {icon}
          <span>{title}</span>
        </div>
      )}
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}
