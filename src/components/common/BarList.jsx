// Horizontal bars, one row per item, drawn with HTML and CSS (no chart library). The label is normal text, so long
// and Khmer names wrap and render with the page font.
//   items: [{ key, label, value, secondary?, href? }]  value is the bar; secondary (<= value) is the darker part of it
//   valueLabel(item): the text at the end of the row
export default function BarList({ items, valueLabel = (item) => String(item.value), primaryLabel = '', secondaryLabel = '' }) {
  const max = Math.max(1, ...items.map((item) => item.value))
  const hasSecondary = items.some((item) => item.secondary !== undefined)

  return (
    <div>
      {hasSecondary && (
        <div className="d-flex gap-3 small text-muted mb-2">
          <span>
            <span className="bar-legend bg-primary me-1" />
            {secondaryLabel}
          </span>
          <span>
            <span className="bar-legend bg-primary bg-opacity-25 me-1" />
            {primaryLabel}
          </span>
        </div>
      )}
      <ul className="list-unstyled mb-0">
        {items.map((item) => (
          <li key={item.key} className="mb-2">
            <div className="d-flex justify-content-between gap-3 small">
              <span className="news-title">{item.label}</span>
              <span className="text-nowrap fw-semibold">{valueLabel(item)}</span>
            </div>
            <div className="progress" style={{ height: 10 }} role="img" aria-label={`${item.label}: ${valueLabel(item)}`}>
              {item.secondary !== undefined ? (
                <>
                  <div className="progress-bar bg-primary" style={{ width: `${(item.secondary / max) * 100}%` }} />
                  <div className="progress-bar bg-primary bg-opacity-25" style={{ width: `${((item.value - item.secondary) / max) * 100}%` }} />
                </>
              ) : (
                <div className="progress-bar bg-primary" style={{ width: `${(item.value / max) * 100}%` }} />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
