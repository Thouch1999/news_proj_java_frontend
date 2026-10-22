import { Archive, CheckCircle, ChatDots, EyeSlash, PersonPlus, Send, ShieldCheck, XCircle } from 'react-bootstrap-icons'
import { ROLES } from './roles'
import { ROUTES } from './routes'

// How often the unread count is asked for, and how long a deleted notification can be brought back
export const POLL_INTERVAL_MS = 30000
export const UNDO_DELAY_MS = 6000
// the "You have a new notification" toast shows at most this often
export const NEW_TOAST_GAP_MS = 60000
// items in the panel of the bell
export const PANEL_SIZE = 10
export const PAGE_SIZES = [10, 20, 50] // the backend gives at most 50 per page

// The types the backend sends: the icon, and the tone of the soft circle behind it (see .notif-icon in _theme.scss).
// The text of each type is under notifications.messages in the translations.
export const NOTIFICATION_TYPES = {
  ARTICLE_SUBMITTED: { icon: Send, tone: 'info' },
  ARTICLE_PUBLISHED: { icon: CheckCircle, tone: 'success' },
  ARTICLE_REJECTED: { icon: XCircle, tone: 'danger' },
  ARTICLE_ARCHIVED: { icon: Archive, tone: 'neutral' },
  NEW_COMMENT: { icon: ChatDots, tone: 'info' },
  COMMENT_HIDDEN: { icon: EyeSlash, tone: 'warning' },
  NEW_USER: { icon: PersonPlus, tone: 'success' },
  ROLES_CHANGED: { icon: ShieldCheck, tone: 'warning' },
}

// The notifications page of a role: readers use the public layout, the staff roles the dashboard
export const notificationsPath = (role) => (role === ROLES.READER ? ROUTES.NOTIFICATIONS : ROUTES.DASHBOARD_NOTIFICATIONS)
