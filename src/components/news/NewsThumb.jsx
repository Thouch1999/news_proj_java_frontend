import { useState } from 'react'
import { useSettings } from '../../hooks/useSettings'
import { mediaUrl } from '../../utils/mediaUrl'

// The picture of an article, filling its box (put it in a `ratio` element). An article without a picture, or one whose
// picture does not load, shows a light tint of the primary colour with the site logo (the first letter of the site name
// when the logo does not load), never a blank grey box.
export default function NewsThumb({ src, className = '' }) {
  const { logoSrc, siteName } = useSettings()
  const [failed, setFailed] = useState(null) // the src that did not load
  const [logoFailed, setLogoFailed] = useState(false)

  if (src && failed !== src) {
    return <img src={mediaUrl(src)} alt="" loading="lazy" className={`object-fit-cover ${className}`} onError={() => setFailed(src)} />
  }
  return (
    <div className={`news-thumb-placeholder ${className}`} aria-hidden="true">
      {logoSrc && !logoFailed ? <img src={logoSrc} alt="" className="site-logo news-thumb-placeholder__logo" onError={() => setLogoFailed(true)} /> : <span>{(siteName || '?').charAt(0).toUpperCase()}</span>}
    </div>
  )
}
