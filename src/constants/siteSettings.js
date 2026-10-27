// The system settings (backend: SettingKey, /api/v1/settings). Keys are the backend's snake_case names.

// What the site shows when the settings cannot be loaded (and before they are): the public settings with the backend's
// own defaults. Only the public keys are here; comments_enabled_default is read by the admin page only.
export const DEFAULT_SETTINGS = {
  site_name_en: 'News Portal',
  site_name_km: 'វិបផតថលព័ត៌មាន',
  dashboard_name: 'News Dashboard',
  tagline_en: '',
  tagline_km: '',
  default_language: 'en',
  title_format: '{page} | {site}',
  logo_url: '',
  logo_dark_url: '',
  favicon_url: '',
  primary_color: '#27306D',
  accent_color: '#DA0000',
  footer_description_en: 'The latest and most read news, with categories, search and comments. Log in to bookmark the articles you want to read later.',
  footer_description_km: 'ព័ត៌មានថ្មីៗ និងអានច្រើនបំផុត មានប្រភេទ ការស្វែងរក និងមតិយោបល់។ ចូលគណនីដើម្បីរក្សាទុកអត្ថបទដែលអ្នកចង់អានពេលក្រោយ។',
  copyright_text: '',
  contact_email: '',
  contact_phone: '',
  contact_address: '',
  social_facebook: '',
  social_telegram: '',
  social_youtube: '',
  social_tiktok: '',
  meta_description_en: '',
  meta_description_km: '',
  share_image_url: '',
  news_per_page: '10',
  show_view_count: 'true',
  sponsors_enabled: 'true',
  sponsor_popup_enabled: 'true',
  popup_trigger: 'FIRST_OF_BOTH',
  popup_delay_seconds: '15',
  popup_scroll_percent: '50',
  popup_frequency: 'PER_DAY',
  popup_frequency_days: '3',
  sponsor_sidebar_count: '1',
  sponsor_sidebar_layout: 'LIST_1',
  sponsor_sidebar_rotate: 'true',
  sponsor_sidebar_interval_seconds: '8',
}

// The checks of the admin form, the same as the backend's (SettingKey + SettingValueValidator); the backend decides.
//   max: longest text, required, type: color | email | url | number | boolean, min/max for a number,
//   oneOf: the allowed values, multiline: a TEXT value (line breaks allowed)
export const SETTING_RULES = {
  site_name_en: { max: 100, required: true },
  site_name_km: { max: 100 },
  dashboard_name: { max: 100, required: true },
  tagline_en: { max: 200 },
  tagline_km: { max: 200 },
  default_language: { max: 2, required: true, oneOf: ['en', 'km'] },
  title_format: { max: 100, required: true },
  primary_color: { max: 7, required: true, type: 'color' },
  accent_color: { max: 7, required: true, type: 'color' },
  footer_description_en: { max: 500, multiline: true },
  footer_description_km: { max: 500, multiline: true },
  copyright_text: { max: 200 },
  contact_email: { max: 254, type: 'email' },
  contact_phone: { max: 30 },
  contact_address: { max: 300, multiline: true },
  social_facebook: { max: 300, type: 'url' },
  social_telegram: { max: 300, type: 'url' },
  social_youtube: { max: 300, type: 'url' },
  social_tiktok: { max: 300, type: 'url' },
  meta_description_en: { max: 300, multiline: true },
  meta_description_km: { max: 300, multiline: true },
  news_per_page: { required: true, type: 'number', min: 5, max: 50 },
  comments_enabled_default: { required: true, type: 'boolean' },
  // one word or phrase per line; a comment that contains one is held for review (backend: comment_blocked_words)
  comment_blocked_words: { max: 5000, multiline: true, rows: 8, lines: true },
  show_view_count: { required: true, type: 'boolean' },
  sponsors_enabled: { required: true, type: 'boolean' },
  sponsor_popup_enabled: { required: true, type: 'boolean' },
  // the site defaults of the sponsor popup, inside the safety limits of the backend (SettingKey)
  popup_trigger: { max: 20, required: true, oneOf: ['DELAY', 'SCROLL', 'FIRST_OF_BOTH'] },
  popup_delay_seconds: { required: true, type: 'number', min: 5, max: 120 },
  popup_scroll_percent: { required: true, type: 'number', min: 20, max: 90 },
  popup_frequency: { max: 20, required: true, oneOf: ['PER_VISIT', 'PER_DAY', 'EVERY_N_DAYS'] },
  popup_frequency_days: { required: true, type: 'number', min: 1, max: 30 },
  // the sidebar slideshow
  sponsor_sidebar_count: { required: true, type: 'number', min: 1, max: 12 },
  sponsor_sidebar_layout: { max: 20, required: true, oneOf: ['LIST_1', 'GRID_2', 'LOGOS_4'] },
  sponsor_sidebar_rotate: { required: true, type: 'boolean' },
  sponsor_sidebar_interval_seconds: { required: true, type: 'number', min: 5, max: 60 },
}

// The tabs of the settings page and the group each one saves (PUT /api/v1/settings/{group}). The image settings are not
// here: they are changed by the image upload (see IMAGE_SETTINGS).
export const SETTINGS_TABS = [
  { id: 'general', keys: ['site_name_en', 'site_name_km', 'tagline_en', 'tagline_km', 'dashboard_name', 'default_language', 'title_format'] },
  { id: 'branding', keys: ['primary_color', 'accent_color'] },
  {
    id: 'website',
    keys: [
      'footer_description_en', 'footer_description_km', 'copyright_text', 'contact_email', 'contact_phone', 'contact_address',
      'social_facebook', 'social_telegram', 'social_youtube', 'social_tiktok',
    ],
  },
  { id: 'seo', keys: ['meta_description_en', 'meta_description_km'] },
  { id: 'content', keys: ['news_per_page', 'comments_enabled_default', 'comment_blocked_words', 'show_view_count', 'sponsors_enabled', 'sponsor_popup_enabled', 'popup_trigger', 'popup_delay_seconds', 'popup_scroll_percent', 'popup_frequency', 'popup_frequency_days', 'sponsor_sidebar_count', 'sponsor_sidebar_layout', 'sponsor_sidebar_rotate', 'sponsor_sidebar_interval_seconds'] },
]

// `type` is the last part of POST /api/v1/settings/images/{type}; `group` is where the setting lives (for removing it).
export const IMAGE_SETTINGS = [
  { type: 'logo', key: 'logo_url', group: 'branding' },
  { type: 'logo-dark', key: 'logo_dark_url', group: 'branding' },
  { type: 'favicon', key: 'favicon_url', group: 'branding' },
  { type: 'share-image', key: 'share_image_url', group: 'seo' },
]

export const IMAGE_MAX_BYTES = 2 * 1024 * 1024
export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
export const FAVICON_TYPES = [...IMAGE_TYPES, 'image/x-icon', 'image/vnd.microsoft.icon']
