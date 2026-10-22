import { ClockHistory } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { FEED_SIZE } from '../../constants/activity'
import { ROUTES } from '../../constants/routes'
import { useRemoteData } from '../../hooks/useRemoteData'
import * as activityLogService from '../../services/activityLogService'
import { DashCard, EmptyLine } from '../news/DashboardParts'
import { ActivitySentence, EntryTime, KindIcon } from './ActivityRow'

// The articles that are gone have no editor to link to
const NO_LINK = new Set(['NEWS_DELETED'])

// The dashboard card "Recent activity" of the admin and the editor: the latest actions on articles and comments (the
// activity log, without sign-ins, users or settings), each as a sentence with the time. An article is a link to its editor.
// The admin also has "View all" (the activity log). `area` comes from constants/articleAreas.js.
export default function ActivityFeedCard({ area }) {
  const { t } = useTranslation()
  const { data, error, loading } = useRemoteData('activity-feed', () => activityLogService.getRecentActivity({ limit: FEED_SIZE }))

  return (
    <DashCard
      title={t('dashboard.overview.activity.title')}
      loading={loading}
      error={error}
      skeleton="list"
      link={
        area.admin && (
          <Link to={ROUTES.ADMIN_ACTIVITY_LOG} className="small">
            {t('activity.card.seeAll')}
          </Link>
        )
      }
    >
      {data && data.length === 0 && <EmptyLine icon={ClockHistory}>{t('dashboard.overview.activity.empty')}</EmptyLine>}
      {data && data.length > 0 && (
        <ul className="activity-feed list-unstyled mb-0">
          {data.map((entry) => {
            const linked = entry.targetType === 'NEWS' && entry.targetId && !NO_LINK.has(entry.action)
            return (
              <li key={entry.id}>
                <KindIcon action={entry.action} details={entry.details} />
                <div className="min-w-0">
                  <div className="small">
                    <ActivitySentence entry={entry} targetLink={linked ? <Link to={area.editPath(entry.targetId)} className="news-title activity-target" /> : undefined} />
                  </div>
                  <EntryTime entry={entry} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </DashCard>
  )
}
