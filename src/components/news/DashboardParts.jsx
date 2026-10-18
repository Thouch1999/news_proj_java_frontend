import { Alert, Card, Col, Placeholder } from 'react-bootstrap'
import { ArrowDownShort, ArrowUpShort, Dash } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useFormat } from '../../hooks/useFormat'
import { errorMessage } from '../../utils/errorMessage'
import { trendOf } from '../../utils/dashboardRange'

// The building blocks of the dashboards (admin, editor and author): a card that loads and fails on its own, the one-line
// empty state and the KPI card with its trend.

// One short line with an icon, for a card that has nothing to show (no big empty box)
export function EmptyLine({ icon: Icon, children }) {
  return (
    <div className="d-flex align-items-center gap-2 text-muted small py-2">
      <Icon aria-hidden="true" className="flex-shrink-0" />
      <span>{children}</span>
    </div>
  )
}

// What a card shows while its data loads: grey blocks in the shape of the content
function CardSkeleton({ kind }) {
  const { t } = useTranslation()
  return (
    <div role="status">
      <span className="visually-hidden">{t('common.loading')}</span>
      <Placeholder as="div" animation="glow" aria-hidden="true">
        {kind === 'chart' && <Placeholder xs={12} className="rounded d-block" style={{ height: 190 }} />}
        {kind === 'donut' && <Placeholder className="rounded-circle d-block mx-auto" style={{ width: 150, height: 150 }} />}
        {kind === 'list' &&
          [0, 1, 2, 3].map((row) => (
            <div key={row} className="d-flex align-items-center gap-3 mb-3">
              <Placeholder className="rounded flex-shrink-0" style={{ width: 36, height: 36 }} />
              <div className="flex-grow-1">
                <Placeholder xs={9} className="d-block mb-1" />
                <Placeholder xs={5} size="xs" className="d-block" />
              </div>
            </div>
          ))}
        {kind === 'bars' &&
          [10, 8, 6, 5].map((width) => (
            <div key={width} className="mb-3">
              <Placeholder xs={width} size="sm" className="d-block mb-1" />
              <Placeholder xs={12} size="xs" className="d-block" />
            </div>
          ))}
      </Placeholder>
    </div>
  )
}

// A dashboard card with a title. `loading` shows the skeleton and `error` a short message in the card, so one card that
// fails does not touch the others. `skeleton` is the shape of the skeleton: chart | donut | list | bars.
export function DashCard({ title, actions, link, loading, error, skeleton = 'list', className = '', children }) {
  return (
    <Card className={`dash-card h-100 ${className}`}>
      <Card.Header className="d-flex flex-wrap justify-content-between align-items-center gap-2 bg-surface py-2">
        <h2 className="h6 mb-0">{title}</h2>
        {actions}
        {link}
      </Card.Header>
      <Card.Body>
        {loading && <CardSkeleton kind={skeleton} />}
        {!loading && error && (
          <Alert variant="danger" className="py-2 mb-0 small" role="alert">
            {errorMessage(error)}
          </Alert>
        )}
        {!loading && !error && children}
      </Card.Body>
    </Card>
  )
}

// "up 12% vs previous period" (green up, red down, grey no change), or "No previous data"
function TrendLine({ current, previous, loading, detail }) {
  const { t } = useTranslation()
  const { formatPercent } = useFormat()
  if (loading) {
    return (
      <Placeholder as="div" animation="glow" aria-hidden="true">
        <Placeholder xs={8} size="sm" />
      </Placeholder>
    )
  }
  const trend = trendOf(current, previous)
  if (trend.kind === 'none') return <span className="text-muted">{t('dashboard.overview.trend.none')}</span>
  const Icon = { up: ArrowUpShort, down: ArrowDownShort, flat: Dash }[trend.kind]
  return (
    <span className={`kpi-trend kpi-trend--${trend.kind}`} title={detail}>
      <Icon aria-hidden="true" className="flex-shrink-0" />
      <span className="fw-semibold">
        {trend.kind === 'flat' ? t('dashboard.overview.trend.flat') : <><span className="visually-hidden">{t(`dashboard.overview.trend.${trend.kind}`)} </span>{formatPercent(trend.percent)}</>}
      </span>
      <span className="text-muted">{t('dashboard.overview.trend.vs')}</span>
    </span>
  )
}

// A compact KPI card: icon, number, label and a trend against the previous period. `trend` is { current, previous,
// metric } (metric: newUsers | published | views | comments) or left out. `hint` replaces the trend with a short text.
// With `to` the whole card is a link; `highlight` gives it the warning colours.
export function KpiCard({ icon: Icon, label, value, loading, trend, trendLoading, hint, to, highlight = false }) {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  const detail = trend
    ? t('dashboard.overview.trend.detail', {
        metric: t(`dashboard.overview.trend.metric.${trend.metric}`),
        current: formatNumber(trend.current),
        previous: formatNumber(trend.previous ?? 0),
      })
    : undefined
  const labelNode = to ? (
    <Link to={to} className="stretched-link text-decoration-none text-reset">
      {label}
    </Link>
  ) : (
    label
  )

  return (
    <Col>
      <Card className={`kpi-card h-100 ${highlight ? 'stat-card--highlight' : ''} ${to ? 'kpi-card--link' : ''}`}>
        <Card.Body className="p-3">
          <div className="d-flex align-items-center gap-3">
            <span className="stat-icon">
              <Icon aria-hidden="true" />
            </span>
            <div className="min-w-0">
              {loading ? (
                <Placeholder as="div" animation="glow" aria-hidden="true">
                  <Placeholder xs={6} size="lg" className="d-block mb-1" />
                  <Placeholder xs={9} size="sm" className="d-block" />
                </Placeholder>
              ) : (
                <>
                  <div className="kpi-value fw-semibold lh-1">{formatNumber(value)}</div>
                  <div className="text-muted small mt-1">{labelNode}</div>
                </>
              )}
            </div>
          </div>
          <div className="small mt-2">
            {hint ? (
              <span className="text-muted">{hint}</span>
            ) : trend || trendLoading || loading ? (
              <TrendLine current={trend?.current} previous={trend?.previous} loading={loading || trendLoading} detail={detail} />
            ) : null}
          </div>
        </Card.Body>
      </Card>
    </Col>
  )
}
