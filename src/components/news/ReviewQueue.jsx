import { useEffect, useState } from 'react'
import { Button, Table } from 'react-bootstrap'
import { Link, useSearchParams } from 'react-router-dom'
import ErrorAlert from '../common/ErrorAlert'
import PageSpinner from '../common/PageSpinner'
import Pagination from '../common/Pagination'
import * as newsService from '../../services/newsService'

const PAGE_SIZE = 10

// The editors' review queue: PENDING articles, the oldest first. `area` comes from constants/articleAreas.js.
export default function ReviewQueue({ area }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1)

  const [state, setState] = useState({ page: null, data: null, error: null })
  const loading = state.page !== page
  const result = loading ? null : state.data
  const error = loading ? null : state.error

  useEffect(() => {
    let current = true
    newsService
      .listReviewQueue({ page, size: PAGE_SIZE })
      .then((data) => {
        if (current) setState({ page, data, error: null })
      })
      .catch((caught) => {
        if (current) setState({ page, data: null, error: caught })
      })
    return () => {
      current = false
    }
  }, [page])

  return (
    <div>
      <h1 className="h4 mb-3">Review queue</h1>
      <p className="text-muted">Articles waiting for review, the oldest first.</p>
      <ErrorAlert error={error} />
      {loading && <PageSpinner />}
      {!loading && result && (
        <>
          <Table responsive hover className="bg-white align-middle">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Waiting since</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    Nothing is waiting for review.
                  </td>
                </tr>
              )}
              {result.items.map((article) => (
                <tr key={article.id}>
                  <td>
                    <Link to={area.reviewPath(article.id)}>{article.title}</Link>
                  </td>
                  <td>{article.authorName}</td>
                  <td>{article.categoryName}</td>
                  <td className="text-nowrap">{article.updatedAt ? new Date(article.updatedAt).toLocaleString() : ''}</td>
                  <td className="text-end">
                    <Button as={Link} to={area.reviewPath(article.id)} size="sm" variant="outline-primary">
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted small">
              {result.totalElements} article(s), page {result.totalPages === 0 ? 0 : result.page} of {result.totalPages}
            </span>
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              onChange={(next) => setSearchParams(next > 1 ? { page: String(next) } : {})}
            />
          </div>
        </>
      )}
    </div>
  )
}
