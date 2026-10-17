import httpClient from './httpClient'

const TAGS = '/api/v1/tags'

// ---- public ----

// [{ id, name, slug }]
export function listTags() {
  return httpClient.get(TAGS)
}

export function getTagBySlug(slug) {
  return httpClient.get(`${TAGS}/${slug}`)
}

// ---- admin only ----

// data: { name, slug } (slug may be null, see categoryService.createCategory)
export function createTag(data) {
  return httpClient.post(TAGS, data)
}

export function updateTag(id, data) {
  return httpClient.put(`${TAGS}/${id}`, data)
}

// Also removes the tag from every news it was attached to.
export function deleteTag(id) {
  return httpClient.delete(`${TAGS}/${id}`)
}
