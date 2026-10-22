import { useEffect } from 'react'
import { Button, Card } from 'react-bootstrap'
import { Bell, CheckAll } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorState } from '../common/ListStates'
import SectionTitle from '../common/SectionTitle'
import { ArticleFooter, StatusTabs } from '../news/ArticleListParts'
import { PAGE_SIZES } from '../../constants/notifications'
import { useFormat } from '../../hooks/useFormat'
import { useNotificationList } from '../../hooks/useNotificationList'
import { useNotifications } from '../../hooks/useNotifications'
import { usePageMeta } from '../../hooks/usePageMeta'
import { groupByDay } from '../../utils/notifications'
import NotificationItem, { NotificationSkeleton } from './NotificationItem'

const DEFAULT_SIZE = PAGE_SIZES[0]

// All the notifications of the logged-in user: tabs All / Unread with counts, the items grouped by day, "Mark all as
// read", delete with an undo toast (see NotificationProvider), the page size and the pages. The tab, page and size
// live in the URL: ?filter=unread&page=2&size=20. `area` is 'dashboard' (staff, inside the dashboard layout) or
// 'public' (readers, in the public layout).
export default function NotificationsView({ area }) {
  const { t } = useTranslation()
  const { formatNumber, formatDate } = useFormat()
  usePageMeta(t('notifications.title'))
  const { unreadCount, hiddenIds, pendingCount, markRead, markAllRead, remove } = useNotifications()
  const [searchParams, setSearchParams] = useSearchParams()
  const filter = searchParams.get('filter') === 'unread' ? 'unread' : 'all'
  const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1)
  const askedSize = parseInt(searchParams.get('size') ?? '', 10)
  const size = PAGE_SIZES.includes(askedSize) ? askedSize : DEFAULT_SIZE

  const list = useNotificationList({ filter, page, size })
  const totals = useNotificationList({ filter: 'all', page: 1, size: 1 }) // the number on the All tab
  const items = (list.data?.items ?? []).filter((item) => !hiddenIds.has(item.id))
  const groups = groupByDay(items)

  const change = (changes) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([name, value]) => (value === '' || value === undefined || value === null ? next.delete(name) : next.set(name, String(value))))
    if (!('page' in changes)) next.delete('page')
    setSearchParams(next)
  }

  // the last page was emptied (everything on it deleted or read in the Unread tab): go to the new last page
  useEffect(() => {
    if (list.data && items.length === 0 && page > 1) {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          next.set('page', String(Math.max(page > list.data.totalPages ? list.data.totalPages : page - 1, 1)))
          return next
        },
        { replace: true },
      )
    }
  }, [list.data, items.length, page, setSearchParams])

  const tabs = [
    { value: '', label: t('notifications.tabs.all'), count: totals.data ? Math.max(totals.data.totalElements - pendingCount, 0) : undefined },
    { value: 'unread', label: t('notifications.tabs.unread'), count: unreadCount ?? undefined },
  ]

  const dayLabel = (group) => (group.kind === 'date' ? formatDate(group.date) : t(`notifications.days.${group.kind}`))

  const heading = t('notifications.title')
  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          {area === 'public' ? (
            <SectionTitle as="h1">{heading}</SectionTitle>
          ) : (
            <>
              <h1 className="h4 mb-1">{heading}</h1>
              <p className="text-muted small mb-0">{t('notifications.intro')}</p>
            </>
          )}
        </div>
        <Button variant="outline-primary" size="sm" disabled={!unreadCount} onClick={markAllRead}>
          <CheckAll className="me-1" aria-hidden="true" />
          {t('notifications.markAllRead')}
        </Button>
      </div>

      <StatusTabs tabs={tabs} active={filter === 'unread' ? 'unread' : ''} label={t('notifications.tabs.label')} onChange={(value) => change({ filter: value })} />

      <Card className="article-card notif-page">
        {list.loading && <NotificationSkeleton rows={5} />}
        {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
        {list.data && items.length === 0 && page === 1 && <EmptyState icon={Bell} text={t(filter === 'unread' ? 'notifications.empty.unread' : 'notifications.empty.all')} />}
        {groups.map((group) => (
          <section key={group.key} aria-label={dayLabel(group)}>
            <h2 className="notif-day">{dayLabel(group)}</h2>
            <ul className="notif-list">
              {group.items.map((item) => (
                <NotificationItem key={item.id} item={item} onOpen={markRead} onMarkRead={markRead} onDelete={remove} />
              ))}
            </ul>
          </section>
        ))}
        {list.data && list.data.totalElements > 0 && (
          <ArticleFooter result={list.data} size={size} sizes={PAGE_SIZES} onPage={(next) => change({ page: next })} onSize={(value) => change({ size: value === DEFAULT_SIZE ? '' : value })} />
        )}
      </Card>
      <span className="visually-hidden" aria-live="polite">
        {list.data ? t('notifications.summary', { count: formatNumber(list.data.totalElements) }) : ''}
      </span>
    </div>
  )
}
