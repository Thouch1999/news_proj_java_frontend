import { Col, Row } from 'react-bootstrap'
import { ChatDots, EyeSlash, Eye, FileText, HourglassSplit, People, PersonExclamation, ArrowReturnLeft } from 'react-bootstrap-icons'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../../constants/routes'
import { useDashboardRange } from '../../hooks/useDashboardRange'
import { useReviewCount } from '../../hooks/useReviewCount'
import { useRemoteData } from '../../hooks/useRemoteData'
import * as reportService from '../../services/reportService'
import DashboardHeader from './DashboardHeader'
import { KpiCard } from './DashboardParts'
import ActivityFeedCard from '../activity/ActivityFeedCard'
import UpcomingCard from './UpcomingCard'
import { CategoryBars, NeedsAttention, StatusDonut, TopArticles, ViewsPublishedChart } from './DashboardWidgets'

// The editor and admin dashboard. `area` comes from constants/articleAreas.js (it says where the review queue, the
// comments and the article list are). The date range of the header drives the trends, the chart and the top articles;
// the totals, the needs-attention list and the status chart are the situation now.
export default function StaffDashboard({ area }) {
  const { t } = useTranslation()
  const range = useDashboardRange()
  // a scheduled article went live (the Upcoming card saw it): the numbers are asked for again
  const [dueRound, setDueRound] = useState(0)
  const summary = useRemoteData(`summary|${dueRound}`, () => reportService.getSummary())
  const trends = useRemoteData(`trends|${range.from}|${range.to}`, () => reportService.getTrends(range))
  const data = summary.data
  const pending = data?.newsByStatus.PENDING ?? 0
  // the dashboard knows the number of pending articles: the sidebar badge takes it
  const { setCount } = useReviewCount()
  const known = data?.newsByStatus.PENDING
  useEffect(() => {
    if (known !== undefined) setCount(known)
  }, [known, setCount])
  const trend = (metric) => (trends.data ? { metric, current: trends.data.current[metric], previous: trends.data.previous[metric] } : undefined)
  const common = { loading: summary.loading, trendLoading: trends.loading }

  const cards = [
    area.admin && <KpiCard key="users" {...common} icon={People} label={t('dashboard.overview.kpi.users')} value={data?.totalUsers} trend={trend('newUsers')} />,
    <KpiCard key="news" {...common} icon={FileText} label={t('dashboard.overview.kpi.news')} value={data?.totalNews} trend={trend('published')} />,
    <KpiCard key="views" {...common} icon={Eye} label={t('dashboard.overview.kpi.views')} value={data?.totalViews} trend={trend('views')} />,
    <KpiCard key="comments" {...common} icon={ChatDots} label={t('dashboard.overview.kpi.comments')} value={data?.totalComments} trend={trend('comments')} />,
    <KpiCard
      key="pending"
      {...common}
      icon={HourglassSplit}
      label={t('dashboard.overview.kpi.pending')}
      value={pending}
      to={area.queuePath}
      highlight={pending > 0}
      hint={pending > 0 ? t('dashboard.overview.kpi.reviewNow') : t('dashboard.overview.kpi.pendingNone')}
    />,
  ].filter(Boolean)

  const attention = [
    { key: 'pending', icon: HourglassSplit, label: t('dashboard.overview.attention.pending'), count: pending, to: area.queuePath },
    { key: 'hidden', icon: EyeSlash, label: t('dashboard.overview.attention.hiddenComments'), count: data?.hiddenComments ?? 0, to: `${area.commentsPath}?status=HIDDEN` },
    { key: 'rejected', icon: ArrowReturnLeft, label: t('dashboard.overview.attention.rejected'), count: data?.newsByStatus.REJECTED ?? 0, to: `${area.listPath}?status=REJECTED` },
    area.admin && { key: 'unverified', icon: PersonExclamation, label: t('dashboard.overview.attention.unverified'), count: data?.unverifiedUsers ?? 0, to: `${ROUTES.ADMIN_USERS}?emailVerified=false` },
  ].filter(Boolean)

  return (
    <div>
      <DashboardHeader area={area} range={range} />
      <Row className={`g-3 mb-3 row-cols-1 row-cols-sm-2 row-cols-xl-${cards.length}`}>{cards}</Row>
      <Row className="g-3 mb-3">
        <Col xl={8}>
          <ViewsPublishedChart range={range} />
        </Col>
        <Col xl={4}>
          <NeedsAttention items={attention} loading={summary.loading} error={summary.error} />
        </Col>
      </Row>
      <Row className="g-3 mb-3">
        <Col lg={6}>
          <UpcomingCard area={area} onDue={() => setDueRound((value) => value + 1)} />
        </Col>
        <Col lg={6}>
          <ActivityFeedCard area={area} />
        </Col>
      </Row>
      <Row className="g-3 mb-3">
        <Col md={6}>
          <StatusDonut title={t('dashboard.overview.status.title')} counts={data?.newsByStatus} loading={summary.loading} error={summary.error} area={area} />
        </Col>
        <Col md={6}>
          <CategoryBars />
        </Col>
      </Row>
      <TopArticles range={range} />
    </div>
  )
}
