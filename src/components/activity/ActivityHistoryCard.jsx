import { useState } from 'react'
import { Card } from 'react-bootstrap'
import { ClockHistory } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ErrorState } from '../common/ListStates'
import { HISTORY_CARD_SIZE } from '../../constants/activity'
import { ROUTES } from '../../constants/routes'
import { useFormat } from '../../hooks/useFormat'
import { useRemoteData } from '../../hooks/useRemoteData'
import * as activityLogService from '../../services/activityLogService'
import ActivityDetailPanel from './ActivityDetailPanel'
import ActivityRow, { ActivitySkeleton } from './ActivityRow'

// "Activity" on the page of an article and of a user (admin only): the latest entries about that target, with the same
// rows and the same side panel as the activity log. `types` are the target types to read (an article: ['NEWS']; a user:
// ['USER', 'AUTH'], the changes to the account and the sign-ins); the entries of all of them are mixed, newest first.
// `refreshKey` loads the card again when it changes (the article was saved). "View all" opens the log filtered on the target.
export default function ActivityHistoryCard({ types, id, refreshKey = '', title }) {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  const [tick, setTick] = useState(0)
  const [selected, setSelected] = useState(null)
  const key = `${types.join(',')}|${id}|${refreshKey}|${tick}`
  const { data, error, loading } = useRemoteData(key, () =>
    Promise.all(types.map((type) => activityLogService.listTargetActivity(type, id, { size: HISTORY_CARD_SIZE }))).then((pages) => ({
      items: pages
        .flatMap((result) => result.items)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt) || b.id - a.id)
        .slice(0, HISTORY_CARD_SIZE),
      total: pages.reduce((sum, result) => sum + result.totalElements, 0),
    })),
  )

  return (
    <Card className="activity-card">
      <Card.Header className="bg-surface d-flex flex-wrap justify-content-between align-items-center gap-2">
        <h2 className="h6 mb-0">{title ?? t('activity.card.title')}</h2>
        {data && data.total > 0 && <span className="small text-muted">{formatNumber(data.total)}</span>}
      </Card.Header>
      <Card.Body className="p-0">
        {loading && <ActivitySkeleton rows={3} />}
        {error && <ErrorState error={error} onRetry={() => setTick((value) => value + 1)} />}
        {data && data.items.length === 0 && (
          <p className="d-flex align-items-center gap-2 text-muted small px-3 py-3 mb-0">
            <ClockHistory aria-hidden="true" />
            {t('activity.card.empty')}
          </p>
        )}
        {data && data.items.length > 0 && (
          <ul className="activity-list">
            {data.items.map((entry) => (
              <ActivityRow key={entry.id} entry={entry} selected={selected?.id === entry.id} onOpen={setSelected} />
            ))}
          </ul>
        )}
      </Card.Body>
      {data && data.total > data.items.length && (
        <Card.Footer className="bg-surface">
          <Link to={`${ROUTES.ADMIN_ACTIVITY_LOG}?targetType=${types[0]}&targetId=${id}`} className="small">
            {t('activity.card.viewAll', { count: data.total, formatted: formatNumber(data.total) })}
          </Link>
        </Card.Footer>
      )}
      <ActivityDetailPanel entry={selected} onClose={() => setSelected(null)} />
    </Card>
  )
}
