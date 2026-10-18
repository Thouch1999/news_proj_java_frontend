import { ArrowLeft } from 'react-bootstrap-icons'
import { Link, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitch from '../components/common/LanguageSwitch'
import ThemeToggle from '../components/common/ThemeToggle'
import { ROUTES } from '../constants/routes'
import { useSettings } from '../hooks/useSettings'

const YEAR = new Date().getFullYear()

// The layout of Login, Register, Verify email, Forgot password and Reset password: a slim header (an arrow, the logo
// and the site name as one link back to the site, then language and colour mode), the page centred in the middle and
// a slim one-line footer. The page is as high as the screen at least, so a short form fits without scrolling; when the
// screen is too short the page simply grows and scrolls. The pages put their logo, title and card in <AuthPage>.
export default function AuthLayout() {
  const { t } = useTranslation()
  const { siteName, logoSrc, copyright, contact } = useSettings()
  return (
    <div className="auth-shell">
      <header className="auth-header">
        <div className="auth-header__inner">
          <Link to={ROUTES.HOME} className="auth-header__brand" aria-label={t('auth.layout.back', { site: siteName })} title={t('auth.layout.back', { site: siteName })}>
            <ArrowLeft aria-hidden="true" className="flex-shrink-0" />
            <img src={logoSrc} alt="" height="28" className="site-logo" />
            <span>{siteName}</span>
          </Link>
          <div className="d-flex align-items-center gap-2">
            <LanguageSwitch />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="auth-main">
        <Outlet />
      </main>

      <footer className="auth-footer">
        {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
        <span>{copyright || `© ${YEAR} ${siteName}`}</span>
      </footer>
    </div>
  )
}
