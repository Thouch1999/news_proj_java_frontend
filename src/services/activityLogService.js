import httpClient from './httpClient'

const ACTIVITY = '/api/v1/activity-logs'

// The activity log (who did what). Read only: there is no call here that writes, changes or deletes an entry.
//
// An entry: { id, actorId, actorName, actorRoles ('ADMIN', the role at that time), ipAddress, userAgent, action, targetType
//   ('NEWS' | 'COMMENT' | 'USER' | 'CATEGORY' | 'TAG' | 'SETTINGS' | 'AUTH'), targetId (null for settings and a failed
//   sign-in), targetLabel (the title / name as it was), details (an object, only when ONE entry is read), createdAt }.
// actorId and actorName are null for a failed sign-in (nobody was signed in); targetLabel is then the typed e-mail.

// The filters of the list and of the export, as query parameters. `action` is repeated for several actions.
function filterParams({ actorId, actions, targetType, targetId, from, to, search } = {}) {
  const params = {}
  if (actorId) params.actorId = actorId
  if (actions?.length) params.action = actions
  if (targetType) params.targetType = targetType
  if (targetId) params.targetId = targetId
  if (from) params.from = from
  if (to) params.to = to
  if (search) params.search = search
  return params
}

// axios writes an array as action[]=A&action[]=B; the backend wants action=A&action=B
const REPEAT_ARRAYS = { indexes: null }

// ADMIN. Newest first; returns { items, page, size, totalElements, totalPages, ... } (no `details` in the items).
// from / to are days (yyyy-MM-dd), both included.
export function listActivity({ page = 1, size = 20, ...filters } = {}) {
  return httpClient.get(ACTIVITY, { params: { page, size, ...filterParams(filters) }, paramsSerializer: REPEAT_ARRAYS })
}

// ADMIN. One entry with its details.
export function getActivityEntry(id) {
  return httpClient.get(`${ACTIVITY}/${id}`)
}

// ADMIN. Every entry about one target (type NEWS, USER ...), newest first.
export function listTargetActivity(targetType, targetId, { page = 1, size = 10 } = {}) {
  return httpClient.get(`${ACTIVITY}/target/${targetType}/${targetId}`, { params: { page, size } })
}

// ADMIN. The entries that match the filters as a CSV file (at most 10,000 rows). Returns a Blob.
export function exportActivity(filters = {}) {
  return httpClient.get(`${ACTIVITY}/export`, { params: filterParams(filters), paramsSerializer: REPEAT_ARRAYS, responseType: 'blob' })
}

// ADMIN and EDITOR. The latest actions on articles and comments only, newest first, without address or details:
// [{ id, action, targetType, targetId, targetLabel, actorName, createdAt }]. limit is 1-50.
export function getRecentActivity({ limit = 8 } = {}) {
  return httpClient.get(`${ACTIVITY}/recent`, { params: { limit } })
}
