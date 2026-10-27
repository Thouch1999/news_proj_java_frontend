import { NOTIFICATION_TYPES } from '../constants/notifications'
import { formatDateTime } from './dates'

const MAX_TITLE = 60
const MAX_NAME = 30
const MAX_REASON = 140

// Long text is cut with an ellipsis (by characters, not by UTF-16 units, so Khmer is not split in the middle)
export function truncate(value, max) {
  const chars = Array.from(String(value ?? '').trim())
  return chars.length > max ? `${chars.slice(0, max - 1).join('').trimEnd()}…` : chars.join('')
}

// The shown text of a notification, built from its type and data (the backend message is only a fallback for a type
// this app does not know). `t` is the translation function. Returns { text, detail } where detail is a second, muted
// line (the reason of a rejection, the previous role) or null.
export function notificationText(t, item) {
  const data = item.data ?? {}
  const fallback = item.message || item.title || t('notifications.fallback')
  if (!NOTIFICATION_TYPES[item.type]) {
    return { text: fallback, detail: null }
  }
  const values = {
    actorName: truncate(data.actorName || t('notifications.someone'), MAX_NAME),
    newsTitle: truncate(data.newsTitle, MAX_TITLE),
    count: item.groupCount,
  }
  const needsTitle = item.type !== 'NEW_USER' && item.type !== 'ROLES_CHANGED'
  if (needsTitle && !values.newsTitle) {
    return { text: fallback, detail: null }
  }

  switch (item.type) {
    case 'NEW_COMMENT':
      return { text: t(item.groupCount > 1 ? 'notifications.messages.NEW_COMMENT_group' : 'notifications.messages.NEW_COMMENT', values), detail: null }
    case 'ARTICLE_REJECTED':
      return { text: t('notifications.messages.ARTICLE_REJECTED', values), detail: data.reason ? t('notifications.reason', { reason: truncate(data.reason, MAX_REASON) }) : null }
    case 'ARTICLE_SCHEDULED':
      // the go-live time is a UTC instant: shown in the time zone of the reader
      return { text: data.scheduledAt ? t('notifications.messages.ARTICLE_SCHEDULED', { ...values, when: formatDateTime(data.scheduledAt) }) : fallback, detail: null }
    case 'ROLES_CHANGED': {
      const names = (roles) => (Array.isArray(roles) ? roles.map((role) => t(`common.roles.${role}`, { defaultValue: role })).join(', ') : '')
      const roles = names(data.roles)
      const previous = names(data.previousRoles)
      return {
        text: roles ? t('notifications.messages.ROLES_CHANGED', { roles }) : fallback,
        detail: previous ? t('notifications.previousRoles', { roles: previous }) : null,
      }
    }
    default:
      return { text: t(`notifications.messages.${item.type}`, values), detail: null }
  }
}

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

// Which day group a time belongs to: 'today', 'yesterday', 'week' (the 5 days before yesterday) or its own date
// ('2026-03-05'). Returns { key, kind }.
export function dayGroup(value, now = new Date()) {
  const date = new Date(value)
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86400000)
  if (days <= 0) return { key: 'today', kind: 'today' }
  if (days === 1) return { key: 'yesterday', kind: 'yesterday' }
  if (days <= 6) return { key: 'week', kind: 'week' }
  const pad = (number) => String(number).padStart(2, '0')
  return { key: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`, kind: 'date' }
}

// The list (newest first) as consecutive groups: [{ key, kind, date, items }]
export function groupByDay(items, now = new Date()) {
  const groups = []
  items.forEach((item) => {
    const { key, kind } = dayGroup(item.updatedAt, now)
    const last = groups[groups.length - 1]
    if (last && last.key === key) {
      last.items.push(item)
    } else {
      groups.push({ key, kind, date: item.updatedAt, items: [item] })
    }
  })
  return groups
}
