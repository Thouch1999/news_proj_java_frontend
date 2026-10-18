import httpClient from './httpClient'

const SETTINGS = '/api/v1/settings'

// System settings. Values are always text; the keys are the backend's snake_case names (constants/siteSettings.js).

// No login: the public settings as one flat object { site_name_en: '...', ... }. Used by the website and the dashboard
// on startup.
export function getPublicSettings() {
  return httpClient.get(`${SETTINGS}/public`)
}

// ADMIN: every setting, grouped: { general: { key: value }, branding: {...}, website: {...}, seo: {...}, content: {...} }
export function getAllSettings() {
  return httpClient.get(SETTINGS)
}

// ADMIN: changes several settings of one group in one request; nothing is saved if one value is invalid (400 with
// `details` = { key: problem }). Returns the values of the whole group. An empty value clears an optional setting; an
// image setting can only be cleared this way (a new image is uploaded with uploadSettingsImage).
export function updateSettings(group, values) {
  return httpClient.put(`${SETTINGS}/${group}`, { values })
}

// ADMIN: uploads a site image. type: logo | logo-dark | favicon | share-image. PNG, JPG or WebP (the favicon also ICO),
// 2 MB at most. Returns { <setting key>: '/uploads/<file>' }; show it with mediaUrl().
export function uploadSettingsImage(type, file) {
  const form = new FormData()
  form.append('file', file)
  return httpClient.post(`${SETTINGS}/images/${type}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
}
