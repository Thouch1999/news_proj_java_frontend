import { Badge, Col, Row } from 'react-bootstrap'
import { ChatDots, Eye } from 'react-bootstrap-icons'
import { Link, useParams } from 'react-router-dom'
import ErrorAlert from '../../components/common/ErrorAlert'
import PageSpinner from '../../components/common/PageSpinner'
import ImageGallery from '../../components/news/ImageGallery'
import NewsCard from '../../components/news/NewsCard'
import SafeHtml from '../../components/news/SafeHtml'
import { categoryPath, ROUTES, tagPath } from '../../constants/routes'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useRemoteData } from '../../hooks/useRemoteData'
import * as publicNewsService from '../../services/publicNewsService'
import { formatDateTime } from '../../utils/dates'
import { mediaUrl } from '../../utils/mediaUrl'
import { excerpt, plainText } from '../../utils/text'
import NotFoundPage from '../errors/NotFoundPage'

const RELATED_COUNT = 4

// More news of the same category (not the open article); nothing is shown when there is none.
function RelatedNews({ article }) {
  const { data } = useRemoteData(`related|${article.id}`, () => publicNewsService.listPublicNews({ category: article.category.slug, size: RELATED_COUNT + 1 }))
  const related = (data?.items ?? []).filter((news) => news.id !== article.id).slice(0, RELATED_COUNT)
  if (related.length === 0) {
    return null
  }
  return (
    <section aria-labelledby="related-title" className="mt-5">
      <h2 id="related-title" className="h4 mb-3">
        More in {article.category.name}
      </h2>
      <Row xs={1} sm={2} lg={4} className="g-4">
        {related.map((news) => (
          <Col key={news.id}>
            <NewsCard news={news} />
          </Col>
        ))}
      </Row>
    </section>
  )
}

function Article({ article }) {
  // the tab title is the article title; the description is its summary, or the start of the text
  const description = article.summary?.trim() || excerpt(plainText(article.content))
  usePageMeta(article.title, description)

  return (
    <article>
      <nav aria-label="breadcrumb" className="small mb-3">
        <Link to={ROUTES.HOME}>Home</Link> / <Link to={categoryPath(article.category.slug)}>{article.category.name}</Link>
      </nav>
      <div className="article-page mx-auto">
        <Link to={categoryPath(article.category.slug)} className="text-decoration-none">
          <Badge bg="primary" className="mb-2">
            {article.category.name}
          </Badge>
        </Link>
        <h1 className="news-title mb-3">{article.title}</h1>
        <div className="text-muted d-flex flex-wrap column-gap-3 row-gap-1 mb-3">
          {article.authorName && <span>By {article.authorName}</span>}
          <span>{formatDateTime(article.publishedAt)}</span>
          <span>
            <Eye className="me-1" aria-label="Views" />
            {article.viewCount} views
          </span>
          <span>
            <ChatDots className="me-1" aria-label="Comments" />
            {article.commentCount} comments
          </span>
        </div>
        {article.summary && <p className="lead">{article.summary}</p>}
        {article.thumbnail && <img src={mediaUrl(article.thumbnail)} alt="" className="img-fluid rounded w-100 mb-4" />}
        <SafeHtml html={article.content} />
        <ImageGallery images={article.images} />
        {article.tags.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mt-4" aria-label="Tags">
            {article.tags.map((tag) => (
              <Link key={tag.id} to={tagPath(tag.slug)} className="badge text-bg-light border text-decoration-none fs-6 fw-normal">
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>
      <RelatedNews article={article} />
    </article>
  )
}

// /news/:slug. Only published articles exist here: anything else gets the 404 page.
export default function NewsDetailPage() {
  const { slug } = useParams()
  const { data, error, loading } = useRemoteData(slug, () => publicNewsService.getPublicNews(slug))

  if (loading) {
    return <PageSpinner />
  }
  if (error) {
    return error.code === 404 ? <NotFoundPage /> : <ErrorAlert error={error} />
  }
  return <Article key={data.id} article={data} />
}
