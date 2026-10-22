import { useState } from 'react'
import { Badge, Offcanvas, Placeholder, Table } from 'react-bootstrap'
import { ArrowRight, BoxArrowUpRight } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ErrorState } from '../common/ListStates'
import { RoleBadge } from '../common/UserParts'
import { ROUTES, adminNewsPath, adminUserPath } from '../../constants/routes'
import { useFormat } from '../../hooks/useFormat'
import { useRemoteData } from '../../hooks/useRemoteData'
import * as activityLogService from '../../services/activityLogService'
import * as categoryService from '../../services/categoryService'
import * as newsService from '../../services/newsService'
import * as tagService from '../../services/tagService'
import * as userService from '../../services/userService'
import { browserLabel, changeRows } from '../../utils/activity'
import { ActivitySentence, ActorAvatar, EntryTime } from './ActivityRow'

// The actions after which the target is gone
const DELETED_ACTIONS = new Set(['NEWS_DELETED', 'COMMENT_DELETED', 'CATEGORY_DELETED', 'TAG_DELETED'])

// Does the target of an entry still exist, and where is it? { state: 'exists' | 'deleted' | 'unknown' | 'none', path }.
// The log keeps the title and the name as they were; this asks the backend whether the thing is still there.
async function findTarget(entry) {
  const { targetType, targetId, action, details } = entry
  if (DELETED_ACTIONS.has(action)) return { state: 'deleted', path: null }
  if (targetType === 'SETTINGS') return { state: 'exists', path: ROUTES.ADMIN_SETTINGS }
  if (targetType === 'COMMENT') {
    // there is no call for one comment: link to the comments of its article
    return { state: 'unknown', path: details?.newsId ? `${ROUTES.ADMIN_COMMENTS}?newsId=${details.newsId}` : ROUTES.ADMIN_COMMENTS }
  }
  if (!targetId) return { state: 'none', path: null }
  try {
    if (targetType === 'NEWS') {
      await newsService.getManagedNews(targetId)
      return { state: 'exists', path: adminNewsPath(targetId) }
    }
    if (targetType === 'USER' || targetType === 'AUTH') {
      await userService.getUser(targetId)
      return { state: 'exists', path: adminUserPath(targetId) }
    }
    if (targetType === 'CATEGORY') {
      const found = (await categoryService.listCategoriesForAdmin())?.some((category) => category.id === targetId)
      return found ? { state: 'exists', path: ROUTES.ADMIN_CATEGORIES } : { state: 'deleted', path: null }
    }
    if (targetType === 'TAG') {
      const found = (await tagService.listTags())?.some((tag) => tag.id === targetId)
      return found ? { state: 'exists', path: ROUTES.ADMIN_TAGS } : { state: 'deleted', path: null }
    }
  } catch (error) {
    return error?.code === 404 ? { state: 'deleted', path: null } : { state: 'unknown', path: null }
  }
  return { state: 'unknown', path: null }
}

// The target: its name as it was, a link when it still exists, a "Deleted" badge when it does not
function TargetValue({ entry }) {
  const { t } = useTranslation()
  const { data, loading } = useRemoteData(`target|${entry.id}`, () => findTarget(entry))
  const label = entry.targetLabel || t('activity.unknownTarget')
  return (
    <span className="d-inline-flex flex-wrap align-items-center gap-2">
      <span className="activity-target">{label}</span>
      {loading && <Placeholder animation="glow" as="span"><Placeholder xs={3} style={{ width: 56 }} /></Placeholder>}
      {data?.state === 'deleted' && (
        <Badge bg="" className="activity-deleted">
          {t('activity.panel.deleted')}
        </Badge>
      )}
      {data?.path && (
        <Link to={data.path} className="small d-inline-flex align-items-center gap-1">
          {t('activity.panel.open')}
          <BoxArrowUpRight aria-hidden="true" />
        </Link>
      )}
    </span>
  )
}

function Fact({ label, children }) {
  return (
    <div className="activity-fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

// The before -> after table of the fields that changed. A row with a note is a text on its own; a row without "before" is a
// value that was set.
function ChangesTable({ rows }) {
  const { t } = useTranslation()
  return (
    <section aria-labelledby="activity-changes-title" className="mt-4">
      <h3 id="activity-changes-title" className="h6">
        {t('activity.panel.changes')}
      </h3>
      <div className="table-responsive">
        <Table size="sm" className="activity-changes align-middle mb-0">
          <thead>
            <tr>
              <th scope="col">{t('activity.panel.field')}</th>
              <th scope="col">{t('activity.panel.before')}</th>
              <th scope="col" aria-label={t('activity.panel.to')} />
              <th scope="col">{t('activity.panel.after')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.label}|${index}`}>
                <th scope="row" className={row.mono ? 'font-monospace small' : undefined}>
                  {row.label}
                </th>
                {row.note ? (
                  <td colSpan={3} className="text-muted">
                    {row.note}
                  </td>
                ) : (
                  <>
                    <td className="activity-before">{row.before || <span className="text-muted">&ndash;</span>}</td>
                    <td className="text-muted text-center">{row.after ? <ArrowRight aria-hidden="true" /> : null}</td>
                    <td className="activity-after">{row.after || <span className="text-muted">&ndash;</span>}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </section>
  )
}

function PanelSkeleton() {
  const { t } = useTranslation()
  return (
    <div role="status">
      <span className="visually-hidden">{t('common.loading')}</span>
      <Placeholder as="div" animation="glow" aria-hidden="true">
        {[10, 6, 8, 5, 9].map((width) => (
          <div key={width} className="mb-3">
            <Placeholder xs={3} size="sm" className="d-block mb-1" />
            <Placeholder xs={width} className="d-block" />
          </div>
        ))}
      </Placeholder>
    </div>
  )
}

// The side panel with everything about one entry: who (with the role at that time), when, the address and the browser, the
// target and what changed. `entry` is the row that was clicked (the list has no details, so the entry is read again).
function PanelContent({ entry }) {
  const { t } = useTranslation()
  const { formatDateTime } = useFormat()
  const [tick, setTick] = useState(0)
  const { data, error, loading } = useRemoteData(`entry|${entry.id}|${tick}`, () => activityLogService.getActivityEntry(entry.id))
  const full = data ?? entry
  const roles = (full.actorRoles ?? '').split(',').map((role) => role.trim()).filter(Boolean)
  const browser = browserLabel(full.userAgent)
  const rows = data ? changeRows(t, data) : []

  return (
    <>
      <Offcanvas.Header closeButton closeLabel={t('common.actions.close')} className="align-items-start">
        <div className="min-w-0 pe-3">
          <Offcanvas.Title as="h2" id="activity-panel-title" className="h5 mb-2">
            {t(`activity.actions.${entry.action}`, { defaultValue: entry.action })}
          </Offcanvas.Title>
          <div className="activity-panel__sentence">
            <ActivitySentence entry={full} />
          </div>
        </div>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <dl className="activity-facts">
          <Fact label={t('activity.panel.who')}>
            {full.actorId || full.actorName ? (
              <span className="d-flex flex-wrap align-items-center gap-2">
                <ActorAvatar entry={full} />
                <span className="d-flex flex-column">
                  <span className="fw-semibold">{full.actorName || t('activity.system')}</span>
                  {full.actorId && (
                    <Link to={adminUserPath(full.actorId)} className="small">
                      {t('activity.panel.viewUser')}
                    </Link>
                  )}
                </span>
                {roles.map((role) => (
                  <RoleBadge key={role} role={role} />
                ))}
              </span>
            ) : (
              <span className="text-muted">{t('activity.panel.nobody')}</span>
            )}
            {roles.length > 0 && <div className="small text-muted mt-1">{t('activity.panel.roleAtTime')}</div>}
          </Fact>
          <Fact label={t('activity.panel.when')}>
            <time dateTime={full.createdAt}>{formatDateTime(full.createdAt)}</time>
            <span className="text-muted"> &middot; </span>
            <EntryTime entry={full} />
          </Fact>
          <Fact label={t('activity.panel.ip')}>{full.ipAddress ? <span className="font-monospace" dir="ltr">{full.ipAddress}</span> : <span className="text-muted">&ndash;</span>}</Fact>
          <Fact label={t('activity.panel.browser')}>
            {full.userAgent ? (
              <>
                {browser && <div>{browser}</div>}
                <div className="small text-muted activity-agent" dir="ltr">
                  {full.userAgent}
                </div>
              </>
            ) : (
              <span className="text-muted">&ndash;</span>
            )}
          </Fact>
          <Fact label={`${t('activity.panel.target')} (${t(`activity.targets.${full.targetType}`, { defaultValue: full.targetType })})`}>
            {/* looked up with the details (a comment is found through the article in its details) */}
            {loading ? <Placeholder as="span" animation="glow"><Placeholder xs={6} style={{ width: 160 }} /></Placeholder> : <TargetValue entry={full} />}
          </Fact>
          <Fact label={t('activity.panel.entry')}>
            <span className="text-muted">#{full.id}</span>
          </Fact>
        </dl>

        {loading && <PanelSkeleton />}
        {error && <ErrorState error={error} onRetry={() => setTick((value) => value + 1)} />}
        {data && rows.length > 0 && <ChangesTable rows={rows} />}
        {data && rows.length === 0 && <p className="text-muted small mt-4 mb-0">{t('activity.panel.noChanges')}</p>}
      </Offcanvas.Body>
    </>
  )
}

// `entry` null: closed. The panel opens inside the dashboard, like the quick review panel.
export default function ActivityDetailPanel({ entry, onClose }) {
  return (
    <Offcanvas show={Boolean(entry)} placement="end" container={() => document.querySelector('.dashboard-shell')} onHide={onClose} className="activity-panel" aria-labelledby="activity-panel-title">
      {entry && <PanelContent key={entry.id} entry={entry} />}
    </Offcanvas>
  )
}
