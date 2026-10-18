import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { categoryPath, newsPath, tagPath } from '../../constants/routes'
import { useFormat } from '../../hooks/useFormat'
import { useRemoteData } from '../../hooks/useRemoteData'
import { useSettings } from '../../hooks/useSettings'
import * as publicNewsService from '../../services/publicNewsService'
import NewsThumb from './NewsThumb'

const MOST_VIEWED = 5
const MAX_TAGS = 20

export function SideBlock({ title, id, children }) {
  return (
    <section className="news-side-block" aria-labelledby={id}>
      <h2 id={id} className="news-side-block__title">
        {title}
      </h2>
      {children}
    </section>
  )
}

// A list of small rows: (rank), a fixed 80 x 56 picture, the title (2 lines) and a muted line from `meta(news)`.
// Used by "Most viewed" on the news list and on the article page, and by "More in {category}".
export function SideNewsList({ items, numbered = false, meta }) {
  const { formatNumber } = useFormat()
  return (
    <ol className="news-side-top list-unstyled mb-0">
      {items.map((news, index) => (
        <li key={news.id}>
          {numbered && (
            <span className="news-side-top__rank" aria-hidden="true">
              {formatNumber(index + 1)}
            </span>
          )}
          <div className="news-side-top__thumb">
            <NewsThumb src={news.thumbnail} />
          </div>
          <div className="news-side-top__text">
            <Link to={newsPath(news.slug)} className="news-side-top__title news-title news-clamp-2">
              {news.title}
            </Link>
            {meta && <div className="news-side-top__views">{meta(news)}</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}

// "Most viewed": loads the five most viewed articles; renders nothing when there are none or the request fails
export function MostViewedBlock() {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  const { showViewCount } = useSettings()
  const { data: top } = useRemoteData('sidebar-most-viewed', () => publicNewsService.getMostViewedNews(MOST_VIEWED).catch(() => []))
  if (!top || top.length === 0) return null
  return (
    <SideBlock title={t('public.home.mostViewed')} id="side-most-viewed">
      <SideNewsList items={top} numbered meta={showViewCount ? (news) => t('public.home.viewCount', { count: news.viewCount, formatted: formatNumber(news.viewCount) }) : undefined} />
    </SideBlock>
  )
}

// The sidebar of the news pages: the most viewed articles (numbered, with a small picture), the categories and the tags.
// A block that has no data (or whose request failed) is not shown. The public API has no article counts per category and
// no ranking of tags, so the categories have no numbers and the tags are the first ones of the tag list.
//   categories, tags: the lists the page already loaded   activeCategory: the slug to highlight
export default function NewsListSidebar({ categories, tags, activeCategory }) {
  const { t } = useTranslation()
  return (
    <aside className="news-side" aria-label={t('public.side.label')}>
      <MostViewedBlock />
      {categories.length > 0 && (
        <SideBlock title={t('public.header.categories')} id="side-categories">
          <ul className="news-side-links list-unstyled mb-0">
            {categories.map((category) => (
              <li key={category.id}>
                <Link to={categoryPath(category.slug)} aria-current={category.slug === activeCategory ? 'page' : undefined} className={category.slug === activeCategory ? 'is-active' : undefined}>
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </SideBlock>
      )}
      {tags.length > 0 && (
        <SideBlock title={t('public.side.tags')} id="side-tags">
          <div className="d-flex flex-wrap gap-2">
            {tags.slice(0, MAX_TAGS).map((tag) => (
              <Link key={tag.id} to={tagPath(tag.slug)} className="filter-chip filter-chip--small">
                #{tag.name}
              </Link>
            ))}
          </div>
        </SideBlock>
      )}
    </aside>
  )
}
