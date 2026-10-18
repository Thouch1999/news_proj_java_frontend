import { useState } from 'react'
import { Badge, Button, ButtonGroup, Nav } from 'react-bootstrap'
import { CheckCircle, ChevronRight, ClockHistory, FileText, Image, Inbox } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import AreaChart from '../common/AreaChart'
import BarList from '../common/BarList'
import DonutChart from '../common/DonutChart'
import { NEWS_STATUS } from '../../constants/newsStatus'
import { newsPath } from '../../constants/routes'
import { useFormat } from '../../hooks/useFormat'
import { useRemoteData } from '../../hooks/useRemoteData'
import * as reportService from '../../services/reportService'
import { mediaUrl } from '../../utils/mediaUrl'
import { DashCard, EmptyLine } from './DashboardParts'

// The cards the admin, editor and author dashboards are made of. Each one loads its own data (the reports of the
// backend already limit an author to their own articles), so a card that fails does not break the others.

const TOP_COUNT = 10
const ACTIVITY_COUNT = 8
const CATEGORY_COUNT = 8
const MONTH_FROM_DAYS = 92 // a range longer than this starts "per month"

// ---- views and published articles over the range ----

export function ViewsPublishedChart({ range }) {
  const { t } = useTranslation()
  const { formatDate, formatNumber, formatMonth, formatDay } = useFormat()
  const [override, setOverride] = useState(null)
  const interval = override ?? (range.days > MONTH_FROM_DAYS ? 'MONTH' : 'DAY')
  const key = `${interval}|${range.from}|${range.to}`
  const params = { interval, from: range.from, to: range.to }
  const views = useRemoteData(`views|${key}`, () => reportService.getViewsOverTime(params))
  const published = useRemoteData(`published|${key}`, () => reportService.getPublishedOverTime(params))

  const label = (period) => {
    if (interval === 'MONTH') {
      const [year, month] = period.split('-')
      return formatMonth(Number(year), Number(month))
    }
    return formatDay(period)
  }
  const publishedByPeriod = new Map((published.data?.points ?? []).map((point) => [point.period, point.count]))
  const points = (views.data?.points ?? []).map((point) => ({
    label: interval === 'DAY' ? formatDate(point.period) : label(point.period),
    short: label(point.period),
    a: point.count,
    b: publishedByPeriod.get(point.period) ?? 0,
  }))
  const empty = views.data && published.data && views.data.total === 0 && published.data.total === 0
  const names = { a: t('dashboard.overview.chart.views'), b: t('dashboard.overview.chart.published') }

  return (
    <DashCard
      title={t('dashboard.overview.chart.title')}
      loading={views.loading || published.loading}
      error={views.error || published.error}
      skeleton="chart"
      actions={
        <ButtonGroup size="sm" aria-label={t('dashboard.overview.chart.groupBy')}>
          <Button variant={interval === 'DAY' ? 'primary' : 'outline-primary'} aria-pressed={interval === 'DAY'} onClick={() => setOverride('DAY')}>
            {t('dashboard.overview.chart.perDay')}
          </Button>
          <Button variant={interval === 'MONTH' ? 'primary' : 'outline-primary'} aria-pressed={interval === 'MONTH'} onClick={() => setOverride('MONTH')}>
            {t('dashboard.overview.chart.perMonth')}
          </Button>
        </ButtonGroup>
      }
    >
      {empty && <EmptyLine icon={Inbox}>{t('dashboard.overview.chart.empty')}</EmptyLine>}
      {!empty && views.data && published.data && (
        <>
          <div className="d-flex flex-wrap gap-3 small mb-2">
            <span>
              <span className="legend-dot legend-dot--a" /> {names.a}: <strong>{formatNumber(views.data.total)}</strong>
            </span>
            <span>
              <span className="legend-dot legend-dot--b" /> {names.b}: <strong>{formatNumber(published.data.total)}</strong>
            </span>
          </div>
          <AreaChart
            points={points}
            seriesA={{ name: names.a }}
            seriesB={{ name: names.b }}
            ariaLabel={t('dashboard.overview.chart.aria', { views: formatNumber(views.data.total), published: formatNumber(published.data.total), from: formatDate(range.from), to: formatDate(range.to) })}
          />
        </>
      )}
    </DashCard>
  )
}

// ---- needs attention ----

// items: [{ key, icon, label, count, to }]. Everything at 0 shows "All caught up".
export function NeedsAttention({ items, loading, error }) {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  const open = items.filter((item) => item.count > 0)

  return (
    <DashCard title={t('dashboard.overview.attention.title')} loading={loading} error={error} skeleton="list">
      {open.length === 0 && <EmptyLine icon={CheckCircle}>{t('dashboard.overview.attention.caughtUp')}</EmptyLine>}
      {open.length > 0 && (
        <ul className="list-unstyled mb-0">
          {items.map(({ icon: Icon, ...item }) => (
            <li key={item.key}>
              <Link to={item.to} className={`attention-item d-flex align-items-center gap-3 ${item.count > 0 ? 'attention-item--open' : 'attention-item--none'}`}>
                <span className="stat-icon stat-icon--sm">
                  <Icon aria-hidden="true" />
                </span>
                <span className="flex-grow-1">{item.label}</span>
                <Badge bg={item.count > 0 ? 'warning' : 'secondary'} text={item.count > 0 ? 'dark' : undefined} pill>
                  {formatNumber(item.count)}
                </Badge>
                <ChevronRight aria-hidden="true" className="text-muted flex-shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashCard>
  )
}

// ---- articles by status ----

// counts: { DRAFT, PENDING, PUBLISHED, REJECTED, ARCHIVED }; each legend row opens the list filtered by that status
export function StatusDonut({ title, counts, loading, error, area }) {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  const segments = Object.values(NEWS_STATUS).map((status) => ({ key: status.value, label: t(status.labelKey), value: counts?.[status.value] ?? 0 }))
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)

  return (
    <DashCard title={title} loading={loading} error={error} skeleton="donut">
      {total === 0 && <EmptyLine icon={Inbox}>{t('dashboard.overview.status.empty')}</EmptyLine>}
      {total > 0 && (
        <>
          <DonutChart segments={segments} total={total} centerLabel={t('dashboard.overview.status.total')} ariaLabel={t('dashboard.overview.status.aria', { total: formatNumber(total) })} />
          <ul className="list-unstyled small mb-0 mt-3">
            {segments.map((segment) => (
              <li key={segment.key}>
                <Link to={`${area.listPath}?status=${segment.key}`} className="legend-row d-flex align-items-center gap-2">
                  <span className="legend-swatch" style={{ background: `var(--app-status-${segment.key.toLowerCase()})` }} />
                  <span className="flex-grow-1">{segment.label}</span>
                  <span className="fw-semibold">{formatNumber(segment.value)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </DashCard>
  )
}

// ---- news per category ----

export function CategoryBars() {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  const { data, error, loading } = useRemoteData('per-category', () => reportService.getNewsPerCategory())
  const items = (data ?? [])
    .filter((category) => category.newsCount > 0)
    .sort((a, b) => b.newsCount - a.newsCount || a.name.localeCompare(b.name))
    .slice(0, CATEGORY_COUNT)
    .map((category) => ({ key: category.categoryId, label: category.active ? category.name : t('dashboard.overview.category.inactive', { name: category.name }), value: category.newsCount }))

  return (
    <DashCard title={t('dashboard.overview.category.title')} loading={loading} error={error} skeleton="bars">
      {items.length === 0 && <EmptyLine icon={Inbox}>{t('dashboard.overview.category.empty')}</EmptyLine>}
      {items.length > 0 && <BarList items={items} valueLabel={(item) => formatNumber(item.value)} />}
    </DashCard>
  )
}

// ---- recent activity ----

// Which sentence an activity item is: created | backToDraft | PENDING | PUBLISHED | REJECTED | ARCHIVED | comment
function verbOf(item) {
  if (item.type === 'COMMENT') return 'comment'
  if (item.toStatus === 'DRAFT') return item.fromStatus ? 'backToDraft' : 'created'
  return item.toStatus
}

// Where an item leads: a comment and a published article to the article page, a submitted one to the review page of
// the role, everything else to the editor of the article
function pathOf(item, area) {
  if (item.type === 'COMMENT' || item.toStatus === 'PUBLISHED') return newsPath(item.newsSlug)
  if (item.toStatus === 'PENDING' && area.reviewPath) return area.reviewPath(item.newsId)
  return area.editPath(item.newsId)
}

export function RecentActivity({ area }) {
  const { t } = useTranslation()
  const { formatAgo, formatDateTime } = useFormat()
  const { data, error, loading } = useRemoteData('activity', () => reportService.getActivity({ limit: ACTIVITY_COUNT }))

  return (
    <DashCard title={t('dashboard.overview.activity.title')} loading={loading} error={error} skeleton="list">
      {data && data.length === 0 && <EmptyLine icon={ClockHistory}>{t('dashboard.overview.activity.empty')}</EmptyLine>}
      {data && data.length > 0 && (
        <ul className="timeline list-unstyled mb-0">
          {data.map((item) => (
            <li key={`${item.type}|${item.newsId}|${item.at}|${item.actorName}`}>
              <div className="small">
                <strong>{item.actorName}</strong> {t(`dashboard.overview.activity.verb.${verbOf(item)}`)}{' '}
                <Link to={pathOf(item, area)} className="news-title">
                  {item.newsTitle}
                </Link>
              </div>
              {item.snippet && <div className="small text-muted text-truncate">&ldquo;{item.snippet}&rdquo;</div>}
              <time className="small text-muted" dateTime={item.at} title={formatDateTime(item.at)}>
                {formatAgo(item.at)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </DashCard>
  )
}

// ---- top articles ----

function Thumbnail({ src }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <span className="top-thumb top-thumb--empty" aria-hidden="true">
        <Image />
      </span>
    )
  }
  return <img src={mediaUrl(src)} alt="" className="top-thumb" loading="lazy" onError={() => setFailed(true)} />
}

export function TopArticles({ range }) {
  const { t } = useTranslation()
  const { formatDate, formatNumber } = useFormat()
  const [tab, setTab] = useState('viewed')
  const key = `${tab}|${range.from}|${range.to}`
  const { data, error, loading } = useRemoteData(`top|${key}`, () => {
    const params = { limit: TOP_COUNT, from: range.from, to: range.to }
    return tab === 'viewed' ? reportService.getMostViewed(params) : reportService.getMostCommented(params)
  })
  const tabs = [
    { key: 'viewed', label: t('dashboard.overview.top.viewed') },
    { key: 'commented', label: t('dashboard.overview.top.commented') },
  ]

  return (
    <DashCard
      title={t('dashboard.overview.top.title')}
      loading={loading}
      error={error}
      skeleton="list"
      actions={
        <Nav variant="pills" className="gap-1" role="tablist" activeKey={tab} onSelect={(next) => next && setTab(next)}>
          {tabs.map((item) => (
            <Nav.Item key={item.key} role="presentation">
              <Nav.Link as="button" type="button" eventKey={item.key} role="tab" aria-selected={tab === item.key} className="py-1 px-2 small">
                {item.label}
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
      }
    >
      {data && data.length === 0 && <EmptyLine icon={FileText}>{t('dashboard.overview.top.empty')}</EmptyLine>}
      {data && data.length > 0 && (
        <ol className="list-unstyled mb-0" role="tabpanel">
          {data.map((article, index) => (
            <li key={article.id} className="top-row d-flex align-items-center gap-3">
              <span className="text-muted small top-rank">{index + 1}</span>
              <Thumbnail src={article.thumbnail} />
              <div className="flex-grow-1 min-w-0">
                <Link to={newsPath(article.slug)} className="news-title fw-semibold">
                  {article.title}
                </Link>
                <div className="text-muted small">
                  {article.categoryName} &middot; {article.authorName} &middot; {formatDate(article.publishedAt)}
                </div>
              </div>
              <div className="text-end flex-shrink-0">
                <div className="fw-semibold">{formatNumber(article.count)}</div>
                <div className="text-muted small">{tab === 'viewed' ? t('dashboard.overview.top.views') : t('dashboard.overview.top.comments')}</div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </DashCard>
  )
}
