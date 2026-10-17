import { Outlet } from 'react-router-dom'
import { Card, Container } from 'react-bootstrap'

export default function AuthLayout() {
  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <Container style={{ maxWidth: 460 }}>
        <Card body className="shadow-sm">
          <Outlet />
        </Card>
      </Container>
    </div>
  )
}
