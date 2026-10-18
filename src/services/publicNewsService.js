import httpClient from './httpClient'

const PUBLIC_NEWS = '/api/v1/public/news'

// Public reading API: no login needed. Only PUBLISHED articles of an active category are returned.
//
// A card (summary): { id, title, slug, summary, thumbnail, categoryName, categorySlug, authorName,
//   tags: [{ id, name, slug }], viewCount, commentCount, publishedAt }

// Newest first. Returns { items, page, size, totalElements, totalPages, ... }. Every filter is optional:
// keyword (searched in title, summary and content; Khmer works), category (slug), tag (slug),
// from / to (yyyy-MM-dd, both days included; from after to is a 400). Without `size` the backend uses the page size of
// the system settings (news_per_page).
export function listPublicNews({ page = 1, size, keyword, category, tag, from, to } = {}) {
  const params = { page }
  if (size) params.size = size
  if (keyword) params.keyword = keyword
  if (category) params.category = category
  if (tag) params.tag = tag
  if (from) params.from = from
  if (to) params.to = to
  return httpClient.get(PUBLIC_NEWS, { params })
}

// One article: { id, title, slug, summary, content (HTML), thumbnail, authorName, category: { id, name, slug,
//   description }, tags, images: [{ id, url, caption, sortOrder }], commentsEnabled, viewCount, commentCount,
//   publishedAt, updatedAt }. 404 when the slug is not a published article.
// Opening it counts a view (once per user or address in 24 hours); `viewCount` already includes it.
export function getPublicNews(slug) {
  return httpClient.get(`${PUBLIC_NEWS}/${encodeURIComponent(slug)}`)
}

// The newest articles (a list of cards, limit 1-20)
export function getLatestNews(limit = 10) {
  return httpClient.get(`${PUBLIC_NEWS}/latest`, { params: { limit } })
}

// The articles with the most views (a list of cards, limit 1-20)
export function getMostViewedNews(limit = 5) {
  return httpClient.get(`${PUBLIC_NEWS}/most-viewed`, { params: { limit } })
}

// Home page sections: [{ category: { id, name, slug, description }, news: [card] }] for every active category
// that has news, in category name order (perCategory 1-10).
export function getCategorySections(perCategory = 4) {
  return httpClient.get(`${PUBLIC_NEWS}/category-sections`, { params: { perCategory } })
}
