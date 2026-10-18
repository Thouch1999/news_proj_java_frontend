import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import defaultLogo from '../assets/images/logo.svg'
import { DEFAULT_SETTINGS } from '../constants/siteSettings'
import { useResolvedTheme } from '../hooks/useResolvedTheme'
import i18n, { hasStoredLanguage, LANGUAGES } from '../i18n'
import * as settingsService from '../services/settingsService'
import { mediaUrl } from '../utils/mediaUrl'
import { applySitePalette, sitePalette } from '../utils/sitePalette'
import { SettingsContext } from './SettingsContext'

const CACHE_KEY = 'news-settings'
const DASHBOARD_PATH = /^\/(admin|editor|author|dashboard)(\/|$)/
const SOCIAL = [
  { id: 'facebook', key: 'social_facebook' },
  { id: 'telegram', key: 'social_telegram' },
  { id: 'youtube', key: 'social_youtube' },
  { id: 'tiktok', key: 'social_tiktok' },
]

// Only the keys of DEFAULT_SETTINGS (the public ones), only text values
function onlyKnown(values) {
  const result = {}
  Object.keys(DEFAULT_SETTINGS).forEach((key) => {
    if (typeof values?.[key] === 'string') result[key] = values[key]
  })
  return result
}

// The last settings that were loaded, so the next visit starts with them (no flash of the default name and colours)
function readCache() {
  try {
    return onlyKnown(JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}'))
  } catch {
    return {}
  }
}

function writeCache(settings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(settings))
  } catch {
    // blocked storage: the next visit just starts with the built-in defaults
  }
}

function setMeta(selector, attribute, name, content) {
  let element = document.head.querySelector(selector)
  if (!content) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function setFavicon(href) {
  let link = document.head.querySelector('link[rel="icon"]')
  if (!href) {
    link?.remove()
    return
  }
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'icon')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

// "{page} | {site}": the placeholders are replaced, the text around them stays
function formatTitle(format, page, site) {
  return format.replaceAll('{page}', page).replaceAll('{site}', site)
}

// Loads the public settings once at startup (GET /api/v1/settings/public) and keeps them for every page. The built-in
// defaults (and the settings of the last visit) are used until they arrive and when the request fails, so the site
// always works. It also puts the settings on the page: the colours, the browser tab (title, icon, description, share
// image) and, for a first visit, the default language. The pages tell it their own title with usePageMeta.
export default function SettingsProvider({ children }) {
  const { i18n: i18nInstance } = useTranslation()
  const language = i18nInstance.language === 'km' ? 'km' : 'en'
  const theme = useResolvedTheme()
  const location = useLocation()
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...readCache() }))
  const [loaded, setLoaded] = useState(false)
  const [pageMeta, setPageMeta] = useState(null)

  useEffect(() => {
    let current = true
    settingsService
      .getPublicSettings()
      .then((data) => {
        if (!current) return
        const known = onlyKnown(data)
        setSettings({ ...DEFAULT_SETTINGS, ...known })
        writeCache(known)
        // the language a first-time visitor gets; a visitor who chose one keeps it
        if (!hasStoredLanguage() && LANGUAGES.includes(known.default_language) && i18n.language !== known.default_language) {
          i18n.changeLanguage(known.default_language)
        }
      })
      .catch(() => {
        // the site keeps the defaults (or the settings of the last visit)
      })
      .finally(() => {
        if (current) setLoaded(true)
      })
    return () => {
      current = false
    }
  }, [])

  // after the admin saves: the new values are on the site at once, without a reload
  const merge = useCallback((values) => {
    const known = onlyKnown(values)
    setSettings((previous) => {
      const next = { ...previous, ...known }
      writeCache(onlyKnown(next))
      return next
    })
  }, [])

  const palette = useMemo(() => sitePalette(settings.primary_color, settings.accent_color, theme), [settings.primary_color, settings.accent_color, theme])
  useEffect(() => {
    applySitePalette(palette)
    setMeta('meta[name="theme-color"]', 'name', 'theme-color', settings.primary_color)
  }, [palette, settings.primary_color])

  const value = useMemo(() => {
    const text = (english, khmer) => (language === 'km' && settings[khmer] ? settings[khmer] : settings[english])
    const image = (path) => (path ? mediaUrl(path) : '')
    const dark = theme === 'dark'
    const logo = dark && settings.logo_dark_url ? settings.logo_dark_url : settings.logo_url
    const perPage = Number.parseInt(settings.news_per_page, 10)
    return {
      settings,
      loaded,
      merge,
      setPageMeta,
      siteName: text('site_name_en', 'site_name_km'),
      tagline: text('tagline_en', 'tagline_km'),
      dashboardName: settings.dashboard_name,
      footerDescription: text('footer_description_en', 'footer_description_km'),
      metaDescription: text('meta_description_en', 'meta_description_km'),
      copyright: settings.copyright_text,
      contact: { email: settings.contact_email, phone: settings.contact_phone, address: settings.contact_address },
      social: SOCIAL.filter((network) => settings[network.key]).map((network) => ({ id: network.id, url: settings[network.key] })),
      logoSrc: logo ? mediaUrl(logo) : defaultLogo,
      faviconSrc: image(settings.favicon_url),
      shareImageSrc: image(settings.share_image_url),
      headerTheme: palette.headerText === '#FFFFFF' ? 'dark' : 'light',
      newsPerPage: Number.isFinite(perPage) ? perPage : 10,
      showViewCount: settings.show_view_count !== 'false',
    }
  }, [settings, loaded, merge, language, theme, palette.headerText])

  // the browser tab
  const { siteName, dashboardName, metaDescription, shareImageSrc, faviconSrc } = value
  const dashboard = DASHBOARD_PATH.test(location.pathname)
  useEffect(() => {
    const site = dashboard ? dashboardName : siteName
    const title = pageMeta?.title ? formatTitle(settings.title_format, pageMeta.title, site) : site
    const description = pageMeta?.description || metaDescription
    document.title = title
    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta('meta[property="og:title"]', 'property', 'og:title', title)
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', site)
    const image = pageMeta?.image || shareImageSrc
    setMeta('meta[property="og:image"]', 'property', 'og:image', image)
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', image ? 'summary_large_image' : 'summary')
    setFavicon(faviconSrc)
  }, [dashboard, dashboardName, siteName, metaDescription, pageMeta, settings.title_format, shareImageSrc, faviconSrc])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
