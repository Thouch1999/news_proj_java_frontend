import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Col, Container, Dropdown, Form, Nav, NavDropdown, Navbar, Row } from 'react-bootstrap'
import { BoxArrowRight, Envelope, Facebook, GeoAlt, Search, Telegram, Telephone, Tiktok, Youtube } from 'react-bootstrap-icons'
import LanguageSwitch from '../components/common/LanguageSwitch'
import UserAvatar from '../components/common/UserAvatar'
import ThemeToggle from '../components/common/ThemeToggle'
import { categoryPath, HOME_BY_ROLE, ROUTES } from '../constants/routes'
import { useActiveCategories } from '../hooks/useActiveCategories'
import { useAuth } from '../hooks/useAuth'
import { useSettings } from '../hooks/useSettings'
import { useUrlKeyword } from '../hooks/useUrlKeyword'

const YEAR = new Date().getFullYear()
// the pages that list news and have the search in their toolbar
const isListPath = (pathname) => pathname === ROUTES.NEWS || pathname.startsWith('/category/') || pathname.startsWith('/tag/')
const SOCIAL_ICONS = { facebook: Facebook, telegram: Telegram, youtube: Youtube, tiktok: Tiktok }

export default function PublicLayout() {
  const { t } = useTranslation()
  const { user, isAuthenticated, logout } = useAuth()
  const { categories } = useActiveCategories()
  const { siteName, tagline, logoSrc, footerDescription, copyright, contact, social, headerTheme } = useSettings()
  // the header takes the primary colour of the settings: its buttons are white on a dark colour and dark on a light one
  const headerButton = headerTheme === 'dark' ? 'outline-light' : 'outline-dark'
  const displayName = user?.fullName || user?.username
  const dashboardPath = user ? HOME_BY_ROLE[user.role] : ROUTES.HOME
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // One search: on a news page the box shows and changes the ?keyword= of the page (the toolbar shows the same text);
  // anywhere else it opens the news list with the keyword.
  const onList = isListPath(pathname)
  const urlKeyword = useUrlKeyword()
  const [keyword, setKeyword] = useState('')
  const keywordValue = onList ? urlKeyword.value : keyword
  const changeKeyword = onList ? urlKeyword.setValue : setKeyword

  const handleSearch = (event) => {
    event.preventDefault()
    if (onList) {
      urlKeyword.commit()
      return
    }
    const text = keyword.trim()
    navigate(text ? `${ROUTES.NEWS}?${new URLSearchParams({ keyword: text })}` : ROUTES.NEWS)
    setKeyword('')
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* the navy sticky header of the Laravel news site: red logo, white menu, white search box (see _theme.scss) */}
      <Navbar expand="lg" data-bs-theme={headerTheme} className="news-header py-2">
        <Container>
          <Navbar.Brand as={Link} to={ROUTES.HOME} className="d-flex align-items-center gap-2">
            <img src={logoSrc} alt="" height="32" className="site-logo" />
            <span>{siteName}</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="public-navbar" aria-label={t('public.header.toggleNavigation')} />
          <Navbar.Collapse id="public-navbar">
            {/* active categories from the API */}
            <Nav className="me-auto">
              <Nav.Link as={NavLink} to={ROUTES.HOME} end>
                {t('public.header.home')}
              </Nav.Link>
              <Nav.Link as={NavLink} to={ROUTES.NEWS} end>
                {t('public.header.news')}
              </Nav.Link>
              {categories.length === 0 ? (
                <Nav.Link disabled>{t('public.header.categories')}</Nav.Link>
              ) : (
                <NavDropdown title={t('public.header.categories')} id="category-menu">
                  {categories.map((category) => (
                    <NavDropdown.Item key={category.id} as={Link} to={categoryPath(category.slug)}>
                      {category.name}
                    </NavDropdown.Item>
                  ))}
                </NavDropdown>
              )}
            </Nav>
            {/* the search box opens the news list with ?keyword= (the list has the other filters) */}
            <Form className="news-search d-flex me-lg-3 my-2 my-lg-0" role="search" onSubmit={handleSearch}>
              <Form.Control type="search" maxLength={100} placeholder={t('public.header.searchPlaceholder')} aria-label={t('common.actions.search')} value={keywordValue} onChange={(event) => changeKeyword(event.target.value)} />
              <Button type="submit" aria-label={t('common.actions.search')}>
                <Search />
              </Button>
            </Form>
            <div className="me-lg-2 my-2 my-lg-0">
              <LanguageSwitch variant={headerButton} />
            </div>
            <div className="me-lg-2 my-2 my-lg-0">
              <ThemeToggle variant={headerButton} />
            </div>
            {isAuthenticated ? (
              <Dropdown align="end">
                <Dropdown.Toggle variant={headerButton} className="d-flex align-items-center gap-2">
                  <UserAvatar src={user?.avatar} name={displayName} size={24} />
                  <span>{displayName}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {dashboardPath !== ROUTES.HOME && (
                    <Dropdown.Item as={Link} to={dashboardPath}>
                      {t('public.header.dashboard')}
                    </Dropdown.Item>
                  )}
                  <Dropdown.Item as={Link} to={ROUTES.BOOKMARKS}>
                    {t('public.header.myBookmarks')}
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to={dashboardPath !== ROUTES.HOME ? ROUTES.DASHBOARD_PROFILE : ROUTES.PROFILE}>
                    {t('public.header.myProfile')}
                  </Dropdown.Item>
                  <Dropdown.Item onClick={logout}>
                    <BoxArrowRight className="me-2" />
                    {t('public.header.logOut')}
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <div className="d-flex gap-2">
                <Button as={Link} to={ROUTES.REGISTER} variant={headerButton}>
                  {t('public.header.register')}
                </Button>
                <Button as={Link} to={ROUTES.LOGIN} variant="danger">
                  {t('public.header.logIn')}
                </Button>
              </div>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <main className="flex-grow-1 py-4">
        <Container>
          <Outlet />
        </Container>
      </main>
      <footer className="news-footer mt-4">
        <Container>
          <Row className="g-4 align-items-start">
            <Col md={4}>
              <div className="footer-logo d-flex align-items-center gap-2 mb-2">
                <img src={logoSrc} alt="" height="40" className="site-logo" />
                <span>{siteName}</span>
              </div>
              {tagline && <p className="small mb-2">{tagline}</p>}
              {social.length > 0 && (
                <ul className="list-inline footer-social mb-0">
                  {social.map(({ id, url }) => {
                    const Icon = SOCIAL_ICONS[id]
                    return (
                      <li key={id} className="list-inline-item">
                        <a href={url} target="_blank" rel="noopener noreferrer" aria-label={t(`public.footer.social.${id}`)} title={t(`public.footer.social.${id}`)}>
                          <Icon size={20} aria-hidden="true" />
                        </a>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Col>
            <Col md={5}>
              {footerDescription && <p className="mb-2">{footerDescription}</p>}
              {(contact.email || contact.phone || contact.address) && (
                <ul className="footer-contact list-unstyled small mb-0">
                  {contact.email && (
                    <li>
                      <Envelope className="me-2" aria-label={t('public.footer.contact.email')} />
                      <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    </li>
                  )}
                  {contact.phone && (
                    <li>
                      <Telephone className="me-2" aria-label={t('public.footer.contact.phone')} />
                      <a href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}>{contact.phone}</a>
                    </li>
                  )}
                  {contact.address && (
                    <li className="footer-address">
                      <GeoAlt className="me-2" aria-label={t('public.footer.contact.address')} />
                      {contact.address}
                    </li>
                  )}
                </ul>
              )}
            </Col>
            <Col md={3}>
              <ul className="footer-links list-unstyled mb-0">
                <li>
                  <Link to={ROUTES.HOME}>{t('public.header.home')}</Link>
                </li>
                <li>
                  <Link to={ROUTES.NEWS}>{t('public.footer.allNews')}</Link>
                </li>
                {isAuthenticated && (
                  <li>
                    <Link to={ROUTES.BOOKMARKS}>{t('public.header.myBookmarks')}</Link>
                  </li>
                )}
              </ul>
            </Col>
          </Row>
          <div className="footer-copyright small mt-4 pt-3">{copyright || `© ${YEAR} ${siteName}`}</div>
        </Container>
      </footer>
    </div>
  )
}
