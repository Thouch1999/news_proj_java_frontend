import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Button, Container, Dropdown, Form, Nav, NavDropdown, Navbar } from 'react-bootstrap'
import { BoxArrowRight, PersonCircle, Search } from 'react-bootstrap-icons'
import logo from '../assets/images/logo.svg'
import { categoryPath, HOME_BY_ROLE, ROUTES } from '../constants/routes'
import { useActiveCategories } from '../hooks/useActiveCategories'
import { useAuth } from '../hooks/useAuth'

export default function PublicLayout() {
  const { user, isAuthenticated, logout } = useAuth()
  const { categories } = useActiveCategories()
  const displayName = user?.fullName || user?.username
  const dashboardPath = user ? HOME_BY_ROLE[user.role] : ROUTES.HOME
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')

  const handleSearch = (event) => {
    event.preventDefault()
    const text = keyword.trim()
    navigate(text ? `${ROUTES.NEWS}?${new URLSearchParams({ keyword: text })}` : ROUTES.NEWS)
    setKeyword('')
  }

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
            {/* active categories from the API */}
            <Nav className="me-auto">
              <Nav.Link as={NavLink} to={ROUTES.NEWS} end>
                News
              </Nav.Link>
              {categories.length === 0 ? (
                <Nav.Link disabled>Categories</Nav.Link>
              ) : (
                <NavDropdown title="Categories" id="category-menu">
                  {categories.map((category) => (
                    <NavDropdown.Item key={category.id} as={Link} to={categoryPath(category.slug)}>
                      {category.name}
                    </NavDropdown.Item>
                  ))}
                </NavDropdown>
              )}
            </Nav>
            {/* the search box opens the news list with ?keyword= (the list has the other filters) */}
            <Form className="d-flex me-lg-3 my-2 my-lg-0" role="search" onSubmit={handleSearch}>
              <Form.Control type="search" maxLength={100} placeholder="Search news..." aria-label="Search" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
              <Button type="submit" variant="outline-primary" className="ms-2" aria-label="Search">
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
