import { createContext } from 'react'

// Shape: { settings (the public settings, snake_case keys, text values), loaded, merge(values), setPageMeta({ title, description } | null),
//   siteName, tagline, dashboardName, footerDescription, metaDescription, copyright, contact: { email, phone, address },
//   social: [{ id, url }], logoSrc, faviconSrc, shareImageSrc, headerTheme ('dark' | 'light'), newsPerPage, showViewCount,
//   promos: { enabled, popupEnabled } }  (the popup timing comes with each promo)
// The text of the site comes in the selected language (the Khmer text falls back to the English one when it is empty).
export const SettingsContext = createContext(null)
