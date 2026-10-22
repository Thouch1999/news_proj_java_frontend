import { useEffect, useState } from 'react'
import { Button, Card, Spinner, Toast, ToastContainer } from 'react-bootstrap'
import { ClockHistory, Download } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorState } from '../common/ListStates'
import { ArticleFooter } from '../news/ArticleListParts'
import { ACTIVITY_PAGE_SIZES, TARGET_TYPES, actionsOfChoice, isActionChoice } from '../../constants/activity'
import { useActivityLog } from '../../hooks/useActivityLog'
import { useFormat } from '../../hooks/useFormat'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useRemoteData } from '../../hooks/useRemoteData'
import { useUrlKeyword } from '../../hooks/useUrlKeyword'
import * as activityLogService from '../../services/activityLogService'
import * as userService from '../../services/userService'
import { downloadBlob, groupByDate, isoDay, rangeChoice, rangeDays } from '../../utils/activity'
import { errorMessage } from '../../utils/errorMessage'
import { userName } from '../../utils/userName'
import ActivityDetailPanel from './ActivityDetailPanel'
import ActivityRow, { ActivitySkeleton } from './ActivityRow'
import ActivityToolbar from './ActivityToolbar'

const DEFAULT_SIZE = ACTIVITY_PAGE_SIZES[0]
const digits = (value) => (/^\d+$/.test(value ?? '') ? value : '')

// The activity log for the admin: who did what, and when. Newest first, grouped by day. Every filter, the page and the page
// size live in the URL:
//   ?keyword=cup&actorId=4&action=NEWS_PUBLISHED (or group:articles)&range=7d (today | 7d | 30d | custom&from=2026-03-01&to=2026-03-05)
//   &targetType=NEWS&targetId=12&page=2&size=50
// A click on a row opens the details in a panel. "Export CSV" downloads the entries that match the filters.
export default function ActivityLogView() {
  const { t } = useTranslation()
  const { formatNumber, formatDate } = useFormat()
  usePageMeta(t('activity.title'))
  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = useUrlKeyword()

  // ---- the filters of the URL (a wrong value is the same as none) ----
  const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1)
  const askedSize = parseInt(searchParams.get('size') ?? '', 10)
  const size = ACTIVITY_PAGE_SIZES.includes(askedSize) ? askedSize : DEFAULT_SIZE
  const actorId = digits(searchParams.get('actorId'))
  const askedAction = searchParams.get('action') ?? ''
  const action = isActionChoice(askedAction) ? askedAction : ''
  const rawFrom = searchParams.get('from') ?? ''
  const rawTo = searchParams.get('to') ?? ''
  const range = rangeChoice(searchParams.get('range') ?? '', rawFrom, rawTo)
  const days = rangeDays(range, rawFrom, rawTo)
  const askedType = searchParams.get('targetType') ?? ''
  const targetType = TARGET_TYPES.includes(askedType) ? askedType : ''
  const targetId = targetType ? digits(searchParams.get('targetId')) : ''
  const search = searchParams.get('keyword') ?? ''
  const rangeError = Boolean(days.from && days.to && days.from > days.to)

  const filters = {
    actorId,
    actions: actionsOfChoice(action),
    targetType,
    targetId,
    from: days.from,
    to: days.to,
    search,
  }
  const list = useActivityLog({ filters, page, size, enabled: !rangeError })
  const items = list.data?.items ?? []
  const groups = groupByDate(items)

  const change = (changes) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([name, value]) => (value === '' || value === undefined || value === null ? next.delete(name) : next.set(name, String(value))))
    if (!('page' in changes)) next.delete('page')
    setSearchParams(next)
  }
  const clearFilters = () => {
    const next = new URLSearchParams()
    if (size !== DEFAULT_SIZE) next.set('size', String(size))
    setSearchParams(next)
  }

  // the last page was emptied (a shorter list after a filter): go to the new last page
  useEffect(() => {
    if (list.data && items.length === 0 && page > 1) {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          next.set('page', String(Math.max(list.data.totalPages, 1)))
          return next
        },
        { replace: true },
      )
    }
  }, [list.data, items.length, page, setSearchParams])

  // ---- the people of the select: the users of the system (the first 100), with the role they have now ----
  const users = useRemoteData('activity-people', () => userService.listUsers({ size: 100 }).catch(() => ({ items: [] })))
  const people = (users.data?.items ?? []).map((user) => ({ id: user.id, name: userName(user), role: user.role }))

  const active = [actorId, action, range, search, targetType && targetId].filter(Boolean).length
  const filtered = active > 0
  const chip = targetType && targetId ? { text: t('activity.toolbar.targetChip', { type: t(`activity.targets.${targetType}`, { defaultValue: targetType }), id: targetId }), onRemove: () => change({ targetType: '', targetId: '' }) } : null

  // ---- the panel ----
  const [selected, setSelected] = useState(null)

  // ---- export ----
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState(null)
  const exportCsv = async () => {
    setExporting(true)
    try {
      const blob = await activityLogService.exportActivity(filters)
      downloadBlob(blob, `activity-log-${isoDay(new Date())}.csv`)
      setToast({ variant: 'success', text: t('activity.export.done') })
    } catch (caught) {
      setToast({ variant: 'danger', text: errorMessage(caught) || t('activity.export.failed') })
    } finally {
      setExporting(false)
    }
  }

  const dayLabel = (group) => (group.kind === 'date' ? formatDate(group.date) : t(`activity.days.${group.kind}`))

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h1 className="h4 mb-1">{t('activity.title')}</h1>
          <p className="text-muted small mb-0">{t('activity.intro')}</p>
        </div>
        <Button variant="outline-primary" size="sm" disabled={exporting || rangeError} onClick={exportCsv} title={t('activity.export.hint')}>
          {exporting ? <Spinner animation="border" size="sm" className="me-1" aria-hidden="true" /> : <Download className="me-1" aria-hidden="true" />}
          {exporting ? t('activity.export.working') : t('activity.export.button')}
        </Button>
      </div>

      <Card className="article-card activity-page">
        <ActivityToolbar
          values={{ actorId, action, range, from: rawFrom, to: rawTo }}
          keyword={keyword}
          people={people}
          rangeError={rangeError}
          active={active}
          chip={chip}
          onChange={change}
          onClear={clearFilters}
        />

        {list.loading && <ActivitySkeleton rows={6} />}
        {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
        {list.data && items.length === 0 && page === 1 && (
          <EmptyState icon={ClockHistory} text={t(filtered ? 'activity.empty.filtered' : 'activity.empty.none')}>
            {filtered && (
              <Button variant="outline-primary" size="sm" onClick={clearFilters}>
                {t('news.list.toolbar.clear')}
              </Button>
            )}
          </EmptyState>
        )}
        {groups.map((group) => (
          <section key={group.key} aria-label={dayLabel(group)}>
            <h2 className="notif-day">{dayLabel(group)}</h2>
            <ul className="activity-list">
              {group.items.map((entry) => (
                <ActivityRow key={entry.id} entry={entry} selected={selected?.id === entry.id} onOpen={setSelected} />
              ))}
            </ul>
          </section>
        ))}
        {list.data && list.data.totalElements > 0 && (
          <ArticleFooter result={list.data} size={size} sizes={ACTIVITY_PAGE_SIZES} onPage={(next) => change({ page: next })} onSize={(value) => change({ size: value === DEFAULT_SIZE ? '' : value })} />
        )}
      </Card>
      <span className="visually-hidden" aria-live="polite">
        {list.data ? t('activity.summary', { count: list.data.totalElements, formatted: formatNumber(list.data.totalElements) }) : ''}
      </span>

      <ActivityDetailPanel entry={selected} onClose={() => setSelected(null)} />

      <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 2000 }}>
        <Toast bg={toast?.variant ?? 'success'} show={Boolean(toast)} onClose={() => setToast(null)} delay={5000} autohide>
          <Toast.Body className="text-white d-flex justify-content-between gap-3">
            <span>{toast?.text}</span>
            <button type="button" className="btn-close btn-close-white" aria-label={t('common.actions.close')} onClick={() => setToast(null)} />
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  )
}
