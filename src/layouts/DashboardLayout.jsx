import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Badge, Dropdown, Nav } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { BoxArrowRight, BoxArrowUpRight, List, Person } from 'react-bootstrap-icons'
import LanguageSwitch from '../components/common/LanguageSwitch'
import NotificationBell from '../components/notifications/NotificationBell'
import UserAvatar from '../components/common/UserAvatar'
import { SuperAdminBadge } from '../components/common/UserParts'
import ThemeToggle from '../components/common/ThemeToggle'
import { DASHBOARD_MENU, MENU_GROUPS } from '../constants/dashboardMenu'
import { ROLES } from '../constants/roles'
import { ROUTES } from '../constants/routes'
import ReviewCountProvider from '../context/ReviewCountProvider'
import { useAuth } from '../hooks/useAuth'
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
  const menu = DASHBOARD_MENU.filter((item) => hasAnyRole(item.roles))
  const name = user?.fullName || user?.username || ''

  return (
    <div className="dashboard-shell">
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

      <aside className={`dashboard-sidebar ${menuOpen ? '' : 'd-none'} d-md-block`}>
        {MENU_GROUPS.map((group) => {
          const items = menu.filter((item) => item.group === group)
          if (items.length === 0) return null
          return (
            <Nav key={group} className="flex-column" aria-label={t(`dashboard.menu.groups.${group}`)}>
              <div className="menu-title">{t(`dashboard.menu.groups.${group}`)}</div>
              {items.map(({ icon: Icon, ...item }) => (
                <Nav.Link key={item.to} as={NavLink} to={item.to} end={item.end ?? false} onClick={() => setMenuOpen(false)}>
                  <Icon className="me-2" aria-hidden="true" />
                  {t(item.labelKey)}
                  {item.badge === 'review' && pending > 0 && (
                    <Badge pill bg="" className="menu-badge ms-auto" aria-label={t('dashboard.menu.pendingCount', { count: pending })}>
                      {pending > 99 ? '99+' : pending}
                    </Badge>
                  )}
                </Nav.Link>
              ))}
            </Nav>
          )
        })}
      </aside>

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
