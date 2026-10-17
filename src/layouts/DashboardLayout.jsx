import { NavLink, Outlet } from 'react-router-dom'
import { Button, Col, Container, Nav, Navbar, Row } from 'react-bootstrap'
import { BoxArrowRight } from 'react-bootstrap-icons'
import { DASHBOARD_MENU } from '../constants/dashboardMenu'
import { useAuth } from '../hooks/useAuth'

export default function DashboardLayout() {
  const { user, hasAnyRole, logout } = useAuth()
  const menu = DASHBOARD_MENU.filter((item) => hasAnyRole(item.roles))

  return (
    <div className="min-vh-100 bg-light">
      <Navbar bg="dark" data-bs-theme="dark">
        <Container fluid>
          <Navbar.Brand>News Dashboard</Navbar.Brand>
          <div className="d-flex align-items-center gap-3 text-light">
            <span>{user?.fullName || user?.username}</span>
            <Button variant="outline-light" size="sm" onClick={logout}>
              <BoxArrowRight className="me-1" />
              Log out
            </Button>
          </div>
        </Container>
      </Navbar>
      <Container fluid>
        <Row>
          <Col md={3} lg={2} className="bg-white border-end py-3 min-vh-100">
            <Nav className="flex-column">
              {menu.map((item) => (
                <Nav.Link key={item.to} as={NavLink} to={item.to} end={item.end ?? false}>
                  {item.label}
                </Nav.Link>
              ))}
            </Nav>
          </Col>
          <Col md={9} lg={10} className="py-4">
            <Outlet />
          </Col>
        </Row>
      </Container>
    </div>
  )
}
