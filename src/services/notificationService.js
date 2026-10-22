import httpClient from './httpClient'

const NOTIFICATIONS = '/api/v1/notifications'

// The notifications of the logged-in user (any role); a user only ever reaches their own. A notification is
// { id, type, data, groupCount, read, title, message, link, createdAt, updatedAt }.
//   type: ARTICLE_SUBMITTED | ARTICLE_PUBLISHED | ARTICLE_REJECTED | ARTICLE_ARCHIVED | NEW_COMMENT | COMMENT_HIDDEN |
//         NEW_USER | ROLES_CHANGED
//   data: the values the text is built from (newsTitle, newsSlug, actorName, reason, roles, previousRoles, count, userId)
//   title / message: a plain English fallback; link: the frontend path to open, or null
// There is no "mark as unread" endpoint.

// filter: 'all' (default) | 'unread'; the newest activity (updatedAt) first. Returns { items, page, size, totalElements,
// totalPages, ... } (size: 50 at most).
export function listNotifications({ filter = 'all', page = 1, size = 10 } = {}) {
  return httpClient.get(NOTIFICATIONS, { params: { filter, page, size } })
}

// A small, fast call: the number of unread notifications.
export async function getUnreadCount() {
  const result = await httpClient.get(`${NOTIFICATIONS}/unread-count`)
  return result?.count ?? 0
}

// Returns the notification. 404 when it is not the user's own (or does not exist).
export function markRead(id) {
  return httpClient.patch(`${NOTIFICATIONS}/${id}/read`)
}

export function markAllRead() {
  return httpClient.patch(`${NOTIFICATIONS}/read-all`)
}

// Removes it for good. 404 when it is not the user's own (or does not exist).
export function deleteNotification(id) {
  return httpClient.delete(`${NOTIFICATIONS}/${id}`)
}
