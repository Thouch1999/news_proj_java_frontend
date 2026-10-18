import { Card } from 'react-bootstrap'

// A card of a form or a detail page: a title bar and a body. The same on the Add user page and the user page.
export default function FormCard({ title, children, className = '' }) {
  return (
    <Card className={className}>
      <Card.Header className="bg-surface">
        <h2 className="h6 mb-0">{title}</h2>
      </Card.Header>
      <Card.Body>{children}</Card.Body>
    </Card>
  )
}
