import httpClient from './httpClient'

const PARTNERS = '/api/v1/admin/promos'

// The management of the promos (backend: sponsors). ADMIN only.
//
// A partner: { id, name, title, description, ctaText, targetUrl, active, status ('active' | 'scheduled' | 'ended' |
//   'inactive'), startAt, endAt (UTC ISO text or null), weight (1-100), language ('ALL' | 'EN' | 'KM'), placements (the
//   places the admin chose: 'ARTICLE_SIDEBAR' and/or 'ARTICLE_POPUP'), categoryIds (empty: every category),
//   popupUseDefaults (true: the site defaults decide, the fields below are null), popupTrigger ('DELAY' | 'SCROLL' |
//   'FIRST_OF_BOTH'), popupDelaySeconds, popupScrollPercent, popupFrequency ('PER_VISIT' | 'PER_DAY' | 'EVERY_N_DAYS'),
//   popupFrequencyDays,
//   creatives: [{ placement, imageUrl, altText, generated, width, height, mediaType ('IMAGE' | 'VIDEO_FILE' | 'YOUTUBE'),
//   videoUrl, youtubeId }] (the stored media, also of a place that is unchecked; for a video imageUrl is its poster;
//   MOBILE_BOTTOM_BAR is the bar of the popup, always an image, generated: true when the server cut it from the popup image),
//   logoUrl, logoSmallUrl (the square logo, 256 and 128 px, or null), createdAt, updatedAt, createdByName }
// Rules: at least one place; an active sponsor needs the image of every chosen place. A new sponsor is created off, its
// images are uploaded, then it is activated. Errors come as 400 with details { placements, sidebarImage, popupImage, ... }.
// Statistics days are yyyy-MM-dd (UTC, both included); without from/to the backend uses the last 30 days.

// { items, page, size, totalElements, ... }, newest first. status: active | scheduled | ended | inactive;
// placement: ARTICLE_SIDEBAR | ARTICLE_POPUP (only the sponsors that chose it).
export function listPartners({ status, placement, search, page = 1, size = 100 } = {}) {
  const params = { page, size }
  if (status) params.status = status
  if (placement) params.placement = placement
  if (search) params.search = search
  return httpClient.get(PARTNERS, { params })
}

export function getPartner(id) {
  return httpClient.get(`${PARTNERS}/${id}`)
}

// data: { name, title, description, ctaText, targetUrl, active, startAt, endAt, weight, language, placements, categoryIds }.
// Wrong values come back as 400 with `details` = { field: problem }.
export function createPartner(data) {
  return httpClient.post(PARTNERS, data)
}

// The same data; `active` is ignored here (see activatePartner / deactivatePartner).
export function updatePartner(id, data) {
  return httpClient.put(`${PARTNERS}/${id}`, data)
}

export function activatePartner(id) {
  return httpClient.put(`${PARTNERS}/${id}/activate`)
}

export function deactivatePartner(id) {
  return httpClient.put(`${PARTNERS}/${id}/deactivate`)
}

// Deletes the partner with its images and its statistics.
export function deletePartner(id) {
  return httpClient.delete(`${PARTNERS}/${id}`)
}

// Saves (or replaces) the image of one placement: PNG, JPG or WebP, 2 MB at most. Returns the whole partner.
export function uploadPartnerImage(id, placement, file, altText) {
  const form = new FormData()
  form.append('file', file)
  if (altText) form.append('altText', altText)
  return httpClient.post(`${PARTNERS}/${id}/creatives/${placement}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

// Saves (or replaces) a video file for the sidebar or the popup: MP4 (H.264) or WebM, 15 MB and 30 seconds at most, with its
// required poster image. Returns the whole partner.
export function uploadPartnerVideo(id, placement, file, poster, altText) {
  const form = new FormData()
  form.append('file', file)
  form.append('poster', poster)
  if (altText) form.append('altText', altText)
  return httpClient.post(`${PARTNERS}/${id}/creatives/${placement}/video`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

// Saves (or replaces) a YouTube video for the popup from its link (only the video id is kept). `poster` is an optional image;
// without it the YouTube thumbnail is the poster. Returns the whole partner.
export function uploadPartnerYoutube(id, placement, url, poster, altText) {
  const form = new FormData()
  form.append('url', url)
  if (poster) form.append('poster', poster)
  if (altText) form.append('altText', altText)
  return httpClient.post(`${PARTNERS}/${id}/creatives/${placement}/youtube`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

// Replaces only the poster of a video (file or YouTube). Returns the whole partner.
export function uploadPartnerPoster(id, placement, file) {
  const form = new FormData()
  form.append('file', file)
  return httpClient.post(`${PARTNERS}/${id}/creatives/${placement}/poster`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

// { videoId, thumbnailUrl } for a YouTube link the backend accepts; otherwise an error with details.youtubeUrl. Nothing is saved
// and YouTube is not called.
export function checkYoutube(url) {
  return httpClient.get(`${PARTNERS}/youtube/check`, { params: { url } })
}

// { popupDefaults: { trigger, delaySeconds, scrollPercent, frequency, frequencyDays }, sidebar: { layout, perSlide, rotate,
//   intervalSeconds } (the sidebar slideshow settings), limits: { popupDelayMin, popupDelayMax,
//   popupScrollMin, popupScrollMax, popupFrequencyDaysMin, popupFrequencyDaysMax, imageMaxBytes, videoMaxBytes,
//   videoMaxSeconds } }: the current site defaults of the popup and the limits the form shows as hints.
export function getPartnerOptions() {
  return httpClient.get(`${PARTNERS}/options`)
}

// Saves (or replaces) the square logo (PNG, JPG or WebP, 2 MB): the server makes the 256 and 128 px variants. The logo is used
// by the bottom bar of a phone and by the sidebar layout "Logos". Returns the whole partner (logoUrl, logoSmallUrl).
export function uploadPartnerLogo(id, file) {
  const form = new FormData()
  form.append('file', file)
  return httpClient.post(`${PARTNERS}/${id}/logo`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export function deletePartnerLogo(id) {
  return httpClient.delete(`${PARTNERS}/${id}/logo`)
}

// Removes the image of one placement (the placement is then not used). Returns the whole partner.
export function deletePartnerImage(id, placement) {
  return httpClient.delete(`${PARTNERS}/${id}/creatives/${placement}`)
}

// { sponsorId, sponsorName, from, to, totals: { impressions, clicks, clickRate, videoPlays, videoCompletes,
//   completionRate }, byDay: [{ date, impressions, clicks, clickRate, videoPlays, videoCompletes, completionRate }]
//   (every day, zeros included), byPlacement: [{ placement: ARTICLE_SIDEBAR | ARTICLE_POPUP, impressions, clicks, clickRate,
//   videoPlays, ... }], byDevice: [{ placement: 'ARTICLE_POPUP', device: DESKTOP | MOBILE, ... }] (the popup on a computer
//   and the bar on a phone), rows }
// clickRate (clicks per 100 views) and completionRate (completions per 100 plays) are percentages with two decimals.
export function getPartnerStats(id, { from, to } = {}) {
  return httpClient.get(`${PARTNERS}/${id}/stats`, { params: { from, to } })
}

// { from, to, totals, sponsors: [{ sponsorId, sponsorName, impressions, clicks, clickRate, videoPlays, videoCompletes,
//   completionRate }] } for every partner
export function getPartnerSummary({ from, to } = {}) {
  return httpClient.get(`${PARTNERS}/stats/summary`, { params: { from, to } })
}

// The daily rows as a CSV file (a Blob), of one partner or, without an id, of all.
export function exportPartnerStats({ id, from, to } = {}) {
  return httpClient.get(`${PARTNERS}/stats/export`, { params: { sponsorId: id, from, to }, responseType: 'blob' })
}
