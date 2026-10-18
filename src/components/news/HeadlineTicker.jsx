import { ChevronDoubleRight } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { newsPath } from '../../constants/routes'

// The scrolling line of latest headlines under the header (the "marquee" of the Laravel site, done with CSS: it
// pauses when the mouse is over it and does not move for people who asked for less motion).
export default function HeadlineTicker({ items, label }) {
  const { t } = useTranslation()
  if (items.length === 0) {
    return null
  }
  return (
    <div className="news-ticker" aria-label={t('public.ticker.ariaLabel')}>
      <div className="news-ticker__label">{label ?? t('public.ticker.latest')}</div>
      <div className="news-ticker__window">
        <div className="news-ticker__track">
          {items.map((news) => (
            <Link key={news.id} to={newsPath(news.slug)} className="text-decoration-none news-title">
              <ChevronDoubleRight className="me-2 text-body" aria-hidden="true" />
              {news.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
