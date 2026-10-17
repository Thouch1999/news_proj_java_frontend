import { Card, Col, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

export default function AuthorHomePage() {
  return (
    <div>
      <h1 className="h4 mb-3">Author dashboard</h1>
      <Row className="g-3">
        <Col md={6} lg={4}>
          <Card body>
            <Card.Title className="h6">My articles</Card.Title>
            <Card.Text className="text-muted">See the status of your articles and edit drafts.</Card.Text>
            <Link to={ROUTES.AUTHOR_ARTICLES}>Open my articles</Link>
          </Card>
        </Col>
        <Col md={6} lg={4}>
          <Card body>
            <Card.Title className="h6">Write an article</Card.Title>
            <Card.Text className="text-muted">Start a new draft.</Card.Text>
            <Link to={ROUTES.AUTHOR_ARTICLE_NEW}>New article</Link>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
