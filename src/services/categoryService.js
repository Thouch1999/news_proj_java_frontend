import httpClient from './httpClient'

const CATEGORIES = '/api/v1/categories'

// ---- public ----

// Active categories: [{ id, name, slug, description, active }]
export function listActiveCategories() {
  return httpClient.get(CATEGORIES)
}

export function getCategoryBySlug(slug) {
  return httpClient.get(`${CATEGORIES}/${slug}`)
}

// ---- admin only ----

// Every category, including inactive ones, with `newsCount`
export function listCategoriesForAdmin() {
  return httpClient.get(`${CATEGORIES}/admin`)
}

// data: { name, slug, description }. `slug` may be null: the backend generates it from the name
// (and asks for one when the name has no Latin letters).
export function createCategory(data) {
  return httpClient.post(CATEGORIES, data)
}

// Renaming keeps the slug; it changes only when a different `slug` is sent.
export function updateCategory(id, data) {
  return httpClient.put(`${CATEGORIES}/${id}`, data)
}

export function activateCategory(id) {
  return httpClient.put(`${CATEGORIES}/${id}/activate`)
}

export function deactivateCategory(id) {
  return httpClient.put(`${CATEGORIES}/${id}/deactivate`)
}

// Only allowed while the category has no news (the backend answers 409 otherwise).
export function deleteCategory(id) {
  return httpClient.delete(`${CATEGORIES}/${id}`)
}
