import { useEffect } from 'react'

const SITE_TITLE = 'News Portal'

// Sets the browser tab title ("<title> | News Portal") and, when given, the meta description; both go back to
// their previous value when the page is left.
export function usePageMeta(title, description) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title ? `${title} | ${SITE_TITLE}` : SITE_TITLE

    let meta = document.head.querySelector('meta[name="description"]')
    const created = !meta
    const previousDescription = meta?.getAttribute('content')
    if (description) {
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'description')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', description)
    }

    return () => {
      document.title = previousTitle
      if (description && meta) {
        if (created) {
          meta.remove()
        } else if (previousDescription !== null && previousDescription !== undefined) {
          meta.setAttribute('content', previousDescription)
        } else {
          meta.removeAttribute('content')
        }
      }
    }
  }, [title, description])
}
