import { Breadcrumb, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { Clock, Eye } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import UserAvatar from '../common/UserAvatar'
import { categoryPath, ROUTES } from '../../constants/routes'
import { useFormat } from '../../hooks/useFormat'
import { useSettings } from '../../hooks/useSettings'
import { readingStats } from '../../utils/readingStats'
import BookmarkButton from './BookmarkButton'
import ShareActions from './ShareActions'

// The top of the article page: breadcrumb, the category chip, the title, the lead (summary) and the meta row
// (author, date, reading time, views) with the Save and Share buttons on its right (under it on a phone).
export default function ArticleHeader({ article }) {
  const { t, i18n } = useTranslation()
  const { formatFullDate, formatNumber, locale } = useFormat()
  const { showViewCount } = useSettings()
  const { minutes } = readingStats(article.content, i18n.language)
  const date = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }) : ''

  return (
    <header className="article-header">
      <Breadcrumb listProps={{ className: 'small mb-3' }} aria-label={t('public.breadcrumb.label')}>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: ROUTES.HOME }}>
          {t('public.breadcrumb.home')}
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: categoryPath(article.category.slug) }}>
          {article.category.name}
        </Breadcrumb.Item>
      </Breadcrumb>

      <Link to={categoryPath(article.category.slug)} className="article-chip">
        {article.category.name}
      </Link>
      <h1 className="article-title news-title">{article.title}</h1>
      {article.summary && <p className="article-lead">{article.summary}</p>}

      <div className="article-meta">
        <div className="article-meta__info">
          {article.authorName && (
            <span className="d-inline-flex align-items-center gap-2">
              <UserAvatar name={article.authorName} size={32} fallback="initial" className={`user-avatar user-avatar--${article.authorName.length % 6}`} />
              <span className="fw-semibold">{article.authorName}</span>
            </span>
          )}
          {date && (
            <OverlayTrigger placement="bottom" overlay={<Tooltip id="article-date">{formatFullDate(article.publishedAt)}</Tooltip>}>
              <time dateTime={article.publishedAt} tabIndex={0}>
                {date}
              </time>
            </OverlayTrigger>
          )}
          {minutes > 0 && (
            <span>
              <Clock className="me-1" aria-hidden="true" />
              {t('public.detail.readingTime', { count: minutes, formatted: formatNumber(minutes) })}
            </span>
          )}
          {showViewCount && (
            <span>
              <Eye className="me-1" aria-hidden="true" />
              {t('public.detail.views', { count: article.viewCount, formatted: formatNumber(article.viewCount) })}
            </span>
          )}
        </div>
        <div className="article-meta__actions">
          <BookmarkButton newsId={article.id} title={article.title} variant="full" />
          <ShareActions title={article.title} slug={article.slug} />
        </div>
      </div>
    </header>
  )
}
