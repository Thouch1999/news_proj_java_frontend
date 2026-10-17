import { Card, Col, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="h4 mb-3">Admin dashboard</h1>
      <Row className="g-3">
        <Col md={6} lg={4}>
          <Card body>
            <Card.Title className="h6">Users</Card.Title>
            <Card.Text className="text-muted">Search, create and manage user accounts.</Card.Text>
            <Link to={ROUTES.ADMIN_USERS}>Manage users</Link>
          </Card>
        </Col>
        <Col md={6} lg={4}>
          <Card body>
            <Card.Title className="h6">News</Card.Title>
            <Card.Text className="text-muted">See, edit, publish, restore and delete the articles of all authors.</Card.Text>
            <Link to={ROUTES.ADMIN_NEWS}>Manage news</Link>
          </Card>
        </Col>
        <Col md={6} lg={4}>
          <Card body>
            <Card.Title className="h6">Review queue</Card.Title>
            <Card.Text className="text-muted">Review the articles waiting to be published.</Card.Text>
            <Link to={ROUTES.ADMIN_REVIEW}>Open the queue</Link>
          </Card>
        </Col>
        <Col md={6} lg={4}>
          <Card body>
            <Card.Title className="h6">Roles</Card.Title>
            <Card.Text className="text-muted">See what each role is allowed to do.</Card.Text>
            <Link to={ROUTES.ADMIN_ROLES}>View roles</Link>
          </Card>
        </Col>
        <Col md={6} lg={4}>
          <Card body>
            <Card.Title className="h6">Categories</Card.Title>
            <Card.Text className="text-muted">Create categories and control which ones are shown.</Card.Text>
            <Link to={ROUTES.ADMIN_CATEGORIES}>Manage categories</Link>
          </Card>
        </Col>
        <Col md={6} lg={4}>
          <Card body>
            <Card.Title className="h6">Tags</Card.Title>
            <Card.Text className="text-muted">Create, rename and delete tags.</Card.Text>
            <Link to={ROUTES.ADMIN_TAGS}>Manage tags</Link>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
