import httpClient from './httpClient'

const NEWS = '/api/v1/news'

// ---- article management for AUTHOR, EDITOR and ADMIN ----
// An author works on their own articles only; an editor and an admin see all articles (the backend decides by role).

// A new article is always a DRAFT.
// data: { title, summary, content, categoryId, tagIds, commentsEnabled }
export function createNews(data) {
  return httpClient.post(NEWS, data)
}

// An author: only while the article is DRAFT or REJECTED (the backend answers 409 otherwise). An editor: any status
// but ARCHIVED. An admin: any status.
export function updateNews(id, data) {
  return httpClient.put(`${NEWS}/${id}`, data)
}

// Whole article: { id, title, slug, summary, content, thumbnail, status, authorId, authorName, category, tags,
//   images, commentsEnabled, rejectionReason, editable, viewCount, publishedAt, createdAt, updatedAt }
// `editable` already takes the role into account. An author gets 404 for another author's article.
export function getManagedNews(id) {
  return httpClient.get(`${NEWS}/manage/${id}`)
}

// Returns { items, page, size, totalElements, totalPages, ... }. Every filter is optional.
// An editor or an admin gets all articles and may filter by authorId and categoryId; for an author the backend
// always returns only their own articles. An item has no content: { id, title, slug, summary, thumbnail, status, authorId,
// authorName, categoryName, rejectionReason, editable, createdAt, updatedAt }
export function listManagedNews({ page = 1, size = 10, status, authorId, categoryId, sort } = {}) {
  const params = { page, size }
  if (sort) params.sort = sort
  if (status) params.status = status
  if (authorId) params.authorId = authorId
  if (categoryId) params.categoryId = categoryId
  return httpClient.get(`${NEWS}/manage`, { params })
}

// An author: an own DRAFT only. An admin: any article, removed with its comments, bookmarks, views, images and history.
export function deleteNews(id) {
  return httpClient.delete(`${NEWS}/${id}`)
}

// ---- editorial workflow (statuses: DRAFT, PENDING, SCHEDULED, PUBLISHED, REJECTED, ARCHIVED) ----
// Each action returns the whole article. A wrong role is 403 and a status that does not allow the action is 409.

// The author's own DRAFT or REJECTED article -> PENDING (the rejection reason is cleared).
export function submitNews(id) {
  return httpClient.post(`${NEWS}/${id}/submit`)
}

// EDITOR/ADMIN: PENDING or SCHEDULED ("publish now") -> PUBLISHED. ADMIN only: DRAFT -> PUBLISHED ("publish now", without review).
export function publishNews(id) {
  return httpClient.post(`${NEWS}/${id}/publish`)
}

// EDITOR/ADMIN: PENDING -> REJECTED. The reason is required (at most 1000 characters).
export function rejectNews(id, reason) {
  return httpClient.post(`${NEWS}/${id}/reject`, { reason })
}

// EDITOR/ADMIN: PUBLISHED -> ARCHIVED
export function archiveNews(id) {
  return httpClient.post(`${NEWS}/${id}/archive`)
}

// ADMIN only: ARCHIVED -> PUBLISHED
export function restoreNews(id) {
  return httpClient.post(`${NEWS}/${id}/restore`)
}

// ---- scheduled publishing (EDITOR/ADMIN; `scheduledAt` is a UTC instant such as 2026-10-20T00:00:00Z, 5 minutes to 1 year ahead) ----

// PENDING -> SCHEDULED; ADMIN only: DRAFT -> SCHEDULED. The article goes live by itself (the backend job runs every minute).
export function scheduleNews(id, scheduledAt) {
  return httpClient.post(`${NEWS}/${id}/schedule`, { scheduledAt })
}

// Changes the time of a SCHEDULED article
export function rescheduleNews(id, scheduledAt) {
  return httpClient.patch(`${NEWS}/${id}/schedule`, { scheduledAt })
}

// SCHEDULED -> PENDING (the schedule is cleared)
export function cancelNewsSchedule(id) {
  return httpClient.delete(`${NEWS}/${id}/schedule`)
}

// The next 10 scheduled articles, nearest first: items of the management list plus scheduledAt and scheduledByName
export function listUpcomingNews() {
  return httpClient.get(`${NEWS}/scheduled/upcoming`)
}

// Runs one workflow action by its key (see constants/newsStatus.js); `reason` is the text of a rejection, or the UTC time of a schedule or a change of it.
export function runWorkflowAction(action, id, reason) {
  switch (action) {
    case 'submit':
      return submitNews(id)
    case 'publish':
      return publishNews(id)
    case 'reject':
      return rejectNews(id, reason)
    case 'archive':
      return archiveNews(id)
    case 'restore':
      return restoreNews(id)
    case 'schedule':
      return scheduleNews(id, reason)
    case 'reschedule':
      return rescheduleNews(id, reason)
    case 'unschedule':
      return cancelNewsSchedule(id)
    default:
      return Promise.reject(new Error(`Unknown workflow action: ${action}`))
  }
}

// EDITOR/ADMIN: allow or stop new comments on an article, in any status; both return the whole article.
// The existing comments stay.
export function enableComments(id) {
  return httpClient.put(`${NEWS}/${id}/comments/enable`)
}

export function disableComments(id) {
  return httpClient.put(`${NEWS}/${id}/comments/disable`)
}

// EDITOR/ADMIN: the PENDING articles, oldest first. Returns { items, page, size, totalElements, totalPages, ... };
// an item has the same fields as the management list (updatedAt is when it was last changed, i.e. submitted).
export function listReviewQueue({ page = 1, size = 10 } = {}) {
  return httpClient.get(`${NEWS}/review`, { params: { page, size } })
}

// Status changes of an article, oldest first: [{ id, fromStatus (null when created), toStatus, changedById,
// changedByName, note, changedAt }]. An author gets 404 for another author's article.
export function getNewsHistory(id) {
  return httpClient.get(`${NEWS}/${id}/history`)
}

// ---- images (the file is stored on the backend; `url` is a path such as /uploads/x.png) ----

function fileForm(file, caption) {
  const form = new FormData()
  form.append('file', file)
  if (caption) form.append('caption', caption)
  return form
}

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } }

// Returns { id, url, caption, sortOrder }
export function addNewsImage(id, file, caption) {
  return httpClient.post(`${NEWS}/${id}/images`, fileForm(file, caption), MULTIPART)
}

// data: { caption, sortOrder } (a null field stays as it is)
export function updateNewsImage(id, imageId, data) {
  return httpClient.put(`${NEWS}/${id}/images/${imageId}`, data)
}

export function deleteNewsImage(id, imageId) {
  return httpClient.delete(`${NEWS}/${id}/images/${imageId}`)
}

// Both return the whole article
export function setNewsThumbnail(id, file) {
  return httpClient.post(`${NEWS}/${id}/thumbnail`, fileForm(file), MULTIPART)
}

export function removeNewsThumbnail(id) {
  return httpClient.delete(`${NEWS}/${id}/thumbnail`)
}
