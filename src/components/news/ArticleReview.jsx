import { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Row } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import ErrorAlert from '../common/ErrorAlert'
import PageSpinner from '../common/PageSpinner'
import { useNewsHistory } from '../../hooks/useNewsHistory'
import * as newsService from '../../services/newsService'
import ArticlePreview from './ArticlePreview'
import StatusBadge from './StatusBadge'
import WorkflowCard from './WorkflowCard'

function ReviewBody({ area, initial }) {
  const [article, setArticle] = useState(initial)
  const [message, setMessage] = useState(null)
  const history = useNewsHistory(article)

  // when the article was sent for review: the last change to PENDING
  const submitted = (history.history ?? []).filter((row) => row.toStatus === 'PENDING').at(-1)

  return (
    <div>
      <div className="mb-3">
        <Link to={area.queuePath}>&larr; Back to the review queue</Link>
      </div>
      {article.status !== 'PENDING' && (
        <Alert variant="info">
          This article is not waiting for review any more (<StatusBadge status={article.status} />).
        </Alert>
      )}
      {message && <Alert variant="success">{message}</Alert>}
      <Row className="g-4">
        <Col lg={8}>
          <ArticlePreview article={article} />
        </Col>
        <Col lg={4}>
          <Card body className="mb-3">
            <dl className="mb-0 small">
              <dt>Author</dt>
              <dd>{article.authorName || 'Unknown author'}</dd>
              <dt>Category</dt>
              <dd>{article.category.name}</dd>
              <dt>Tags</dt>
              <dd>{article.tags.length > 0 ? article.tags.map((tag) => tag.name).join(', ') : 'None'}</dd>
              <dt>Submitted</dt>
              <dd>{submitted?.changedAt ? new Date(submitted.changedAt).toLocaleString() : history.loading ? '...' : 'Not submitted'}</dd>
              <dt>Last changed</dt>
              <dd className="mb-0">{article.updatedAt ? new Date(article.updatedAt).toLocaleString() : ''}</dd>
            </dl>
            {article.editable && (
              <Button as={Link} to={area.editPath(article.id)} variant="outline-primary" size="sm" className="mt-3">
                Edit article
              </Button>
            )}
          </Card>
          <WorkflowCard
            area={area}
            article={article}
            history={history}
            onChange={(updated, done) => {
              setArticle(updated)
              setMessage(done)
            }}
          />
        </Col>
      </Row>
    </div>
  )
}

// Review page: the whole article as readers would see it, with Publish, Reject and Edit.
export default function ArticleReview({ area }) {
  const { id } = useParams()
  const [state, setState] = useState({ id: null, article: null, error: null })
  const loading = state.id !== id

  useEffect(() => {
    let current = true
    newsService
      .getManagedNews(id)
      .then((article) => {
        if (current) setState({ id, article, error: null })
      })
      .catch((error) => {
        if (current) setState({ id, article: null, error })
      })
    return () => {
      current = false
    }
  }, [id])

  if (loading) {
    return <PageSpinner />
  }
  if (state.error) {
    return (
      <div>
        <ErrorAlert error={state.error} />
        <Link to={area.queuePath}>&larr; Back to the review queue</Link>
      </div>
    )
  }
  return <ReviewBody key={id} area={area} initial={state.article} />
}
