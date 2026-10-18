import { useState } from 'react'
import { Button, Col, Row } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import ErrorAlert from '../../components/common/ErrorAlert'
import PageSpinner from '../../components/common/PageSpinner'
import Pagination from '../../components/common/Pagination'
import SectionTitle from '../../components/common/SectionTitle'
import NewsCard from '../../components/news/NewsCard'
import { ROUTES } from '../../constants/routes'
import { useBookmarks } from '../../hooks/useBookmarks'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useRemoteData } from '../../hooks/useRemoteData'
import * as bookmarkService from '../../services/bookmarkService'
import { useFormat } from '../../hooks/useFormat'

const PAGE_SIZE = 9

// My saved news (a logged-in page, see AppRoutes): paginated, newest bookmark first, with a Remove button.
// Remove hides the card at once and puts it back if the backend refuses (the error shows as a toast).
export default function BookmarksPage() {
  const { t } = useTranslation()
  const { formatDate, formatNumber } = useFormat()
  usePageMeta(t('news.bookmarks.title'))
  const { toggle, isPending } = useBookmarks()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1)

  const [reloadKey, setReloadKey] = useState(0)
  const key = `${page}|${reloadKey}`
  const { data, error, loading } = useRemoteData(key, () => bookmarkService.listBookmarks({ page, size: PAGE_SIZE }))

  // ids removed on this page but not yet gone from the loaded list (reset when the list is loaded again)
  const [hidden, setHidden] = useState({ key, ids: new Set() })
  const hiddenIds = hidden.key === key ? hidden.ids : new Set()
  const hide = (id, on) =>
    setHidden((current) => {
      const ids = new Set(current.key === key ? current.ids : [])
      if (on) ids.add(id)
      else ids.delete(id)
      return { key, ids }
    })

  const changePage = (number) => setSearchParams(number > 1 ? { page: String(number) } : {})

  const handleRemove = async (news) => {
    hide(news.id, true)
    const removed = await toggle(news.id, false)
    if (!removed) {
      hide(news.id, false) // rolled back: the card comes back
      return
    }
    // load the page again so the next bookmark moves up; a page that became empty goes back one page
    if (data.items.every((item) => item.news.id === news.id || hiddenIds.has(item.news.id)) && page > 1) {
      changePage(page - 1)
    } else {
      setReloadKey((current) => current + 1)
    }
  }

  const shown = (data?.items ?? []).filter((item) => !hiddenIds.has(item.news.id))

  return (
    <div>
      <SectionTitle as="h1">{t('news.bookmarks.title')}</SectionTitle>
      {loading && <PageSpinner />}
      <ErrorAlert error={error} />
      {!loading && data && data.items.length === 0 && (
        <div className="text-center text-muted py-5">
          <p>{t('news.bookmarks.empty')}</p>
          <Link to={ROUTES.NEWS}>{t('news.bookmarks.browse')}</Link>
        </div>
      )}
      {!loading && data && data.items.length > 0 && (
        <>
          <p className="text-muted small">
            {t('news.bookmarks.summary', { count: data.totalElements - hiddenIds.size, page: formatNumber(data.page), totalPages: formatNumber(data.totalPages) })}
          </p>
          {shown.length === 0 && <p className="text-muted">{t('news.bookmarks.removed')}</p>}
          <Row xs={1} sm={2} lg={3} className="g-4">
            {shown.map((item) => (
              <Col key={item.news.id}>
                <NewsCard
                  news={item.news}
                  showBookmark={false}
                  footer={
                    <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                      <span className="text-muted small">{t('news.bookmarks.savedOn', { date: formatDate(item.bookmarkedAt) })}</span>
                      <Button size="sm" variant="outline-danger" disabled={isPending(item.news.id)} onClick={() => handleRemove(item.news)}>
                        {t('news.bookmarks.remove')}
                      </Button>
                    </div>
                  }
                />
              </Col>
            ))}
          </Row>
          <div className="d-flex justify-content-center mt-4">
            <Pagination page={data.page} totalPages={data.totalPages} onChange={changePage} />
          </div>
        </>
      )}
    </div>
  )
}
