import { useEffect, useState } from 'react'
import { Button, Col, Placeholder, Row } from 'react-bootstrap'
import { Newspaper } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { EmptyState, ErrorState } from '../../components/common/ListStates'
import ArticleHeader from '../../components/news/ArticleHeader'
import CommentSection from '../../components/news/CommentSection'
import ImageGallery from '../../components/news/ImageGallery'
import { MostViewedBlock, SideBlock, SideNewsList } from '../../components/news/NewsListSidebar'
import NewsCard from '../../components/news/NewsCard'
import SafeHtml from '../../components/news/SafeHtml'
import ShareActions from '../../components/news/ShareActions'
import { ROUTES, tagPath } from '../../constants/routes'
import { useBookmarks } from '../../hooks/useBookmarks'
import { useFormat } from '../../hooks/useFormat'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useRemoteData } from '../../hooks/useRemoteData'
import * as publicNewsService from '../../services/publicNewsService'
import { mediaUrl } from '../../utils/mediaUrl'
import { excerpt, plainText } from '../../utils/text'

const RELATED_COUNT = 3
const MORE_COUNT = 5

// The article without a card around it, in a column about 720px wide, with the sidebar beside it (after the comments
// on a phone). Everything comes from the existing endpoints: the article, its category's news (the first three below the
// article as cards, the next ones in the sidebar), and the most viewed.
function Article({ article }) {
  const { t } = useTranslation()
  const { formatDate } = useFormat()
  // the tab title is the article title; the description is its summary, or the start of the text; the share image is the thumbnail
  const description = article.summary?.trim() || excerpt(plainText(article.content))
  usePageMeta(article.title, description, article.thumbnail ? mediaUrl(article.thumbnail) : undefined)

  // the backend says whether the logged-in user saved this article: the buttons everywhere follow it
  const { setKnown } = useBookmarks()
  useEffect(() => {
    if (typeof article.bookmarked === 'boolean') {
      setKnown(article.id, article.bookmarked)
    }
  }, [article.id, article.bookmarked, setKnown])

  const sameCategory = useRemoteData(`category-news|${article.id}`, () => publicNewsService.listPublicNews({ category: article.category.slug, size: RELATED_COUNT + MORE_COUNT + 1 }).catch(() => null))
  const others = (sameCategory.data?.items ?? []).filter((news) => news.id !== article.id)
  const related = others.slice(0, RELATED_COUNT)
  const more = others.slice(RELATED_COUNT, RELATED_COUNT + MORE_COUNT)
  const caption = article.images?.[0]?.caption

  return (
    <Row className="g-5">
      <Col lg={8}>
        <article className="article-page article-column">
          <ArticleHeader article={article} />

          {article.thumbnail && (
            <figure className="article-hero">
              <div className="ratio ratio-16x9">
                <img src={mediaUrl(article.thumbnail)} alt="" onError={(event) => (event.currentTarget.closest('figure').hidden = true)} />
              </div>
              {caption && <figcaption>{caption}</figcaption>}
            </figure>
          )}

          <SafeHtml html={article.content} />
          <ImageGallery images={article.images} />

          {article.tags.length > 0 && (
            <div className="d-flex flex-wrap gap-2 mt-4" role="group" aria-label={t('public.detail.tags')}>
              {article.tags.map((tag) => (
                <Link key={tag.id} to={tagPath(tag.slug)} className="filter-chip">
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
          <div className="article-share mt-4">
            <ShareActions title={article.title} variant="row" />
          </div>
        </article>

        {related.length > 0 && (
          <aside className="article-column mt-5" aria-labelledby="related-title">
            <h2 id="related-title" className="article-section-title">
              {t('public.detail.related')}
            </h2>
            <Row xs={1} sm={2} xl={3} className="g-3">
              {related.map((news) => (
                <Col key={news.id}>
                  <NewsCard news={news} showTags={false} />
                </Col>
              ))}
            </Row>
          </aside>
        )}

        <div className="article-column">
          <CommentSection article={article} />
        </div>
      </Col>

      <Col lg={4}>
        <aside className="article-side news-side" aria-label={t('public.side.label')}>
          <MostViewedBlock />
          {more.length > 0 && (
            <SideBlock title={t('public.detail.moreIn', { category: article.category.name })} id="side-more-category">
              <SideNewsList items={more} meta={(news) => formatDate(news.publishedAt)} />
            </SideBlock>
          )}
        </aside>
      </Col>
    </Row>
  )
}

// grey shapes in the layout of the article while it loads
function ArticleSkeleton() {
  const { t } = useTranslation()
  return (
    <div role="status">
      <span className="visually-hidden">{t('common.loading')}</span>
      <Row className="g-5" aria-hidden="true">
        <Col lg={8}>
          <div className="article-column">
            <Placeholder as="div" animation="glow">
              <Placeholder xs={4} size="sm" className="d-block mb-3" />
              <Placeholder xs={3} className="d-block mb-3" />
              <Placeholder xs={12} size="lg" className="d-block mb-2" />
              <Placeholder xs={9} size="lg" className="d-block mb-4" />
              <Placeholder xs={6} size="sm" className="d-block mb-4" />
              <div className="ratio ratio-16x9 mb-4">
                <Placeholder as="div" className="rounded" />
              </div>
              {[12, 11, 12, 8, 12, 10].map((width, index) => (
                <Placeholder key={index} xs={width} className="d-block mb-2" />
              ))}
            </Placeholder>
          </div>
        </Col>
        <Col lg={4}>
          <Placeholder as="div" animation="glow">
            <Placeholder xs={12} className="d-block rounded" style={{ height: 220 }} />
          </Placeholder>
        </Col>
      </Row>
    </div>
  )
}

// /news/:slug. Only published articles exist here: anything else is "not available".
export default function NewsDetailPage() {
  const { t } = useTranslation()
  const { slug } = useParams()
  const [tick, setTick] = useState(0)
  const { data, error, loading } = useRemoteData(`${slug}|${tick}`, () => publicNewsService.getPublicNews(slug))
  usePageMeta(error?.code === 404 ? t('public.detail.unavailable') : undefined)

  if (loading) {
    return <ArticleSkeleton />
  }
  if (error?.code === 404) {
    return (
      <EmptyState icon={Newspaper} text={t('public.detail.unavailable')}>
        <p className="small text-muted mb-3">{t('public.detail.unavailableText')}</p>
        <Button as={Link} to={ROUTES.NEWS} variant="outline-primary">
          {t('public.home.allNews')}
        </Button>
      </EmptyState>
    )
  }
  if (error) {
    return <ErrorState error={error} onRetry={() => setTick((value) => value + 1)} />
  }
  return <Article key={data.id} article={data} />
}
