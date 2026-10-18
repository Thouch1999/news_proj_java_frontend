import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { Clock, ClockHistory, ExclamationTriangleFill } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useFormat } from '../../hooks/useFormat'
import { useNow } from '../../hooks/useNow'
import { waitingOf } from '../../utils/waiting'
import { ArticleThumb, AuthorCell } from './ArticleListParts'

// The parts of the review queue: how long an article has waited and one row of the list.

const LEVEL_ICON = { normal: Clock, warn: ClockHistory, danger: ExclamationTriangleFill }

// "Waiting 3 hours" with the full date it was submitted in a tooltip. Grey under 1 day, orange from 1 day, red from
// 3 days; the icon changes too, so the colour is not the only signal.
export function WaitingBadge({ since }) {
  const { t } = useTranslation()
  const { formatFullDate } = useFormat()
  const now = useNow()
  const { unit, count, level } = waitingOf(since, now)
  const Icon = LEVEL_ICON[level]

  return (
    <OverlayTrigger placement="top" overlay={<Tooltip id={`waiting-${since}`}>{t('news.review.submittedOn', { date: formatFullDate(since) })}</Tooltip>}>
      <span className={`waiting waiting--${level}`} tabIndex={0}>
        <Icon aria-hidden="true" />
        <span>{t(`news.review.waiting.${unit}`, { count })}</span>
      </span>
    </OverlayTrigger>
  )
}

// A row: thumbnail, title (opens the quick review), two lines of the summary, author and category, the waiting time
// and the buttons. Below 768px it is a card.
export function ReviewRow({ article, area, onOpen }) {
  const { t } = useTranslation()
  return (
    <li className="review-row">
      <div className="review-thumb">
        <ArticleThumb src={article.thumbnail} />
      </div>
      <div className="review-main min-w-0">
        <button type="button" className="review-title news-title" onClick={onOpen}>
          {article.title}
        </button>
        {article.summary && <p className="review-summary small text-muted mb-1">{article.summary}</p>}
        <div className="d-flex flex-wrap align-items-center gap-2 small text-muted">
          <AuthorCell name={article.authorName} />
          <span aria-hidden="true">&middot;</span>
          <span>{article.categoryName}</span>
        </div>
      </div>
      <div className="review-side">
        <WaitingBadge since={article.updatedAt} />
        <div className="d-flex flex-wrap gap-2">
          <Button size="sm" onClick={onOpen}>
            {t('news.review.quick')}
          </Button>
          <Button as={Link} to={area.editPath(article.id)} size="sm" variant="outline-secondary">
            {t('news.review.openEditor')}
          </Button>
        </div>
      </div>
    </li>
  )
}
