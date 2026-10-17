import { Card, Col, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

export default function EditorHomePage() {
  return (
    <div>
      <h1 className="h4 mb-3">Editor dashboard</h1>
      <Row className="g-3">
        <Col md={6} lg={4}>
          <Card body>
            <Card.Title className="h6">Review queue</Card.Title>
            <Card.Text className="text-muted">Read the articles waiting for review, then publish or reject them.</Card.Text>
            <Link to={ROUTES.EDITOR_REVIEW}>Open the queue</Link>
          </Card>
        </Col>
        <Col md={6} lg={4}>
          <Card body>
            <Card.Title className="h6">All articles</Card.Title>
            <Card.Text className="text-muted">Filter by status, category or author, edit articles and archive published ones.</Card.Text>
            <Link to={ROUTES.EDITOR_NEWS}>See all articles</Link>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
