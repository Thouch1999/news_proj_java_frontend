import { useEffect } from 'react'
import { useSettings } from './useSettings'

// Tells the page's own title and, when given, meta description to SettingsProvider, which sets the browser tab with the
// site's title format (setting title_format, for example "<title> | News Portal"), the default description and the share
// image. Both go back to the site's own when the page is left.
// `image` (optional) is the share image of the page (an article's thumbnail); the setting's share image is the default.
export function usePageMeta(title, description, image) {
  const { setPageMeta } = useSettings()
  useEffect(() => {
    setPageMeta({ title, description, image })
    return () => setPageMeta(null)
  }, [title, description, image, setPageMeta])
}
