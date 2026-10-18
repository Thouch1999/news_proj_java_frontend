import httpClient from './httpClient'

const NEWS = '/api/v1/news'
const BOOKMARKS = '/api/v1/bookmarks'

// Bookmarks of the logged-in user (any role). Saving and removing can be repeated safely.

// Saves a PUBLISHED article (404 when it is not published). Saving it again changes nothing.
export function addBookmark(newsId) {
  return httpClient.post(`${NEWS}/${newsId}/bookmark`)
}

// Nothing happens when it was not saved.
export function removeBookmark(newsId) {
  return httpClient.delete(`${NEWS}/${newsId}/bookmark`)
}

// My saved news that readers can open, the newest bookmark first. Returns { items, page, size, totalElements,
// totalPages, last, ... } where an item is { bookmarkedAt, news: <card of publicNewsService> }.
// (An article that was archived or hidden is left out until it is published again.)
export function listBookmarks({ page = 1, size = 10 } = {}) {
  return httpClient.get(BOOKMARKS, { params: { page, size } })
}
