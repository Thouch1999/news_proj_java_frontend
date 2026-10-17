import { Link, useParams, useSearchParams } from 'react-router-dom'
import PageSpinner from '../common/PageSpinner'
import ErrorAlert from '../common/ErrorAlert'
import { ROUTES } from '../../constants/routes'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useRemoteData } from '../../hooks/useRemoteData'
import * as publicNewsService from '../../services/publicNewsService'
import NotFoundPage from '../../pages/errors/NotFoundPage'
import NewsResults from './NewsResults'

const PAGE_SIZE = 9

// The news of one category or one tag: /category/:slug and /tag/:slug. `kind` is 'category' or 'tag';
// `loadTerm(slug)` gets the category / tag itself (for its name). An unknown slug shows the 404 page.
export default function TermNewsPage({ kind, loadTerm }) {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1)

  const term = useRemoteData(`${kind}|${slug}`, () => loadTerm(slug))
  const news = useRemoteData(`${kind}|${slug}|${page}`, () => publicNewsService.listPublicNews({ page, size: PAGE_SIZE, [kind]: slug }))

  const name = term.data?.name
  const heading = kind === 'tag' ? `#${name}` : name
  usePageMeta(name ? (kind === 'tag' ? `#${name}` : name) : null, term.data?.description || (name ? `News about ${name}` : undefined))

  if (term.loading) {
    return <PageSpinner />
  }
  if (term.error) {
    return term.error.code === 404 ? <NotFoundPage /> : <ErrorAlert error={term.error} />
  }

  return (
    <div>
      <nav aria-label="breadcrumb" className="small mb-2">
        <Link to={ROUTES.HOME}>Home</Link> / <Link to={ROUTES.NEWS}>News</Link>
      </nav>
      <h1 className="h3 news-title">{heading}</h1>
      {term.data.description && <p className="text-muted">{term.data.description}</p>}
      <NewsResults
        state={news}
        emptyText={`No news in this ${kind} yet.`}
        onPage={(next) => setSearchParams(next > 1 ? { page: String(next) } : {})}
      />
    </div>
  )
}
