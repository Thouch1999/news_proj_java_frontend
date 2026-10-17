import { Badge, Card } from 'react-bootstrap'
import { ChatDots, Eye } from 'react-bootstrap-icons'
import { Link } from 'react-router-dom'
import { categoryPath, newsPath, tagPath } from '../../constants/routes'
import { formatDate } from '../../utils/dates'
import { mediaUrl } from '../../utils/mediaUrl'

function Thumbnail({ news, ratio = '16x9' }) {
  return (
    <Link to={newsPath(news.slug)} tabIndex={-1} aria-hidden="true" className="d-block">
      <div className={`ratio ratio-${ratio} bg-light`}>
        {news.thumbnail ? <img src={mediaUrl(news.thumbnail)} alt="" loading="lazy" className="object-fit-cover" /> : <div className="news-thumb-empty" />}
      </div>
    </Link>
  )
}

function Meta({ news }) {
  return (
    <div className="text-muted small d-flex flex-wrap gap-x-3 column-gap-3">
      {news.authorName && <span>{news.authorName}</span>}
      <span>{formatDate(news.publishedAt)}</span>
      <span title="Views">
        <Eye className="me-1" aria-label="Views" />
        {news.viewCount}
      </span>
      <span title="Comments">
        <ChatDots className="me-1" aria-label="Comments" />
        {news.commentCount}
      </span>
    </div>
  )
}

// One article card. `featured` is the big first item of the home page.
export default function NewsCard({ news, featured = false }) {
  if (featured) {
    return (
      <Card className="h-100 border-0 shadow-sm overflow-hidden">
        <Thumbnail news={news} />
        <Card.Body>
          <Link to={categoryPath(news.categorySlug)} className="text-decoration-none">
            <Badge bg="primary" className="mb-2">
              {news.categoryName}
            </Badge>
          </Link>
          <h2 className="h3 news-title">
            <Link to={newsPath(news.slug)} className="text-reset text-decoration-none">
              {news.title}
            </Link>
          </h2>
          {news.summary && <p className="lead fs-6 news-clamp-3">{news.summary}</p>}
          <Meta news={news} />
        </Card.Body>
      </Card>
    )
  }

  return (
    <Card className="h-100 border-0 shadow-sm overflow-hidden">
      <Thumbnail news={news} />
      <Card.Body className="d-flex flex-column">
        <Link to={categoryPath(news.categorySlug)} className="small text-uppercase fw-semibold text-decoration-none mb-1">
          {news.categoryName}
        </Link>
        <h3 className="h6 news-title">
          <Link to={newsPath(news.slug)} className="text-reset text-decoration-none">
            {news.title}
          </Link>
        </h3>
        {news.summary && <p className="small text-muted news-clamp-3">{news.summary}</p>}
        <div className="mt-auto">
          {news.tags.length > 0 && (
            <div className="d-flex flex-wrap gap-1 mb-2">
              {news.tags.slice(0, 3).map((tag) => (
                <Link key={tag.id} to={tagPath(tag.slug)} className="badge text-bg-light border text-decoration-none">
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
          <Meta news={news} />
        </div>
      </Card.Body>
    </Card>
  )
}
