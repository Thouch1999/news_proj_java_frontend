import { useState } from 'react'
import { Dropdown, Nav } from 'react-bootstrap'
import { Bell } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { notificationsPath, PANEL_SIZE } from '../../constants/notifications'
import { useAuth } from '../../hooks/useAuth'
import { useFormat } from '../../hooks/useFormat'
import { useNotificationList } from '../../hooks/useNotificationList'
import { useNotifications } from '../../hooks/useNotifications'
import { useResolvedTheme } from '../../hooks/useResolvedTheme'
import { ErrorState } from '../common/ListStates'
import NotificationItem, { NotificationSkeleton } from './NotificationItem'

const TABS = ['all', 'unread']
// 8px below the bell, flips above when there is no room, and keeps 8px from the edges of the screen
const PANEL_POPPER = {
  modifiers: [
    { name: 'offset', options: { offset: [0, 8] } },
    { name: 'preventOverflow', options: { padding: 8 } },
    { name: 'flip', enabled: true },
  ],
}

// What the open panel shows: the title with "Mark all as read", the tabs All / Unread, the latest 10 and the link to the page.
function NotificationPanel({ onClose }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { formatNumber } = useFormat()
  const { unreadCount, hiddenIds, markRead, markAllRead, remove } = useNotifications()
  const [filter, setFilter] = useState('all')
  const { data, error, loading, reload } = useNotificationList({ filter, page: 1, size: PANEL_SIZE })
  const items = (data?.items ?? []).filter((item) => !hiddenIds.has(item.id))

  const open = (item) => {
    markRead(item)
    onClose()
  }

  return (
    <>
      <div className="notif-head">
        <h2 className="notif-title">{t('notifications.title')}</h2>
        {unreadCount > 0 && (
          <button type="button" className="notif-link" onClick={markAllRead}>
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>
      <Nav variant="underline" className="notif-tabs" role="tablist" aria-label={t('notifications.tabs.label')} activeKey={filter} onSelect={(value) => setFilter(value ?? 'all')}>
        {TABS.map((tab) => (
          <Nav.Item key={tab} role="presentation">
            <Nav.Link as="button" type="button" eventKey={tab} role="tab" aria-selected={filter === tab}>
              {t(`notifications.tabs.${tab}`)}
              {tab === 'unread' && unreadCount > 0 && <span className="notif-tab-count">{formatNumber(unreadCount)}</span>}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>
      <div className="notif-scroll">
        {loading && <NotificationSkeleton />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data && items.length === 0 && (
          <div className="notif-empty">
            <Bell size={32} aria-hidden="true" />
            <p className="notif-empty__title">{t(filter === 'unread' ? 'notifications.empty.unread' : 'notifications.empty.all')}</p>
            <p className="notif-empty__hint">{t('notifications.empty.hint')}</p>
          </div>
        )}
        {items.length > 0 && (
          <ul className="notif-list">
            {items.map((item) => (
              <NotificationItem key={item.id} item={item} onOpen={open} onMarkRead={markRead} onDelete={remove} />
            ))}
          </ul>
        )}
      </div>
      <div className="notif-foot">
        <Link to={notificationsPath(user?.role)} className="notif-link" onClick={onClose}>
          {t('notifications.viewAll')}
        </Link>
      </div>
    </>
  )
}

// The bell of the header (logged-in users only), between the theme switch and the user menu. `variant` is the Bootstrap
// button variant, like ThemeToggle's. The panel is a dropdown: Esc closes it and the focus goes back to the bell. Below
// 576px it is as wide as the screen (see .notif-panel in _theme.scss).
export default function NotificationBell({ variant = 'outline-secondary' }) {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  const { unreadCount } = useNotifications()
  const theme = useResolvedTheme()
  const [open, setOpen] = useState(false)
  const unread = unreadCount ?? 0

  return (
    <Dropdown align="end" show={open} onToggle={(next) => setOpen(next)} autoClose="outside">
      <Dropdown.Toggle variant={variant} size="sm" className="notif-toggle header-control" aria-label={t('notifications.bellLabel', { unread: formatNumber(unread) })}>
        <Bell aria-hidden="true" />
        {unread > 0 && (
          <span className="notif-badge" aria-hidden="true">
            {unread > 9 ? '9+' : formatNumber(unread)}
          </span>
        )}
      </Dropdown.Toggle>
      {/* data-bs-theme: the public header is always dark or light by the site colour, the panel follows the page's mode */}
      <Dropdown.Menu className="notif-panel" role="dialog" aria-label={t('notifications.title')} data-bs-theme={theme} popperConfig={PANEL_POPPER}>
        {open && <NotificationPanel onClose={() => setOpen(false)} />}
      </Dropdown.Menu>
    </Dropdown>
  )
}
