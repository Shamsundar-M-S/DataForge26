/**
 * A simplified diagram of the distinction the Dragon Hatchling paper draws
 * between fixed trained connections and the state that evolves during
 * inference. It illustrates the paper's framing; it is not a model, and no
 * computation happens inside it.
 */
export function BdhArchitecture() {
  return (
    <figure className="p-4">
      <svg
        viewBox="0 0 340 150"
        className="w-full max-w-lg mx-auto"
        role="img"
        aria-label="Diagram: fixed trained connections stay constant while an evolving set of connections is updated by a Hebbian rule as the model reads."
      >
        <rect x="8" y="18" width="140" height="112" rx="4" fill="#f1f5f9" stroke="#94a3b8" />
        <text x="78" y="34" textAnchor="middle" className="fill-gray-900 font-mono" style={{ fontSize: '9px', fontWeight: 600 }}>
          Fixed connections G
        </text>
        <text x="78" y="46" textAnchor="middle" className="fill-gray-600 font-mono" style={{ fontSize: '7.5px' }}>
          set by training
        </text>
        {[
          [40, 70], [78, 62], [116, 74], [50, 104], [96, 106],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="5" fill="#475569" />
        ))}
        <path d="M40 70 L78 62 L116 74 M50 104 L78 62 M96 106 L116 74" stroke="#94a3b8" strokeWidth="1" fill="none" />

        <rect x="192" y="18" width="140" height="112" rx="4" fill="#fffbeb" stroke="#d97706" />
        <text x="262" y="34" textAnchor="middle" className="fill-amber-900 font-mono" style={{ fontSize: '9px', fontWeight: 600 }}>
          Evolving state σ
        </text>
        <text x="262" y="46" textAnchor="middle" className="fill-amber-800 font-mono" style={{ fontSize: '7.5px' }}>
          updated while reading
        </text>
        {[
          [224, 70], [262, 62], [300, 74], [234, 104], [280, 106],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="5" fill="#b45309" />
        ))}
        <path d="M224 70 L262 62 L300 74" stroke="#b45309" strokeWidth="2.4" fill="none" />
        <path d="M234 104 L262 62 M280 106 L300 74" stroke="#fcd34d" strokeWidth="1.2" fill="none" />

        <path d="M152 74 L186 74" stroke="#334155" strokeWidth="1.2" markerEnd="url(#bdh-arrow)" />
        <defs>
          <marker id="bdh-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#334155" />
          </marker>
        </defs>
        <text x="169" y="68" textAnchor="middle" className="fill-gray-700 font-mono" style={{ fontSize: '7px' }}>
          same
        </text>
        <text x="169" y="88" textAnchor="middle" className="fill-gray-700 font-mono" style={{ fontSize: '7px' }}>
          neurons
        </text>

        <text x="170" y="144" textAnchor="middle" className="fill-gray-600 font-mono" style={{ fontSize: '7.5px' }}>
          Thicker lines: connections a Hebbian update has strengthened
        </text>
      </svg>
      <figcaption className="mt-2 text-xs text-gray-600 leading-relaxed max-w-prose mx-auto text-center">
        A teaching illustration of the paper's framing, drawn by us. It is not output
        from BDH and not an official Pathway diagram.
      </figcaption>
    </figure>
  );
}
