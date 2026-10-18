import httpClient from './httpClient'

const REPORTS = '/api/v1/reports'

// Dashboard numbers. EDITOR and ADMIN read everything except getAuthorDashboard, which is for AUTHOR only.
// Dates are yyyy-MM-dd and both days are included.

// { totalUsers, usersByRole: { ADMIN, EDITOR, AUTHOR, READER }, totalNews, newsByStatus: { DRAFT, PENDING, PUBLISHED,
//   REJECTED, ARCHIVED }, totalViews, totalComments, hiddenComments, unverifiedUsers }  (every role and status is there, 0 when empty)
export function getSummary() {
  return httpClient.get(`${REPORTS}/summary`)
}

// Every category, also one without news, the largest first:
// [{ categoryId, name, slug, active, newsCount, publishedCount }]
export function getNewsPerCategory() {
  return httpClient.get(`${REPORTS}/news-by-category`)
}

// Top PUBLISHED articles: [{ id, title, slug, categoryName, authorName, publishedAt, thumbnail, count }] where `count` is
// what the list is ranked by (an AUTHOR gets only their own articles). limit is 1-50. Without from/to: all-time view counter; with them: the views recorded in the period.
export function getMostViewed({ limit = 10, from, to } = {}) {
  return httpClient.get(`${REPORTS}/most-viewed`, { params: rangeParams(limit, from, to) })
}

// Same shape, ranked by visible comments (all-time, or written in the period). An article without comments is not listed.
export function getMostCommented({ limit = 10, from, to } = {}) {
  return httpClient.get(`${REPORTS}/most-commented`, { params: rangeParams(limit, from, to) })
}

// Articles published per day or month: { interval, from, to, total, points: [{ period: '2026-03-05' | '2026-03', count }] }
// with a point for every day / month of the range (0 when nothing was published). interval: 'DAY' | 'MONTH'.
// Without dates: the last 30 days (DAY) or 12 months (MONTH). At most 366 days / 60 months (otherwise 400).
export function getPublishedOverTime({ interval = 'DAY', from, to } = {}) {
  const params = { interval }
  if (from) params.from = from
  if (to) params.to = to
  return httpClient.get(`${REPORTS}/published`, { params })
}

// The numbers of [from, to] and of the period of the same length right before it, for the "vs previous period" trends:
// { from, to, previousFrom, previousTo, current: { newUsers, published, views, comments }, previous: { same } }
// (an AUTHOR gets the numbers of their own articles and newUsers 0). At most 366 days. Without dates: the last 30 days.
export function getTrends({ from, to } = {}) {
  const params = {}
  if (from) params.from = from
  if (to) params.to = to
  return httpClient.get(`${REPORTS}/trends`, { params })
}

// Views recorded per day or month, the same shape as getPublishedOverTime (an AUTHOR gets their own articles)
export function getViewsOverTime({ interval = 'DAY', from, to } = {}) {
  const params = { interval }
  if (from) params.from = from
  if (to) params.to = to
  return httpClient.get(`${REPORTS}/views`, { params })
}

// The latest status changes and comments, newest first (an AUTHOR gets the ones on their own articles):
// [{ type: 'STATUS_CHANGE' | 'COMMENT', actorName, newsId, newsTitle, newsSlug, fromStatus, toStatus, snippet, at }]
// fromStatus is null when the article was created. limit is 1-50.
export function getActivity({ limit = 8 } = {}) {
  return httpClient.get(`${REPORTS}/activity`, { params: { limit } })
}

// AUTHOR only: { totalNews, newsByStatus: { DRAFT, ... }, totalViews, totalComments } (views of the author's PUBLISHED
// articles, all comments on the author's articles)
export function getAuthorDashboard() {
  return httpClient.get(`${REPORTS}/author`)
}

function rangeParams(limit, from, to) {
  const params = { limit }
  if (from) params.from = from
  if (to) params.to = to
  return params
}
