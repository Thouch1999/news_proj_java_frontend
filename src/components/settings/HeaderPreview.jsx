import { useTranslation } from 'react-i18next'
import { useResolvedTheme } from '../../hooks/useResolvedTheme'
import { DEFAULT_ACCENT, DEFAULT_PRIMARY } from '../../utils/sitePalette'
import { ensureContrast, HEX_COLOR, onColor } from '../../utils/color'

// A small copy of the site header (logo, site name, menu, accent button) and a card under it, drawn with the colours that
// are typed in the form, so a change shows while typing. An invalid colour shows as the built-in one. The text colours are
// worked out as on the real site (utils/sitePalette.js): readable on the colour, the colour moved where it is text.
export default function HeaderPreview({ siteName, logoSrc, primary, accent }) {
  const { t } = useTranslation()
  const theme = useResolvedTheme()
  const background = HEX_COLOR.test(primary) ? primary.toUpperCase() : DEFAULT_PRIMARY
  const highlight = HEX_COLOR.test(accent) ? accent.toUpperCase() : DEFAULT_ACCENT
  const surface = theme === 'dark' ? '#252B3B' : '#FFFFFF'
  const text = onColor(background)
  const brand = ensureContrast(highlight, background, 3)
  const accentText = ensureContrast(highlight, surface, 4.5)
  const linkText = ensureContrast(background, surface, 4.5)

  return (
    <div className="border rounded overflow-hidden" role="img" aria-label={t('dashboard.settings.preview.label')}>
      <div className="d-flex flex-wrap align-items-center gap-3 px-3 py-2" style={{ background, color: text }}>
        <span className="d-flex align-items-center gap-2 fw-bold fs-5" style={{ color: brand }}>
          <img src={logoSrc} alt="" height="28" className="site-logo" />
          <span>{siteName}</span>
        </span>
        <span className="small d-flex gap-3">
          <span>{t('dashboard.settings.preview.home')}</span>
          <span>{t('dashboard.settings.preview.news')}</span>
        </span>
        <span className="ms-auto badge" style={{ background: highlight, color: onColor(highlight) }}>
          {t('dashboard.settings.preview.logIn')}
        </span>
      </div>
      <div className="p-3" style={{ background: surface, color: theme === 'dark' ? '#B4BDCD' : '#3F4A5A' }}>
        <span className="d-inline-block px-3 py-1 fw-bold me-2" style={{ background: highlight, color: onColor(highlight) }}>
          {t('dashboard.settings.preview.section')}
        </span>
        <a href="#preview" onClick={(event) => event.preventDefault()} style={{ color: linkText }} tabIndex={-1}>
          {t('dashboard.settings.preview.link')}
        </a>
        <span className="ms-2 small" style={{ color: accentText }}>
          {t('dashboard.settings.preview.date')}
        </span>
      </div>
    </div>
  )
}
