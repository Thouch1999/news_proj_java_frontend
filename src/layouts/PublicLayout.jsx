import { Link, Outlet } from 'react-router-dom'
import { Button, Container, Dropdown, Form, Nav, NavDropdown, Navbar } from 'react-bootstrap'
import { BoxArrowRight, PersonCircle, Search } from 'react-bootstrap-icons'
import logo from '../assets/images/logo.svg'
import { HOME_BY_ROLE, ROUTES } from '../constants/routes'
import { useActiveCategories } from '../hooks/useActiveCategories'
import { useAuth } from '../hooks/useAuth'

export default function PublicLayout() {
  const { user, isAuthenticated, logout } = useAuth()
  const { categories } = useActiveCategories()
  const displayName = user?.fullName || user?.username
  const dashboardPath = user ? HOME_BY_ROLE[user.role] : ROUTES.HOME

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar bg="white" expand="lg" className="border-bottom">
        <Container>
          <Navbar.Brand as={Link} to={ROUTES.HOME} className="d-flex align-items-center gap-2">
            <img src={logo} alt="" width="28" height="28" />
            <span>News Portal</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="public-navbar" />
          <Navbar.Collapse id="public-navbar">
            {/* active categories from the API; the home page filters by ?category=slug in a later step */}
            <Nav className="me-auto">
              {categories.length === 0 ? (
                <Nav.Link disabled>Categories</Nav.Link>
              ) : (
                <NavDropdown title="Categories" id="category-menu">
                  {categories.map((category) => (
                    <NavDropdown.Item key={category.id} as={Link} to={`${ROUTES.HOME}?category=${category.slug}`}>
                      {category.name}
                    </NavDropdown.Item>
                  ))}
                </NavDropdown>
              )}
            </Nav>
            {/* search box placeholder: not wired yet */}
            <Form className="d-flex me-lg-3 my-2 my-lg-0" role="search" onSubmit={(event) => event.preventDefault()}>
              <Form.Control type="search" placeholder="Search news..." aria-label="Search" disabled />
              <Button variant="outline-primary" className="ms-2" disabled aria-label="Search">
                <Search />
              </Button>
            </Form>
            {isAuthenticated ? (
              <Dropdown align="end">
                <Dropdown.Toggle variant="light" className="d-flex align-items-center gap-2">
                  <PersonCircle />
                  <span>{displayName}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {dashboardPath !== ROUTES.HOME && (
                    <Dropdown.Item as={Link} to={dashboardPath}>
                      Dashboard
                    </Dropdown.Item>
                  )}
                  <Dropdown.Item as={Link} to={ROUTES.PROFILE}>
                    My profile
                  </Dropdown.Item>
                  <Dropdown.Item onClick={logout}>
                    <BoxArrowRight className="me-2" />
                    Log out
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <div className="d-flex gap-2">
                <Button as={Link} to={ROUTES.REGISTER} variant="outline-primary">
                  Register
                </Button>
                <Button as={Link} to={ROUTES.LOGIN} variant="primary">
                  Log in
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
      <footer className="border-top py-3 text-center text-muted small">News Portal</footer>
    </div>
  )
}
