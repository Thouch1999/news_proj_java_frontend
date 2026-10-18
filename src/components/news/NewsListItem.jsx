import { Placeholder } from 'react-bootstrap'
import { ChatDots, Eye } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { categoryPath, newsPath } from '../../constants/routes'
import { useFormat } from '../../hooks/useFormat'
import { useSettings } from '../../hooks/useSettings'
import BookmarkButton from './BookmarkButton'
import NewsThumb from './NewsThumb'

// One article as a row of the news list: a 16:9 picture on the left (on top on a phone), the category, the title and
// the summary (two lines each at most) and a line with the author, the date, the views, the comments and the
// bookmark button. No tags here.
export default function NewsListItem({ news }) {
  const { t } = useTranslation()
  const { formatDate, formatNumber } = useFormat()
  const { showViewCount } = useSettings()
  return (
    <article className="news-row">
      <Link to={newsPath(news.slug)} tabIndex={-1} aria-hidden="true" className="news-row__thumb">
        <div className="ratio ratio-16x9">
          <NewsThumb src={news.thumbnail} />
        </div>
      </Link>
      <div className="news-row__body">
        <Link to={categoryPath(news.categorySlug)} className="news-row__category">
          {news.categoryName}
        </Link>
        <h3 className="news-row__title news-title news-clamp-2">
          <Link to={newsPath(news.slug)}>{news.title}</Link>
        </h3>
        {news.summary && <p className="news-row__summary news-clamp-2">{news.summary}</p>}
        <div className="news-row__meta text-muted small">
          {news.authorName && <span>{news.authorName}</span>}
          <time dateTime={news.publishedAt}>{formatDate(news.publishedAt)}</time>
          {showViewCount && (
            <span title={t('public.newsCard.views')}>
              <Eye className="me-1" aria-hidden="true" />
              <span className="visually-hidden">{t('public.newsCard.views')}: </span>
              {formatNumber(news.viewCount)}
            </span>
          )}
          <span title={t('public.newsCard.comments')}>
            <ChatDots className="me-1" aria-hidden="true" />
            <span className="visually-hidden">{t('public.newsCard.comments')}: </span>
            {formatNumber(news.commentCount)}
          </span>
          <BookmarkButton newsId={news.id} title={news.title} className="ms-auto" />
        </div>
      </div>
    </article>
  )
}

// Grey rows in the shape of the list while it loads
export function NewsRowsSkeleton({ rows = 4 }) {
  const { t } = useTranslation()
  return (
    <div role="status">
      <span className="visually-hidden">{t('common.loading')}</span>
      <Placeholder as="div" animation="glow" aria-hidden="true">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="news-row">
            <div className="news-row__thumb">
              <div className="ratio ratio-16x9">
                <Placeholder as="div" />
              </div>
            </div>
            <div className="news-row__body">
              <Placeholder xs={3} size="sm" className="d-block mb-2" />
              <Placeholder xs={10} className="d-block mb-2" />
              <Placeholder xs={12} size="sm" className="d-block mb-1" />
              <Placeholder xs={7} size="sm" className="d-block" />
            </div>
          </div>
        ))}
      </Placeholder>
    </div>
  )
}
