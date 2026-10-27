import httpClient from './httpClient'

const NEWS = '/api/v1/news'
const COMMENTS = '/api/v1/comments'

// A comment: { id, newsId, newsTitle, newsSlug, userId, userName, content (plain text, not HTML), status
//   ('VISIBLE' | 'HIDDEN'), createdAt, updatedAt, moderationNote (only in the moderation list) }. userName is the full name or the username, never the e-mail.

// ---- public / any logged-in user ----

// The VISIBLE comments of a published article, newest first. Returns { items, page, size, totalElements,
// totalPages, hasNext, ... }. 404 when the article is not published.
export function listComments(newsId, { page = 1, size = 10 } = {}) {
  return httpClient.get(`${NEWS}/${newsId}/comments`, { params: { page, size } })
}

// Logged in only. content: up to 2000 characters; website: the honeypot (the empty text of the hidden field). 404: article not
// published; 409: comments are disabled or the same comment again; 400: more than 2 links; 403: the account is too new;
// 429: too many comments. A comment held for review (a blocked word) comes back with status 'HIDDEN' and a `message`.
export function addComment(newsId, content, website = '') {
  return httpClient.post(`${NEWS}/${newsId}/comments`, { content, website })
}

// The author of the comment, or an editor/admin (403 for anybody else). The comment is removed for good.
export function deleteComment(id) {
  return httpClient.delete(`${COMMENTS}/${id}`)
}

// ---- EDITOR / ADMIN ----

// Every comment, newest first. Each filter is optional: status ('VISIBLE' | 'HIDDEN'), newsId, userId.
export function listAllComments({ page = 1, size = 10, status, newsId, userId } = {}) {
  const params = { page, size }
  if (status) params.status = status
  if (newsId) params.newsId = newsId
  if (userId) params.userId = userId
  return httpClient.get(COMMENTS, { params })
}

// Both return the comment. Repeating one changes nothing.
export function hideComment(id) {
  return httpClient.put(`${COMMENTS}/${id}/hide`)
}

export function unhideComment(id) {
  return httpClient.put(`${COMMENTS}/${id}/unhide`)
}
