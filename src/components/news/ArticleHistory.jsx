import { useState } from 'react'
import { Button } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import ErrorAlert from '../common/ErrorAlert'
import { useFormat } from '../../hooks/useFormat'
import StatusBadge from './StatusBadge'

// Timeline of the status changes of an article: from -> to, who, when (no seconds) and the note. Oldest first, or with
// `newestFirst` the latest on top; with `collapseAfter` only that many rows show, and a button shows all.
// `state` is what useNewsHistory returns.
export default function ArticleHistory({ state, newestFirst = false, collapseAfter = 0 }) {
  const { t } = useTranslation()
  const { formatFullDate } = useFormat()
  const [expanded, setExpanded] = useState(false)
  const { history, error, loading } = state

  if (loading) {
    return <p className="text-muted small mb-0">{t('news.history.loading')}</p>
  }
  if (error) {
    return <ErrorAlert error={error} />
  }
  if (!history || history.length === 0) {
    return <p className="text-muted small mb-0">{t('news.history.empty')}</p>
  }

  const rows = newestFirst ? [...history].reverse() : history
  const collapsed = collapseAfter > 0 && !expanded && rows.length > collapseAfter
  const shown = collapsed ? rows.slice(0, collapseAfter) : rows

  return (
    <>
    <ol className="list-unstyled mb-0 border-start ps-3">
      {shown.map((row) => (
        <li key={row.id} className="mb-3 position-relative">
          <div>
            {row.fromStatus ? (
              <>
                <StatusBadge status={row.fromStatus} /> <span aria-label={t('news.history.to')}>&rarr;</span> <StatusBadge status={row.toStatus} />
              </>
            ) : (
              <>
                <span className="small text-muted">{t('news.history.createdAs')}</span> <StatusBadge status={row.toStatus} />
              </>
            )}
          </div>
          <div className="small text-muted">
            {row.changedByName || t('news.history.unknownUser')} &middot; {formatFullDate(row.changedAt)}
          </div>
          {row.note && <div className="small">{row.note}</div>}
        </li>
      ))}
    </ol>
    {collapseAfter > 0 && rows.length > collapseAfter && (
      <Button variant="link" size="sm" className="p-0" aria-expanded={!collapsed} onClick={() => setExpanded((value) => !value)}>
        {collapsed ? t('news.history.showAll', { count: rows.length }) : t('news.history.showLess')}
      </Button>
    )}
    </>
  )
}
