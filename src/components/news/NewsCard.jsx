import { ChatDots, Eye } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { categoryPath, newsPath, tagPath } from '../../constants/routes'
import { useFormat } from '../../hooks/useFormat'
import { useSettings } from '../../hooks/useSettings'
import BookmarkButton from './BookmarkButton'
import NewsThumb from './NewsThumb'

// The picture (a link to the article) with the bookmark button in its corner (the button is not inside the link).
// `overlay`: the title lies over the bottom of the picture.
function Cover({ news, showBookmark, ratio, overlay, featured }) {
  const { formatDate } = useFormat()
  return (
    <div className="news-figure__thumb">
      <Link to={newsPath(news.slug)} tabIndex={overlay ? 0 : -1} aria-hidden={overlay ? undefined : 'true'} aria-label={overlay ? news.title : undefined} className="d-block">
        <div className={`ratio ratio-${ratio} bg-body-secondary`}>
          <NewsThumb src={news.thumbnail} />
        </div>
      </Link>
      {overlay && (
        <div className="news-figure__overlay pe-none">
          <h3 className="news-figure__overlay-title news-title">{news.title}</h3>
          <div className="news-figure__overlay-meta">
            {news.categoryName} &middot; {formatDate(news.publishedAt)}
            {featured && news.authorName ? ` · ${news.authorName}` : ''}
          </div>
        </div>
      )}
      {showBookmark && <BookmarkButton newsId={news.id} title={news.title} className="position-absolute top-0 end-0 m-2" />}
    </div>
  )
}

function Meta({ news }) {
  const { t } = useTranslation()
  const { formatDate } = useFormat()
  const { showViewCount } = useSettings()
  return (
    <div className="text-muted small d-flex flex-wrap column-gap-3">
      {news.authorName && <span>{news.authorName}</span>}
      <span className="news-figure__date">{formatDate(news.publishedAt)}</span>
      {showViewCount && (
        <span title={t('public.newsCard.views')}>
          <Eye className="me-1" aria-label={t('public.newsCard.views')} />
          {news.viewCount}
        </span>
      )}
      <span title={t('public.newsCard.comments')}>
        <ChatDots className="me-1" aria-label={t('public.newsCard.comments')} />
        {news.commentCount}
      </span>
    </div>
  )
}

// One article card, in the style of the Laravel news site.
//  - default: the picture on top, then the category, the title (navy), the summary and the date (red)
//  - `overlay`: the title lies over the picture on a dark gradient that grows on hover (the home page)
//  - `featured` (with `overlay`): the big first article of the home page
// `showTags={false}` leaves the tags out (the news list); `showBookmark` puts the bookmark button on the picture; `footer` is extra content under the card text (the
// "My bookmarks" page puts its Remove button there).
export default function NewsCard({ news, overlay = false, featured = false, showBookmark = true, showTags = true, footer = null }) {
  if (overlay) {
    return (
      <figure className={`news-figure news-figure--overlay ${featured ? 'news-figure--featured' : ''} mb-0 h-100`}>
        <Cover news={news} showBookmark={showBookmark} ratio="16x9" overlay featured={featured} />
        {footer && <div className="news-figure__detail">{footer}</div>}
      </figure>
    )
  }

  return (
    <figure className="news-figure h-100 mb-0 d-flex flex-column">
      <Cover news={news} showBookmark={showBookmark} ratio="16x9" />
      <div className="news-figure__detail d-flex flex-column flex-grow-1">
        <Link to={categoryPath(news.categorySlug)} className="news-figure__category text-decoration-none mb-1">
          {news.categoryName}
        </Link>
        <h3 className="news-figure__title news-title h5">
          <Link to={newsPath(news.slug)} className="text-decoration-none">
            {news.title}
          </Link>
        </h3>
        {news.summary && <p className="small text-body news-clamp-3">{news.summary}</p>}
        <div className="mt-auto">
          {showTags && news.tags.length > 0 && (
            <div className="d-flex flex-wrap gap-1 mb-2">
              {news.tags.slice(0, 3).map((tag) => (
                <Link key={tag.id} to={tagPath(tag.slug)} className="badge bg-body-secondary text-body border text-decoration-none">
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
          <Meta news={news} />
          {footer}
        </div>
      </div>
    </figure>
  )
}
