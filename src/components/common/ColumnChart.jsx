import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormat } from '../../hooks/useFormat'
import { niceMax } from '../../utils/chartScale'

// A column chart drawn with plain SVG (no chart library): one column per point, a value axis with grid lines and
// date labels under some of the columns. Hovering (or focusing) a column shows a tooltip with its label and value.
//   points: [{ label, value, short? }]  `short` is the text under the column (defaults to the label)
const WIDTH = 760
const HEIGHT = 220
const MARGIN = { top: 10, right: 12, bottom: 30, left: 36 }
const MAX_BAR = 14 // thin columns, also when there are only a few points

export default function ColumnChart({ points, valueName, ariaLabel }) {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  const unit = valueName ?? t('common.chart.value')
  const [hover, setHover] = useState(null)
  if (points.length === 0) {
    return <p className="text-muted small mb-0">{t('common.chart.noData')}</p>
  }
  const innerWidth = WIDTH - MARGIN.left - MARGIN.right
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom
  const top = niceMax(Math.max(...points.map((point) => point.value)))
  const slot = innerWidth / points.length
  const barWidth = Math.min(MAX_BAR, Math.max(1, slot * 0.45))
  const y = (value) => MARGIN.top + innerHeight - (value / top) * innerHeight
  const ticks = [0, 1, 2, 3, 4].map((index) => (top / 4) * index)
  const labelEvery = Math.max(1, Math.ceil(points.length / 8)) // at most about 8 labels under the columns
  const active = hover === null ? null : points[hover]

  return (
    <div className="position-relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-100 h-auto" role="img" aria-label={ariaLabel} onMouseLeave={() => setHover(null)}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y(tick)} y2={y(tick)} className={tick === 0 ? 'chart-axis' : 'chart-grid'} />
            <text x={MARGIN.left - 6} y={y(tick)} textAnchor="end" dominantBaseline="middle" fontSize="11" className="chart-label">
              {tick}
            </text>
          </g>
        ))}
        {points.map((point, index) => {
          const x = MARGIN.left + index * slot
          const height = Math.max(point.value > 0 ? 1.5 : 0, (point.value / top) * innerHeight)
          return (
            <g key={point.label}>
              <rect x={x} y={MARGIN.top} width={slot} height={innerHeight} className={hover === index ? 'chart-hover' : undefined} fill={hover === index ? undefined : 'transparent'} onMouseEnter={() => setHover(index)}>
                <title>{`${point.label}: ${formatNumber(point.value)} ${unit}`}</title>
              </rect>
              <rect x={x + (slot - barWidth) / 2} y={MARGIN.top + innerHeight - height} width={barWidth} height={height} rx={barWidth > 6 ? 2 : 0} className="chart-bar" pointerEvents="none" />
              {index % labelEvery === 0 && (
                <text x={x + slot / 2} y={HEIGHT - 10} textAnchor="middle" fontSize="11" className="chart-label">
                  {point.short ?? point.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {active && (
        <div
          className="chart-tooltip position-absolute rounded small px-2 py-1 shadow pe-none text-nowrap"
          style={{ left: `${((MARGIN.left + (hover + 0.5) * slot) / WIDTH) * 100}%`, top: 0, transform: 'translateX(-50%)' }}
          role="status"
        >
          {active.label}: <strong>{formatNumber(active.value)}</strong> {unit}
        </div>
      )}
    </div>
  )
}
