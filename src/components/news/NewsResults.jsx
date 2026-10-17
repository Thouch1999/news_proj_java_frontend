import { Col, Row } from 'react-bootstrap'
import ErrorAlert from '../common/ErrorAlert'
import PageSpinner from '../common/PageSpinner'
import Pagination from '../common/Pagination'
import NewsCard from './NewsCard'

// A page of article cards with the loading, error and empty states and the pagination.
// `state` is what useRemoteData returns for newsService.listPublicNews; `onPage(number)` changes the page.
export default function NewsResults({ state, onPage, emptyText = 'No news found.' }) {
  const { data, error, loading } = state

  if (loading) {
    return <PageSpinner />
  }
  if (error) {
    return <ErrorAlert error={error} />
  }
  if (!data || data.items.length === 0) {
    return <p className="text-muted text-center py-5 mb-0">{emptyText}</p>
  }

  return (
    <>
      <p className="text-muted small">
        {data.totalElements} article(s), page {data.page} of {data.totalPages}
      </p>
      <Row xs={1} sm={2} lg={3} className="g-4">
        {data.items.map((news) => (
          <Col key={news.id}>
            <NewsCard news={news} />
          </Col>
        ))}
      </Row>
      <div className="d-flex justify-content-center mt-4">
        <Pagination page={data.page} totalPages={data.totalPages} onChange={onPage} />
      </div>
    </>
  )
}
