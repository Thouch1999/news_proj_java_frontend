import { Col, ListGroup, Row } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import ErrorAlert from '../../components/common/ErrorAlert'
import PageSpinner from '../../components/common/PageSpinner'
import SectionTitle from '../../components/common/SectionTitle'
import HeadlineTicker from '../../components/news/HeadlineTicker'
import NewsCard from '../../components/news/NewsCard'
import { categoryPath, newsPath, ROUTES } from '../../constants/routes'
import { useFormat } from '../../hooks/useFormat'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useSettings } from '../../hooks/useSettings'
import { useRemoteData } from '../../hooks/useRemoteData'
import * as publicNewsService from '../../services/publicNewsService'

function MostViewed() {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  const { showViewCount } = useSettings()
  const { data, error, loading } = useRemoteData('most-viewed', () => publicNewsService.getMostViewedNews(5))

  return (
    <section aria-labelledby="most-viewed-title">
      <SectionTitle id="most-viewed-title">{t('public.home.mostViewed')}</SectionTitle>
      <ErrorAlert error={error} />
      {loading && <PageSpinner />}
      {data && data.length === 0 && <p className="text-muted small">{t('public.home.nothingYet')}</p>}
      {data && data.length > 0 && (
        <ListGroup as="ol" numbered variant="flush" className="bg-surface rounded shadow-sm overflow-hidden">
          {data.map((news) => (
            <ListGroup.Item key={news.id} as="li" className="d-flex justify-content-between align-items-start gap-2">
              <div className="me-auto">
                <Link to={newsPath(news.slug)} className="text-reset text-decoration-none news-title">
                  {news.title}
                </Link>
                {showViewCount && <div className="small news-figure__date">{t('public.home.viewCount', { count: news.viewCount, formatted: formatNumber(news.viewCount) })}</div>}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </section>
  )
}

// The headline ticker, the hero (one big article and two beside it) and the other latest articles with "Most viewed"
function Latest() {
  const { t } = useTranslation()
  const { data, error, loading } = useRemoteData('latest', () => publicNewsService.getLatestNews(10))

  if (loading) {
    return <PageSpinner />
  }
  if (error) {
    return <ErrorAlert error={error} />
  }
  if (!data || data.length === 0) {
    return <p className="text-muted text-center py-5">{t('public.home.empty')}</p>
  }

  const [featured, second, third, ...others] = data
  const side = [second, third].filter(Boolean)
  return (
    <>
      <HeadlineTicker items={data} />
      <Row className="g-3 mb-5">
        <Col lg={side.length > 0 ? 8 : 12}>
          <NewsCard news={featured} overlay featured />
        </Col>
        {side.length > 0 && (
          <Col lg={4} className="d-flex flex-column gap-3">
            {side.map((news) => (
              <div key={news.id} className="flex-fill">
                <NewsCard news={news} overlay />
              </div>
            ))}
          </Col>
        )}
      </Row>
      <Row className="g-4 mb-5">
        <Col lg={8}>
          {others.length > 0 && (
            <section aria-labelledby="latest-title">
              <SectionTitle
                id="latest-title"
                action={<Link to={ROUTES.NEWS}>{t('public.home.allNews')}</Link>}
              >
                {t('public.home.latestNews')}
              </SectionTitle>
              <Row xs={1} sm={2} className="g-4">
                {others.map((news) => (
                  <Col key={news.id}>
                    <NewsCard news={news} />
                  </Col>
                ))}
              </Row>
            </section>
          )}
        </Col>
        <Col lg={4}>
          <MostViewed />
        </Col>
      </Row>
    </>
  )
}

function CategorySections() {
  const { t } = useTranslation()
  const { data, error, loading } = useRemoteData('sections', () => publicNewsService.getCategorySections(3))

  if (loading) {
    return <PageSpinner />
  }
  if (error) {
    return <ErrorAlert error={error} />
  }
  return (data ?? []).map((section) => (
    <section key={section.category.id} aria-labelledby={`section-${section.category.slug}`} className="mb-5">
      <SectionTitle id={`section-${section.category.slug}`} action={<Link to={categoryPath(section.category.slug)}>{t('public.home.seeAll')}</Link>}>
        {section.category.name}
      </SectionTitle>
      <Row xs={1} sm={2} lg={3} className="g-4">
        {section.news.map((news) => (
          <Col key={news.id}>
            <NewsCard news={news} overlay />
          </Col>
        ))}
      </Row>
    </section>
  ))
}

export default function HomePage() {
  const { t } = useTranslation()
  usePageMeta(null, t('public.home.description'))
  return (
    <div>
      <Latest />
      <CategorySections />
    </div>
  )
}
