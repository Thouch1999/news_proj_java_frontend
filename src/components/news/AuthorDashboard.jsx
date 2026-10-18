import { Col, Row } from 'react-bootstrap'
import { ArrowReturnLeft, ChatDots, Eye, FileText, HourglassSplit, PencilSquare } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { ARTICLE_AREAS } from '../../constants/articleAreas'
import { useDashboardRange } from '../../hooks/useDashboardRange'
import { useRemoteData } from '../../hooks/useRemoteData'
import * as reportService from '../../services/reportService'
import DashboardHeader from './DashboardHeader'
import { KpiCard } from './DashboardParts'
import { NeedsAttention, RecentActivity, StatusDonut, TopArticles, ViewsPublishedChart } from './DashboardWidgets'

const area = ARTICLE_AREAS.author

// The author's own dashboard: the same cards as the editor's, with only the author's articles, views and comments (the
// reports of the backend limit an author to their own).
export default function AuthorDashboard() {
  const { t } = useTranslation()
  const range = useDashboardRange()
  const mine = useRemoteData('author-dashboard', () => reportService.getAuthorDashboard())
  const trends = useRemoteData(`trends|${range.from}|${range.to}`, () => reportService.getTrends(range))
  const data = mine.data
  const pending = data?.newsByStatus.PENDING ?? 0
  const rejected = data?.newsByStatus.REJECTED ?? 0
  const drafts = data?.newsByStatus.DRAFT ?? 0
  const trend = (metric) => (trends.data ? { metric, current: trends.data.current[metric], previous: trends.data.previous[metric] } : undefined)
  const common = { loading: mine.loading, trendLoading: trends.loading }

  const attention = [
    { key: 'rejected', icon: ArrowReturnLeft, label: t('dashboard.overview.attention.myRejected'), count: rejected, to: `${area.listPath}?status=REJECTED` },
    { key: 'drafts', icon: PencilSquare, label: t('dashboard.overview.attention.drafts'), count: drafts, to: `${area.listPath}?status=DRAFT` },
  ]

  return (
    <div>
      <DashboardHeader area={area} range={range} />
      <Row className="g-3 mb-3 row-cols-1 row-cols-sm-2 row-cols-xl-5">
        <KpiCard {...common} icon={FileText} label={t('dashboard.overview.kpi.myArticles')} value={data?.totalNews} trend={trend('published')} to={area.listPath} />
        <KpiCard {...common} icon={Eye} label={t('dashboard.overview.kpi.views')} value={data?.totalViews} trend={trend('views')} />
        <KpiCard {...common} icon={ChatDots} label={t('dashboard.overview.kpi.comments')} value={data?.totalComments} trend={trend('comments')} />
        <KpiCard
          {...common}
          icon={HourglassSplit}
          label={t('dashboard.overview.kpi.pending')}
          value={pending}
          to={`${area.listPath}?status=PENDING`}
          hint={pending > 0 ? t('dashboard.overview.kpi.pendingMine') : t('dashboard.overview.kpi.pendingNone')}
        />
        <KpiCard
          {...common}
          icon={ArrowReturnLeft}
          label={t('dashboard.overview.kpi.rejected')}
          value={rejected}
          to={`${area.listPath}?status=REJECTED`}
          highlight={rejected > 0}
          hint={rejected > 0 ? t('dashboard.overview.kpi.fixNow') : t('dashboard.overview.kpi.rejectedNone')}
        />
      </Row>
      <Row className="g-3 mb-3">
        <Col xl={8}>
          <ViewsPublishedChart range={range} />
        </Col>
        <Col xl={4}>
          <NeedsAttention items={attention} loading={mine.loading} error={mine.error} />
        </Col>
      </Row>
      <Row className="g-3 mb-3">
        <Col md={6} xl={5}>
          <StatusDonut title={t('dashboard.overview.status.myTitle')} counts={data?.newsByStatus} loading={mine.loading} error={mine.error} area={area} />
        </Col>
        <Col md={6} xl={7}>
          <RecentActivity area={area} />
        </Col>
      </Row>
      <TopArticles range={range} />
    </div>
  )
}
