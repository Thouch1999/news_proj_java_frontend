import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Dropdown, Offcanvas } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { BoxArrowRight, BoxArrowUpRight, List, Person } from 'react-bootstrap-icons'
import LanguageSwitch from '../components/common/LanguageSwitch'
import NotificationBell from '../components/notifications/NotificationBell'
import UserAvatar from '../components/common/UserAvatar'
import { SuperAdminBadge } from '../components/common/UserParts'
import DashboardMenu from '../components/common/DashboardMenu'
import ThemeToggle from '../components/common/ThemeToggle'
import { buildMenu } from '../constants/dashboardMenu'
import { ROLES } from '../constants/roles'
import { ROUTES } from '../constants/routes'
import ReviewCountProvider from '../context/ReviewCountProvider'
import { useAuth } from '../hooks/useAuth'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useReviewCount } from '../hooks/useReviewCount'
import { useSettings } from '../hooks/useSettings'

const YEAR = new Date().getFullYear()

// The dashboards in the style of the dark admin template of the Laravel news site (Upcube): a fixed top bar, a fixed
// sidebar, and a deep blue-gray page (see _theme.scss). The user's name and photo are in the menu of the top bar.
function DashboardShell() {
  const { t } = useTranslation()
  const { user, hasAnyRole, logout } = useAuth()
  const { dashboardName, logoSrc, copyright } = useSettings()
  const { count: pending } = useReviewCount()
  const [menuOpen, setMenuOpen] = useState(false)
  const nodes = buildMenu(hasAnyRole) // single entries and groups, for the roles of this user
  const mobile = useMediaQuery('(max-width: 767.98px)') // the menu is an offcanvas
  const tablet = useMediaQuery('(min-width: 768px) and (max-width: 991.98px)') // the menu is icons with flyouts
  const [shell, setShell] = useState(null) // the offcanvas is drawn inside the shell, so it has the colours of the dashboard
  const name = user?.fullName || user?.username || ''

  return (
    <div className="dashboard-shell" ref={setShell}>
      <header className="dashboard-topbar">
        <div className="d-flex align-items-center">
          <Link to={ROUTES.HOME} className="brand">
            <img src={logoSrc} alt="" height="32" className="site-logo" />
            <span className="brand-name">{dashboardName}</span>
          </Link>
          <button type="button" className="btn btn-link p-1 d-md-none" aria-label={t('dashboard.layout.toggleMenu')} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            <List size={26} />
          </button>
        </div>
        <div className="d-flex align-items-center gap-2">
        <LanguageSwitch />
        <ThemeToggle />
        <NotificationBell />
        <Dropdown align="end">
          <Dropdown.Toggle variant="outline-secondary" size="sm" className="header-control d-flex align-items-center gap-2">
            <UserAvatar src={user?.avatar} name={name} size={26} />
            <span className="d-none d-sm-inline">{name}</span>
            {user?.superAdmin && <SuperAdminBadge compact />}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {user?.superAdmin && (
              <Dropdown.ItemText>
                <SuperAdminBadge />
              </Dropdown.ItemText>
            )}
            <Dropdown.Item as={Link} to={ROUTES.DASHBOARD_PROFILE}>
              <Person className="me-2" />
              {t('dashboard.layout.myProfile')}
            </Dropdown.Item>
            <Dropdown.Item as={Link} to={ROUTES.HOME}>
              <BoxArrowUpRight className="me-2" />
              {t('dashboard.layout.backToSite')}
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={logout}>
              <BoxArrowRight className="me-2" />
              {t('dashboard.layout.logOut')}
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        </div>
      </header>

      {mobile ? (
        <Offcanvas show={menuOpen} onHide={() => setMenuOpen(false)} container={shell} className="dashboard-offcanvas" aria-label={t('dashboard.menu.label')}>
          <Offcanvas.Header closeButton closeLabel={t('common.actions.close')}>
            <Offcanvas.Title as="span">{dashboardName}</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <DashboardMenu nodes={nodes} pending={pending ?? 0} onNavigate={() => setMenuOpen(false)} />
          </Offcanvas.Body>
        </Offcanvas>
      ) : (
        <aside className={`dashboard-sidebar${tablet ? ' is-collapsed' : ''}`}>
          <DashboardMenu nodes={nodes} pending={pending ?? 0} collapsed={tablet} />
        </aside>
      )}

      <div className="dashboard-main">
        <main className="dashboard-content">
          <Outlet />
        </main>
        <footer className="dashboard-footer">{copyright || t('dashboard.layout.footer', { year: YEAR, name: dashboardName })}</footer>
      </div>
    </div>
  )
}

// The count of articles waiting for review is only for the editor and the admin
export default function DashboardLayout() {
  const { hasAnyRole } = useAuth()
  return (
    <ReviewCountProvider enabled={hasAnyRole([ROLES.ADMIN, ROLES.EDITOR])}>
      <DashboardShell />
    </ReviewCountProvider>
  )
}
