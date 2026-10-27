import { Alert, Button, Offcanvas, Placeholder } from 'react-bootstrap'
import { ChevronLeft, ChevronRight } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import ErrorAlert from '../common/ErrorAlert'
import { useFormat } from '../../hooks/useFormat'
import { readingStats } from '../../utils/readingStats'
import { AuthorCell } from './ArticleListParts'
import ArticlePreview from './ArticlePreview'
import PublishSplitButton from './PublishSplitButton'
import { WaitingBadge } from './ReviewParts'
import StatusBadge from './StatusBadge'

// The quick review: the article of the queue opened in a panel from the right (full screen on a phone) with Reject, Edit
// and Publish in a footer that stays in place, and Previous / Next to go through the queue without closing it.
//   item: the row of the queue (shown at once)   details: { article } or { error } or undefined while it loads
//   position / total: "1 of 5"   dialogOpen: a confirm or reject dialog is open on top of the panel
export default function QuickReviewPanel({ item, details, area, position, total, dialogOpen, onClose, onMove, onRetry, onAction }) {
  const { t, i18n } = useTranslation()
  const { formatNumber } = useFormat()
  const article = details?.article
  const stats = article ? readingStats(article.content, i18n.language) : null

  return (
    <Offcanvas show={Boolean(item)} placement="end" container={() => document.querySelector('.dashboard-shell')} onHide={onClose} keyboard={!dialogOpen} enforceFocus={!dialogOpen} className="review-panel" aria-labelledby="review-panel-title">
      {item && (
        <>
          <Offcanvas.Header closeButton closeLabel={t('common.actions.close')} className="align-items-start">
            <div className="min-w-0 pe-3">
              <Offcanvas.Title as="h2" id="review-panel-title" className="h5 news-title mb-2">
                {item.title}
              </Offcanvas.Title>
              <div className="d-flex flex-wrap align-items-center gap-2 small text-muted">
                <AuthorCell name={item.authorName} />
                <span aria-hidden="true">&middot;</span>
                <span>{item.categoryName}</span>
                <span aria-hidden="true">&middot;</span>
                <WaitingBadge since={item.updatedAt} />
              </div>
            </div>
          </Offcanvas.Header>

          <Offcanvas.Body>
            {!details && (
              <div role="status">
                <span className="visually-hidden">{t('common.loading')}</span>
                <Placeholder as="div" animation="glow" aria-hidden="true">
                  <Placeholder xs={12} className="d-block rounded mb-3" style={{ height: 180 }} />
                  <Placeholder xs={10} className="d-block mb-2" />
                  <Placeholder xs={12} className="d-block mb-2" />
                  <Placeholder xs={8} className="d-block" />
                </Placeholder>
              </div>
            )}
            {details?.error && (
              <>
                <ErrorAlert error={details.error} />
                <Button variant="outline-primary" size="sm" onClick={onRetry}>
                  {t('common.actions.retry')}
                </Button>
              </>
            )}
            {article && (
              <>
                {article.status !== 'PENDING' && (
                  <Alert variant="info" className="py-2">
                    {t('news.review.notPending')} (<StatusBadge status={article.status} />).
                  </Alert>
                )}
                <p className="text-muted small">{t('news.review.stats', { count: stats.words, words: formatNumber(stats.words), minutes: formatNumber(stats.minutes) })}</p>
                <ArticlePreview article={article} />
              </>
            )}
          </Offcanvas.Body>

          <div className="review-panel__footer">
            <div className="d-flex align-items-center gap-2">
              <Button variant="outline-secondary" size="sm" disabled={position <= 1} onClick={() => onMove(-1)} aria-label={t('news.review.previous')} title={t('news.review.previous')}>
                <ChevronLeft aria-hidden="true" />
              </Button>
              <span className="small text-muted text-nowrap" aria-live="polite">
                {t('news.review.position', { current: formatNumber(position), total: formatNumber(total) })}
              </span>
              <Button variant="outline-secondary" size="sm" disabled={position >= total} onClick={() => onMove(1)} aria-label={t('news.review.next')} title={t('news.review.next')}>
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
            <div className="d-flex flex-wrap justify-content-end gap-2">
              <Button variant="outline-danger" disabled={!article} onClick={() => onAction('reject')}>
                {t('news.workflow.actions.reject')}
              </Button>
              <Button as={Link} to={area.editPath(item.id)} variant="outline-secondary">
                {t('news.review.editShort')}
              </Button>
              <PublishSplitButton drop="up" disabled={!article || article.status !== 'PENDING'} onPublish={() => onAction('publish')} onSchedule={() => onAction('schedule')} />
            </div>
          </div>
        </>
      )}
    </Offcanvas>
  )
}
