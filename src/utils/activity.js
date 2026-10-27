import { ACTIVITY_ACTIONS, RANGE_PRESETS } from '../constants/activity'
import { formatDateTime } from './dates'
import { truncate } from './notifications'

const MAX_TARGET = 80
const MAX_VALUE = 120

const pad = (number) => String(number).padStart(2, '0')

// A Date as yyyy-MM-dd in the local time zone (what the backend filters take as a day)
export function isoDay(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const isDay = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '')

// The days a range of the URL stands for: { from, to } (yyyy-MM-dd, both included) or empty strings for "any time".
// `range` is a preset ('today', '7d', '30d'); 'custom' (or no preset but a from / to) uses the two dates.
export function rangeDays(range, from, to, now = new Date()) {
  const preset = RANGE_PRESETS.find((item) => item.value === range && item.days)
  if (preset) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (preset.days - 1))
    return { from: isoDay(start), to: isoDay(now) }
  }
  return { from: isDay(from) ? from : '', to: isDay(to) ? to : '' }
}

// Which choice of the range buttons the URL means
export function rangeChoice(range, from, to) {
  if (RANGE_PRESETS.some((item) => item.value === range && item.days)) return range
  return range === 'custom' || isDay(from) || isDay(to) ? 'custom' : ''
}

// ---- the text of an entry ----

// The name of the actor, or "System" (a job) / "Someone" (a failed sign-in has nobody)
export const actorOf = (t, entry) => entry.actorName || t('activity.system')

// The label of the target, as it was when the action was done, cut short
export const targetOf = (t, entry) => truncate(entry.targetLabel, MAX_TARGET) || t('activity.unknownTarget')

const roleNames = (t, roles) => (Array.isArray(roles) ? roles.map((role) => t(`common.roles.${role}`, { defaultValue: role })).join(', ') : '')

// The translation key of the sentence of an entry and its values. Some actions have a second wording that depends on the
// details (comments turned on or off, a role change with the roles, a password changed or reset); the list has no details,
// so the plain wording is used there.
export function sentenceOf(t, entry) {
  const details = entry.details ?? {}
  const values = { actor: actorOf(t, entry), target: targetOf(t, entry) }
  let key = entry.action
  switch (entry.action) {
    case 'NEWS_PUBLISHED': {
      // the job that publishes a scheduled article has no person behind it ("System"); the detail view also knows who scheduled it
      if (!entry.actorName) {
        const scheduler = /^scheduled by (.+)$/.exec(details.note ?? '')?.[1]
        key = scheduler ? 'NEWS_PUBLISHED_system_by' : 'NEWS_PUBLISHED_system'
        if (scheduler) values.scheduler = truncate(scheduler, 60)
      }
      break
    }
    case 'COMMENTS_TOGGLED':
      if (typeof details.commentsEnabled?.after === 'boolean') key = details.commentsEnabled.after ? 'COMMENTS_TOGGLED_on' : 'COMMENTS_TOGGLED_off'
      break
    case 'USER_ROLES_CHANGED': {
      const from = roleNames(t, details.roles?.before)
      const to = roleNames(t, details.roles?.after)
      if (from && to) {
        key = 'USER_ROLES_CHANGED_roles'
        values.from = from
        values.to = to
      }
      break
    }
    case 'PASSWORD_CHANGED':
      if (details.method === 'reset') key = 'PASSWORD_CHANGED_reset'
      break
    case 'USER_CREATED':
      // the role the account was created with: creating an admin must be seen in the list
      if (details.role) {
        key = 'USER_CREATED_role'
        values.role = roleNames(t, [details.role])
      }
      break
    case 'SETTINGS_UPDATED':
      values.target = t(`activity.settingGroups.${entry.targetLabel}`, { defaultValue: values.target })
      break
    default:
  }
  return { key: ACTIVITY_ACTIONS[entry.action] ? `activity.sentence.${key}` : null, values }
}

// ---- groups by day ----

// "Today", "Yesterday" or its own date: { key, kind: 'today' | 'yesterday' | 'date', date }
function dayOf(value, now) {
  const date = new Date(value)
  const days = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(date.getFullYear(), date.getMonth(), date.getDate())) / 86400000)
  if (days <= 0) return { key: 'today', kind: 'today' }
  if (days === 1) return { key: 'yesterday', kind: 'yesterday' }
  return { key: isoDay(date), kind: 'date' }
}

// The list (newest first) as consecutive groups: [{ key, kind, date, items }]
export function groupByDate(items, now = new Date()) {
  const groups = []
  items.forEach((item) => {
    const { key, kind } = dayOf(item.createdAt, now)
    const last = groups[groups.length - 1]
    if (last && last.key === key) {
      last.items.push(item)
    } else {
      groups.push({ key, kind, date: item.createdAt, items: [item] })
    }
  })
  return groups
}

// ---- the details of an entry, as rows of a table ----

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

// One value of a before / after table as text: a list is joined, a yes / no becomes "On" / "Off" or "Yes" / "No"
function valueText(t, field, value) {
  if (value === null || value === undefined || value === '') return ''
  if (Array.isArray(value)) return value.map((item) => (field === 'roles' ? roleNames(t, [item]) : String(item))).join(', ')
  if (typeof value === 'boolean') return t(field === 'commentsEnabled' ? (value ? 'activity.values.on' : 'activity.values.off') : value ? 'activity.values.yes' : 'activity.values.no')
  return truncate(String(value), MAX_VALUE)
}

const statusText = (t, status) => (status ? t(`news.status.${status}`, { defaultValue: status }) : '')

// What the panel shows in the table "What changed": [{ label, before, after, note }]. A row with `note` is a text on its
// own (the content of an article is never kept, only that it changed); a row without `before` is a value that was set.
export function changeRows(t, entry) {
  const details = entry.details
  if (!isObject(details)) return []
  const rows = []
  const change = (field, labelKey, value) => {
    if (isObject(value) && ('before' in value || 'after' in value)) {
      rows.push({ label: t(labelKey ?? `activity.fields.${field}`, { defaultValue: field }), before: valueText(t, field, value.before), after: valueText(t, field, value.after) })
    } else if (typeof value === 'string') {
      rows.push({ label: t(labelKey ?? `activity.fields.${field}`, { defaultValue: field }), note: t('activity.values.changed') })
    }
  }

  if (isObject(details.changes)) {
    Object.entries(details.changes).forEach(([field, value]) => change(field, null, value))
  }
  if (details.commentsEnabled) change('commentsEnabled', null, details.commentsEnabled)
  if (details.roles) change('roles', null, details.roles)
  if (isObject(details.changed)) {
    // settings: the key and its value before and after; only the fact that it changed for a setting that is not public
    Object.entries(details.changed).forEach(([key, value]) => {
      if (isObject(value)) rows.push({ label: key, before: valueText(t, key, value.before), after: valueText(t, key, value.after), mono: true })
      else rows.push({ label: key, note: t('activity.values.changedHidden'), mono: true })
    })
  }
  if (details.from || details.to) {
    rows.push({ label: t('activity.fields.status'), before: statusText(t, details.from), after: statusText(t, details.to) })
  } else if (details.status) {
    rows.push({ label: t('activity.fields.status'), before: statusText(t, details.status), after: '' })
  }
  if (details.reason && entry.action === 'LOGIN_FAILED') {
    const key = String(details.reason).replace(/ (\w)/g, (_, letter) => letter.toUpperCase())
    rows.push({ label: t('activity.fields.reason'), note: t(`activity.reasons.${key}`, { defaultValue: details.reason }) })
  } else if (details.reason) {
    rows.push({ label: t('activity.fields.reason'), note: truncate(details.reason, 500) })
  }
  // a schedule: the UTC instants of the log, shown in the time zone of the reader
  if (details.scheduledAt && ['NEWS_SCHEDULED', 'NEWS_SCHEDULE_CHANGED', 'NEWS_PUBLISHED'].includes(entry.action)) {
    const before = entry.action === 'NEWS_SCHEDULE_CHANGED' && details.scheduledAtBefore ? formatDateTime(details.scheduledAtBefore) : ''
    rows.push({ label: t('activity.fields.scheduledAt'), before, after: formatDateTime(details.scheduledAt) })
  }
  if (details.category && entry.action === 'NEWS_CREATED') rows.push({ label: t('activity.fields.category'), after: String(details.category) })
  if (details.role && entry.action === 'USER_CREATED') rows.push({ label: t('activity.fields.role'), after: roleNames(t, [details.role]) })
  if (details.failures != null && (entry.action === 'ACCOUNT_LOCKED' || entry.action === 'IP_BLOCKED')) {
    rows.push({ label: t('activity.fields.failures'), note: String(details.failures) })
  }
  if (details.method) rows.push({ label: t('activity.fields.method'), note: t(`activity.methods.${details.method}`, { defaultValue: details.method }) })
  return rows
}

// A short "Chrome on Windows" from a User-Agent text; null when it is not one this knows (the panel then shows the raw text)
export function browserLabel(userAgent) {
  if (!userAgent) return null
  const browser = [
    [/Edg(e|A|iOS)?\//, 'Edge'],
    [/OPR\/|Opera/, 'Opera'],
    [/Firefox\//, 'Firefox'],
    [/Chrome\/|CriOS\//, 'Chrome'],
    [/Safari\//, 'Safari'],
  ].find(([pattern]) => pattern.test(userAgent))?.[1]
  const system = [
    [/Windows/, 'Windows'],
    [/Android/, 'Android'],
    [/iPhone|iPad|iOS/, 'iOS'],
    [/Mac OS X|Macintosh/, 'macOS'],
    [/Linux/, 'Linux'],
  ].find(([pattern]) => pattern.test(userAgent))?.[1]
  if (!browser && !system) return null
  return [browser, system].filter(Boolean).join(' · ')
}

// Saves a Blob as a file through a temporary link
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
