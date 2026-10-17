import { Col, ListGroup, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import ErrorAlert from '../../components/common/ErrorAlert'
import PageSpinner from '../../components/common/PageSpinner'
import NewsCard from '../../components/news/NewsCard'
import { categoryPath, newsPath, ROUTES } from '../../constants/routes'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useRemoteData } from '../../hooks/useRemoteData'
import * as publicNewsService from '../../services/publicNewsService'

function MostViewed() {
  const { data, error, loading } = useRemoteData('most-viewed', () => publicNewsService.getMostViewedNews(5))

  return (
    <section aria-labelledby="most-viewed-title">
      <h2 id="most-viewed-title" className="h5 mb-3">
        Most viewed
      </h2>
      <ErrorAlert error={error} />
      {loading && <PageSpinner />}
      {data && data.length === 0 && <p className="text-muted small">Nothing yet.</p>}
      {data && data.length > 0 && (
        <ListGroup as="ol" numbered variant="flush" className="bg-white border rounded">
          {data.map((news) => (
            <ListGroup.Item key={news.id} as="li" className="d-flex justify-content-between align-items-start gap-2">
              <div className="me-auto">
                <Link to={newsPath(news.slug)} className="text-reset text-decoration-none news-title">
                  {news.title}
                </Link>
                <div className="text-muted small">{news.viewCount} views</div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </section>
  )
}

function Latest() {
  const { data, error, loading } = useRemoteData('latest', () => publicNewsService.getLatestNews(9))

  if (loading) {
    return <PageSpinner />
  }
  if (error) {
    return <ErrorAlert error={error} />
  }
  if (!data || data.length === 0) {
    return <p className="text-muted text-center py-5">No news has been published yet.</p>
  }

  const [featured, ...others] = data
  return (
    <>
      <Row className="g-4 mb-4">
        <Col lg={8}>
          <NewsCard news={featured} featured />
        </Col>
        <Col lg={4}>
          <MostViewed />
        </Col>
      </Row>
      {others.length > 0 && (
        <section aria-labelledby="latest-title" className="mb-5">
          <div className="d-flex justify-content-between align-items-baseline mb-3">
            <h2 id="latest-title" className="h4 mb-0">
              Latest news
            </h2>
            <Link to={ROUTES.NEWS}>All news</Link>
          </div>
          <Row xs={1} sm={2} lg={4} className="g-4">
            {others.map((news) => (
              <Col key={news.id}>
                <NewsCard news={news} />
              </Col>
            ))}
          </Row>
        </section>
      )}
    </>
  )
}

function CategorySections() {
  const { data, error, loading } = useRemoteData('sections', () => publicNewsService.getCategorySections(4))

  if (loading) {
    return <PageSpinner />
  }
  if (error) {
    return <ErrorAlert error={error} />
  }
  return (data ?? []).map((section) => (
    <section key={section.category.id} aria-labelledby={`section-${section.category.slug}`} className="mb-5">
      <div className="d-flex justify-content-between align-items-baseline border-bottom border-primary border-2 pb-2 mb-3">
        <h2 id={`section-${section.category.slug}`} className="h4 mb-0 news-title">
          <Link to={categoryPath(section.category.slug)} className="text-reset text-decoration-none">
            {section.category.name}
          </Link>
        </h2>
        <Link to={categoryPath(section.category.slug)} className="small">
          See all
        </Link>
      </div>
      <Row xs={1} sm={2} lg={4} className="g-4">
        {section.news.map((news) => (
          <Col key={news.id}>
            <NewsCard news={news} />
          </Col>
        ))}
      </Row>
    </section>
  ))
}

export default function HomePage() {
  usePageMeta(null, 'The latest and most read news, by category.')
  return (
    <div>
      <Latest />
      <CategorySections />
    </div>
  )
}
