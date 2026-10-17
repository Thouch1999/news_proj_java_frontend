import ErrorAlert from '../common/ErrorAlert'
import StatusBadge from './StatusBadge'

// Timeline of the status changes of an article (oldest first): from -> to, who, when and the note.
// `state` is what useNewsHistory returns.
export default function ArticleHistory({ state }) {
  const { history, error, loading } = state

  if (loading) {
    return <p className="text-muted small mb-0">Loading history...</p>
  }
  if (error) {
    return <ErrorAlert error={error} />
  }
  if (!history || history.length === 0) {
    return <p className="text-muted small mb-0">No status changes yet.</p>
  }

  return (
    <ol className="list-unstyled mb-0 border-start ps-3">
      {history.map((row) => (
        <li key={row.id} className="mb-3 position-relative">
          <div>
            {row.fromStatus ? (
              <>
                <StatusBadge status={row.fromStatus} /> <span aria-label="to">&rarr;</span> <StatusBadge status={row.toStatus} />
              </>
            ) : (
              <>
                <span className="small text-muted">Created as</span> <StatusBadge status={row.toStatus} />
              </>
            )}
          </div>
          <div className="small text-muted">
            {row.changedByName || 'Unknown user'} &middot; {row.changedAt ? new Date(row.changedAt).toLocaleString() : ''}
          </div>
          {row.note && <div className="small">{row.note}</div>}
        </li>
      ))}
    </ol>
  )
}
