import httpClient from './httpClient'

const USERS = '/api/v1/users'

// Own profile: { id, username, fullName, email, phone, address, avatar, active, emailVerified, role }
export function getMe() {
  return httpClient.get(`${USERS}/me`)
}

// data: { username, fullName, address, phone, avatar } (all but username may be null)
export function updateMe(data) {
  return httpClient.put(`${USERS}/me`, data)
}

// ---- admin only ----

// Returns { items, page (1-based), size, totalElements, totalPages, first, last, empty, hasNext, hasPrevious }.
// Every filter is optional: search (name/email), role, active, emailVerified ('true' / 'false').
export function listUsers({ page = 1, size = 10, search, role, active, emailVerified } = {}) {
  const params = { page, size }
  if (search) params.search = search
  if (role) params.role = role
  if (active !== undefined && active !== '') params.active = active
  if (emailVerified !== undefined && emailVerified !== '') params.emailVerified = emailVerified
  return httpClient.get(USERS, { params })
}

export function getUser(id) {
  return httpClient.get(`${USERS}/${id}`)
}

// data: { username, fullName, email, address, phone, password, confirm, role } with role AUTHOR or EDITOR
export function createUser(data) {
  return httpClient.post(USERS, data)
}

export function activateUser(id) {
  return httpClient.put(`${USERS}/${id}/activate`)
}

export function deactivateUser(id) {
  return httpClient.put(`${USERS}/${id}/deactivate`)
}

// A user has exactly one role, so this replaces it.
export function changeUserRole(id, role) {
  return httpClient.put(`${USERS}/${id}/role`, { role })
}

export function resetUserPassword(id, { password, confirm }) {
  return httpClient.put(`${USERS}/${id}/password`, { password, confirm })
}
