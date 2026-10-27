import { useState } from 'react'
import { Clock } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useFormat } from '../../hooks/useFormat'
import { useNow } from '../../hooks/useNow'
import { useRefreshWhenDue } from '../../hooks/useRefreshWhenDue'
import { useRemoteData } from '../../hooks/useRemoteData'
import * as newsService from '../../services/newsService'
import { AuthorCell } from './ArticleListParts'
import { DashCard, EmptyLine } from './DashboardParts'

// The dashboard card "Upcoming" of the editor and the admin: the next scheduled articles (go-live time, title, author)
// with a link to the Scheduled tab of the article list. `area` comes from constants/articleAreas.js. `onDue` is called after
// the time of the first one has come, when the backend has published it (the dashboard then loads its numbers again).
export default function UpcomingCard({ area, onDue }) {
  const { t } = useTranslation()
  const { formatSchedule, formatUntil } = useFormat()
  const now = useNow()
  const [reload, setReload] = useState(0)
  const { data, error, loading } = useRemoteData(`upcoming|${reload}`, () => newsService.listUpcomingNews())

  useRefreshWhenDue((data ?? []).map((article) => article.scheduledAt).filter(Boolean), () => {
    setReload((value) => value + 1)
    onDue?.()
  })

  return (
    <DashCard
      title={t('dashboard.overview.upcoming.title')}
      loading={loading}
      error={error}
      skeleton="list"
      link={
        <Link to={`${area.listPath}?status=SCHEDULED`} className="small">
          {t('dashboard.overview.upcoming.seeAll')}
        </Link>
      }
    >
      {data && data.length === 0 && <EmptyLine icon={Clock}>{t('dashboard.overview.upcoming.empty')}</EmptyLine>}
      {data && data.length > 0 && (
        <ul className="upcoming-list list-unstyled mb-0">
          {data.map((article) => (
            <li key={article.id}>
              <div className="upcoming-time small">
                <Clock aria-hidden="true" />
                <time dateTime={article.scheduledAt}>{formatSchedule(article.scheduledAt)}</time>
                <span className="text-muted">({formatUntil(article.scheduledAt, now)})</span>
              </div>
              <Link to={area.editPath(article.id)} className="news-title d-block text-truncate" title={article.title}>
                {article.title}
              </Link>
              <div className="small text-muted">
                <AuthorCell name={article.authorName} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashCard>
  )
}
