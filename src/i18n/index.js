import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import km from './locales/km.json'

// Languages of the UI. The choice is saved in localStorage and put on <html lang>. Text that comes from the database
// (articles, category and tag names, user names) is never translated.
export const LANGUAGES = ['en', 'km']
export const DEFAULT_LANGUAGE = 'en'
export const LANGUAGE_KEY = 'news-language'

// The locale used by Intl for dates and numbers (Khmer month names in Khmer mode).
const INTL_LOCALE = { en: 'en-US', km: 'km-KH' }
export const intlLocale = (language) => INTL_LOCALE[language] ?? INTL_LOCALE[DEFAULT_LANGUAGE]

// whether the visitor has chosen a language (the default language of the settings is only for a first visit)
export function hasStoredLanguage() {
  try {
    return LANGUAGES.includes(localStorage.getItem(LANGUAGE_KEY))
  } catch {
    return false
  }
}

function storedLanguage() {
  try {
    const value = localStorage.getItem(LANGUAGE_KEY)
    return LANGUAGES.includes(value) ? value : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

export function setLanguage(language) {
  try {
    localStorage.setItem(LANGUAGE_KEY, language)
  } catch {
    // blocked storage: the choice lasts until the page is closed
  }
  return i18n.changeLanguage(language)
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, km: { translation: km } },
  lng: storedLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: LANGUAGES,
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
})

const applyHtmlLang = (language) => {
  document.documentElement.lang = language
}
applyHtmlLang(i18n.language)
i18n.on('languageChanged', applyHtmlLang)

export default i18n
