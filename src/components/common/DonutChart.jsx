import { useFormat } from '../../hooks/useFormat'

// A donut chart drawn with plain SVG (no chart library) with the total in the centre. The colour of a segment is the CSS
// variable --app-status-<key in lower case> (see _theme.scss), so it follows the light and dark mode.
//   segments: [{ key, label, value }]   total: the number in the centre   centerLabel: the text under it
const RADIUS = 54
const STROKE = 18
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function DonutChart({ segments, total, centerLabel, ariaLabel }) {
  const { formatNumber } = useFormat()
  // each drawn segment with the length of its arc and where the arc starts
  const arcs = segments
    .filter((segment) => segment.value > 0)
    .map((segment) => ({ ...segment, length: (segment.value / total) * CIRCUMFERENCE }))
    .map((arc, index, all) => ({ ...arc, start: all.slice(0, index).reduce((sum, previous) => sum + previous.length, 0) }))

  return (
    <div className="donut position-relative mx-auto">
      <svg viewBox="0 0 140 140" className="w-100 h-auto" role="img" aria-label={ariaLabel}>
        <circle cx="70" cy="70" r={RADIUS} fill="none" strokeWidth={STROKE} className="donut-track" />
        {arcs.map((arc) => (
          <circle
            key={arc.key}
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
            strokeDashoffset={-arc.start}
            transform="rotate(-90 70 70)"
            style={{ stroke: `var(--app-status-${arc.key.toLowerCase()})` }}
          >
            <title>{`${arc.label}: ${formatNumber(arc.value)}`}</title>
          </circle>
        ))}
      </svg>
      <div className="donut-center position-absolute top-50 start-50 translate-middle text-center">
        <div className="fs-3 fw-semibold lh-1">{formatNumber(total)}</div>
        <div className="small text-muted">{centerLabel}</div>
      </div>
    </div>
  )
}
