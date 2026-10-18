import { useParams } from 'react-router-dom'
import ErrorAlert from '../common/ErrorAlert'
import PageSpinner from '../common/PageSpinner'
import NotFoundPage from '../../pages/errors/NotFoundPage'
import { useRemoteData } from '../../hooks/useRemoteData'
import NewsBrowser from './NewsBrowser'

// The news of one category or one tag: /category/:slug and /tag/:slug. `kind` is 'category' or 'tag';
// `loadTerm(slug)` gets the category / tag itself (for its name). An unknown slug shows the 404 page. The list is the
// same page as the news list, with the category or the tag fixed.
export default function TermNewsPage({ kind, loadTerm }) {
  const { slug } = useParams()
  const term = useRemoteData(`${kind}|${slug}`, () => loadTerm(slug))

  if (term.loading) {
    return <PageSpinner />
  }
  if (term.error) {
    return term.error.code === 404 ? <NotFoundPage /> : <ErrorAlert error={term.error} />
  }
  return <NewsBrowser key={`${kind}|${slug}`} scope={{ kind, slug, term: term.data }} />
}
