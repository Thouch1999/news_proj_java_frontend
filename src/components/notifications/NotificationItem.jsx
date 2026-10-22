import { Dropdown, OverlayTrigger, Placeholder, Tooltip } from 'react-bootstrap'
import { Bell, ThreeDots } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { NOTIFICATION_TYPES } from '../../constants/notifications'
import { useFormat } from '../../hooks/useFormat'
import { useNow } from '../../hooks/useNow'
import { notificationText } from '../../utils/notifications'

// One notification, in the panel of the bell and on the notifications page. The text is built from the type and data
// (utils/notifications.js). The main area opens the link of the notification (a button when it has none); an unread one
// has a tint and a dot. The "⋯" menu has "Mark as read" (unread only; the backend has no "mark as unread") and "Delete".
// onOpen(item) is called on click: the parent marks it read (and closes the panel).
export default function NotificationItem({ item, onOpen, onMarkRead, onDelete }) {
  const { t } = useTranslation()
  const { formatAgo, formatFullDate } = useFormat()
  useNow() // renews "5 minutes ago" every minute
  const meta = NOTIFICATION_TYPES[item.type]
  const Icon = meta?.icon ?? Bell
  const { text, detail } = notificationText(t, item)
  const link = typeof item.link === 'string' && item.link.startsWith('/') ? item.link : null

  const content = (
    <>
      <span className={`notif-icon notif-icon--${meta?.tone ?? 'neutral'}`} aria-hidden="true">
        <Icon />
      </span>
      <span className="notif-body">
        <span className="notif-text">{text}</span>
        {detail && <span className="notif-detail">{detail}</span>}
        <OverlayTrigger placement="bottom" overlay={<Tooltip id={`notification-time-${item.id}`}>{formatFullDate(item.updatedAt)}</Tooltip>}>
          <time className="notif-time" dateTime={item.updatedAt}>
            {formatAgo(item.updatedAt)}
          </time>
        </OverlayTrigger>
      </span>
    </>
  )

  return (
    <li className={`notif-item${item.read ? '' : ' is-unread'}`}>
      {link ? (
        <Link to={link} className="notif-main" onClick={() => onOpen(item)}>
          {content}
        </Link>
      ) : (
        <button type="button" className="notif-main" onClick={() => onOpen(item)}>
          {content}
        </button>
      )}
      <div className="notif-side">
        {!item.read && <span className="notif-dot" role="img" aria-label={t('notifications.unread')} />}
        <Dropdown align="end">
          <Dropdown.Toggle variant="link" size="sm" className="notif-more" aria-label={t('notifications.moreActions')}>
            <ThreeDots aria-hidden="true" />
          </Dropdown.Toggle>
          <Dropdown.Menu popperConfig={{ strategy: 'fixed' }}>
            {!item.read && (
              <Dropdown.Item as="button" type="button" onClick={() => onMarkRead(item)}>
                {t('notifications.markRead')}
              </Dropdown.Item>
            )}
            <Dropdown.Item as="button" type="button" className="text-danger" onClick={() => onDelete(item)}>
              {t('common.actions.delete')}
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </li>
  )
}

// grey rows while the list loads
export function NotificationSkeleton({ rows = 3 }) {
  const { t } = useTranslation()
  return (
    <div role="status">
      <span className="visually-hidden">{t('common.loading')}</span>
      <Placeholder as="div" animation="glow" aria-hidden="true">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="notif-item">
            <span className="notif-icon notif-icon--neutral" />
            <div className="flex-grow-1">
              <Placeholder xs={10} className="d-block mb-1" />
              <Placeholder xs={4} size="sm" className="d-block" />
            </div>
          </div>
        ))}
      </Placeholder>
    </div>
  )
}
