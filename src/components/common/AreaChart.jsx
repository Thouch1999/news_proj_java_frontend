import { useRef, useState } from 'react'
import { useFormat } from '../../hooks/useFormat'
import { niceMax } from '../../utils/chartScale'

// A two-series chart drawn with plain SVG (no chart library): series A is a filled area on the left axis, series B is a
// line on the right axis (each has its own scale, because their sizes are very different). Hover, touch or the arrow
// keys move a marker across the days and show a tooltip with both values. Colours come from the theme variables.
//   points: [{ label, short?, a, b }]  `label` is shown in the tooltip, `short` under the axis (defaults to the label)
//   seriesA / seriesB: { name }
const WIDTH = 760
const HEIGHT = 250
const MARGIN = { top: 12, right: 40, bottom: 30, left: 44 }
const DOT_LIMIT = 31 // a dot on every point only while the chart is not crowded

export default function AreaChart({ points, seriesA, seriesB, ariaLabel }) {
  const { formatNumber } = useFormat()
  const svgRef = useRef(null)
  const [hover, setHover] = useState(null)
  const count = points.length
  const innerWidth = WIDTH - MARGIN.left - MARGIN.right
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom
  const baseline = MARGIN.top + innerHeight
  const topA = niceMax(Math.max(0, ...points.map((point) => point.a)))
  const topB = niceMax(Math.max(0, ...points.map((point) => point.b)))
  const x = (index) => (count === 1 ? MARGIN.left + innerWidth / 2 : MARGIN.left + (index * innerWidth) / (count - 1))
  const yA = (value) => baseline - (value / topA) * innerHeight
  const yB = (value) => baseline - (value / topB) * innerHeight
  const path = (key, y) => points.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)} ${y(point[key]).toFixed(1)}`).join(' ')
  const ticks = [0, 1, 2, 3, 4]
  const labelEvery = Math.max(1, Math.ceil(count / 7)) // about 7 labels under the chart
  const active = hover === null ? null : points[hover]

  const locate = (clientX) => {
    const rect = svgRef.current.getBoundingClientRect()
    const position = ((clientX - rect.left) / rect.width) * WIDTH
    const index = count === 1 ? 0 : Math.round(((position - MARGIN.left) / innerWidth) * (count - 1))
    setHover(Math.min(count - 1, Math.max(0, index)))
  }
  const onKeyDown = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const step = event.key === 'ArrowRight' ? 1 : -1
    setHover((current) => Math.min(count - 1, Math.max(0, (current ?? (step > 0 ? -1 : count)) + step)))
  }

  return (
    <div className="position-relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-100 h-auto chart-surface"
        role="img"
        aria-label={ariaLabel}
        tabIndex={0}
        onPointerMove={(event) => locate(event.clientX)}
        onPointerDown={(event) => locate(event.clientX)}
        onPointerLeave={() => setHover(null)}
        onBlur={() => setHover(null)}
        onKeyDown={onKeyDown}
      >
        {ticks.map((tick) => {
          const line = baseline - (tick / 4) * innerHeight
          return (
            <g key={tick}>
              <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={line} y2={line} className={tick === 0 ? 'chart-axis' : 'chart-grid'} />
              <text x={MARGIN.left - 6} y={line} textAnchor="end" dominantBaseline="middle" fontSize="11" className="chart-label chart-label--a">
                {formatNumber((topA / 4) * tick)}
              </text>
              <text x={WIDTH - MARGIN.right + 6} y={line} textAnchor="start" dominantBaseline="middle" fontSize="11" className="chart-label chart-label--b">
                {formatNumber((topB / 4) * tick)}
              </text>
            </g>
          )
        })}
        {count > 1 && <path d={`${path('a', yA)} L${x(count - 1)} ${baseline} L${x(0)} ${baseline} Z`} className="chart-area chart-area--a" />}
        {count > 1 && <path d={path('a', yA)} className="chart-line chart-line--a" fill="none" />}
        {count > 1 && <path d={path('b', yB)} className="chart-line chart-line--b" fill="none" />}
        {points.map((point, index) => (
          <g key={point.label}>
            {count <= DOT_LIMIT && <circle cx={x(index)} cy={yB(point.b)} r="2.5" className="chart-dot chart-dot--b" />}
            {index % labelEvery === 0 && (
              <text x={x(index)} y={HEIGHT - 10} textAnchor="middle" fontSize="11" className="chart-label">
                {point.short ?? point.label}
              </text>
            )}
          </g>
        ))}
        {active && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={MARGIN.top} y2={baseline} className="chart-cursor" />
            <circle cx={x(hover)} cy={yA(active.a)} r="4.5" className="chart-dot chart-dot--a" />
            <circle cx={x(hover)} cy={yB(active.b)} r="4.5" className="chart-dot chart-dot--b" />
          </g>
        )}
      </svg>
      {active && (
        <div
          className="chart-tooltip position-absolute rounded small px-2 py-1 shadow pe-none text-nowrap"
          style={{ left: `${Math.min(86, Math.max(14, (x(hover) / WIDTH) * 100))}%`, top: 0, transform: 'translateX(-50%)' }}
          role="status"
        >
          <div className="fw-semibold">{active.label}</div>
          <div>
            <span className="legend-dot legend-dot--a" /> {seriesA.name}: <strong>{formatNumber(active.a)}</strong>
          </div>
          <div>
            <span className="legend-dot legend-dot--b" /> {seriesB.name}: <strong>{formatNumber(active.b)}</strong>
          </div>
        </div>
      )}
    </div>
  )
}
