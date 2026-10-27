import { CameraVideo, Image as ImageIcon, Youtube } from 'react-bootstrap-icons'

// Promotions (the backend calls them sponsors; /api/v1/promos and /api/v1/admin/promos). The code, the files and the CSS
// say "promo" and "partner" on purpose: ad blockers hide anything named ad, ads, banner or sponsor.

// The placements of the backend (SponsorPlacement): the size each is displayed at (px) and the size to upload for sharp
// retina screens (the backend stores one file per placement and does not resize it).
export const PLACEMENTS = [
  { id: 'ARTICLE_SIDEBAR', width: 300, height: 250, uploadWidth: 600, uploadHeight: 500 },
  { id: 'ARTICLE_POPUP', width: 600, height: 400, uploadWidth: 1200, uploadHeight: 800 },
  { id: 'MOBILE_BOTTOM_BAR', width: 128, height: 128, uploadWidth: 256, uploadHeight: 256 }, // the square logo
]

export const PLACEMENT_IDS = PLACEMENTS.map((placement) => placement.id)
export const PLACEMENT = Object.fromEntries(PLACEMENTS.map((placement) => [placement.id, placement]))

// The places an admin chooses for a sponsor. The popup is also the bar at the bottom of a phone: the bar image
// (MOBILE_BOTTOM_BAR) is an optional extra of the popup, never a place of its own.
export const CHOICES = ['ARTICLE_SIDEBAR', 'ARTICLE_POPUP']

export const PLACEMENT_SIDEBAR = 'ARTICLE_SIDEBAR'
export const PLACEMENT_POPUP = 'ARTICLE_POPUP'
export const PLACEMENT_BAR = 'MOBILE_BOTTOM_BAR'

export const PROMO_LANGUAGES = ['ALL', 'EN', 'KM']
export const PARTNER_STATUSES = ['active', 'scheduled', 'ended', 'inactive']

export const WEIGHT_MIN = 1
export const WEIGHT_MAX = 100
export const WEIGHT_DEFAULT = 10

// the longest texts (the same as the backend)
export const PARTNER_MAX = { name: 150, title: 150, description: 300, ctaText: 50, targetUrl: 500 }

// A popup is never shown at once when the page opens: the delay is at least this many seconds (the backend limit is the same)
export const POPUP_MIN_DELAY_SECONDS = 5

// What the page follows when an answer carries no popup rules (the same as the site defaults of the backend)
export const POPUP_FALLBACK = { trigger: 'FIRST_OF_BOTH', delaySeconds: 15, scrollPercent: 50, frequency: 'PER_DAY', frequencyDays: 3 }

// The day (yyyy-MM-dd, the reader's calendar) a sponsor's popup or bottom bar was last shown, in localStorage, one key per
// sponsor: `${POPUP_SEEN_KEY}-${sponsorId}`. The popup and the bar of a sponsor share it.
export const POPUP_SEEN_KEY = 'news-promo-seen'

// a looping video counts as completed at this share of its length
export const VIDEO_COMPLETE_RATIO = 0.95

// a viewer counts when at least half of the promo is visible for one second
export const VIEW_RATIO = 0.5
export const VIEW_MILLISECONDS = 1000

// the sponsors of the admin list are loaded at once (the backend allows 100 per page)
export const PARTNER_LIST_SIZE = 100

// ---- the admin form: media and popup timing (the backend: SponsorMediaType, PopupTrigger, PopupFrequency) ----

export const MEDIA_IMAGE = 'IMAGE'
export const MEDIA_VIDEO = 'VIDEO_FILE'
export const MEDIA_YOUTUBE = 'YOUTUBE'

// the media a place accepts (the phone bar is always an image and is not chosen here)
export const MEDIA_BY_PLACEMENT = {
  ARTICLE_SIDEBAR: [MEDIA_IMAGE, MEDIA_VIDEO],
  ARTICLE_POPUP: [MEDIA_IMAGE, MEDIA_VIDEO, MEDIA_YOUTUBE],
}

// the small icon of each media type (the sponsor list and the media switch of the form)
export const MEDIA_ICON = { [MEDIA_IMAGE]: ImageIcon, [MEDIA_VIDEO]: CameraVideo, [MEDIA_YOUTUBE]: Youtube }

export const VIDEO_FILE_TYPES = ['video/mp4', 'video/webm']

export const POPUP_TRIGGERS = ['DELAY', 'SCROLL', 'FIRST_OF_BOTH']
export const POPUP_FREQUENCIES = ['PER_VISIT', 'PER_DAY', 'EVERY_N_DAYS']

// The limits and the site defaults the form uses when GET /api/v1/admin/promos/options cannot be read: the same numbers as
// the backend (SettingKey, SponsorServiceImpl). The backend decides; its answer replaces these.
export const OPTIONS_FALLBACK = {
  popupDefaults: { trigger: 'FIRST_OF_BOTH', delaySeconds: 15, scrollPercent: 50, frequency: 'PER_DAY', frequencyDays: 3 },
  limits: {
    popupDelayMin: 5,
    popupDelayMax: 120,
    popupScrollMin: 20,
    popupScrollMax: 90,
    popupFrequencyDaysMin: 1,
    popupFrequencyDaysMax: 30,
    imageMaxBytes: 2 * 1024 * 1024,
    videoMaxBytes: 15 * 1024 * 1024,
    videoMaxSeconds: 30,
  },
}

// the YouTube video id of a saved sponsor as a link the admin can read and change
export const youtubeLink = (id) => `https://youtu.be/${id}`

// ---- the sidebar slideshow (the backend: SidebarLayout and the sponsor_sidebar_* settings) ----

export const SIDEBAR_LAYOUTS = ['LIST_1', 'GRID_2', 'LOGOS_4']
export const SIDEBAR_COUNT_MIN = 1
export const SIDEBAR_COUNT_MAX = 12
export const SIDEBAR_INTERVAL_MIN = 5
export const SIDEBAR_INTERVAL_MAX = 60
// the most sponsors that take part in the rotation (the backend sends at most this many)
export const SIDEBAR_MAX_ITEMS = 24
