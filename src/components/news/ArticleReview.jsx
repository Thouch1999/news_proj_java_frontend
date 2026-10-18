import { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Row } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import ErrorAlert from '../common/ErrorAlert'
import PageSpinner from '../common/PageSpinner'
import { useFormat } from '../../hooks/useFormat'
import { useNewsHistory } from '../../hooks/useNewsHistory'
import { useReviewCount } from '../../hooks/useReviewCount'
import * as newsService from '../../services/newsService'
import ArticlePreview from './ArticlePreview'
import StatusBadge from './StatusBadge'
import WorkflowCard from './WorkflowCard'

function ReviewBody({ area, initial }) {
  const { t } = useTranslation()
  const { formatDateTime } = useFormat()
  const [article, setArticle] = useState(initial)
  const [message, setMessage] = useState(null)
  const history = useNewsHistory(article)
  const { refresh } = useReviewCount()

  // when the article was sent for review: the last change to PENDING
  const submitted = (history.history ?? []).filter((row) => row.toStatus === 'PENDING').at(-1)

  return (
    <div>
      <div className="mb-3">
        <Link to={area.queuePath}>&larr; {t('news.review.back')}</Link>
      </div>
      {article.status !== 'PENDING' && (
        <Alert variant="info">
          {t('news.review.notPending')} (<StatusBadge status={article.status} />).
        </Alert>
      )}
      {message && <Alert variant="success">{t(message)}</Alert>}
      <Row className="g-4">
        <Col lg={8}>
          <ArticlePreview article={article} />
        </Col>
        <Col lg={4}>
          <Card body className="mb-3">
            <dl className="mb-0 small">
              <dt>{t('news.review.author')}</dt>
              <dd>{article.authorName || t('news.preview.unknownAuthor')}</dd>
              <dt>{t('news.review.category')}</dt>
              <dd>{article.category.name}</dd>
              <dt>{t('news.review.tags')}</dt>
              <dd>{article.tags.length > 0 ? article.tags.map((tag) => tag.name).join(', ') : t('news.review.noTags')}</dd>
              <dt>{t('news.review.submitted')}</dt>
              <dd>{submitted?.changedAt ? formatDateTime(submitted.changedAt) : history.loading ? '...' : t('news.review.notSubmitted')}</dd>
              <dt>{t('news.review.lastChanged')}</dt>
              <dd className="mb-0">{formatDateTime(article.updatedAt)}</dd>
            </dl>
            {article.editable && (
              <Button as={Link} to={area.editPath(article.id)} variant="outline-primary" size="sm" className="mt-3">
                {t('news.review.edit')}
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
              refresh() // an article left the queue
            }}
          />
        </Col>
      </Row>
    </div>
  )
}

// Review page: the whole article as readers would see it, with Publish, Reject and Edit.
export default function ArticleReview({ area }) {
  const { t } = useTranslation()
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
        <Link to={area.queuePath}>&larr; {t('news.review.back')}</Link>
      </div>
    )
  }
  return <ReviewBody key={id} area={area} initial={state.article} />
}
