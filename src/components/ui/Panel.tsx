import type { ReactNode } from 'react';

interface PanelProps {
  readonly title?: string;
  readonly subtitle?: string;
  readonly action?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}

/** The standard bordered white card used throughout the application. */
export function Panel({ title, subtitle, action, children, className = '' }: PanelProps) {
  return (
    <section
      className={`bg-white rounded-lg border border-gray-300 shadow-xs overflow-hidden ${className}`}
    >
      {(title || action) && (
        <div className="px-4 py-3 bg-gray-50/70 border-b border-gray-200 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="text-sm font-mono font-semibold text-gray-900 tracking-wide">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-gray-600 mt-0.5 max-w-prose">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
