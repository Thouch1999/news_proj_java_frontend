import { useEffect, useRef, useState } from 'react'
import { Alert, Badge, Button, Card, Toast, ToastContainer } from 'react-bootstrap'
import { CheckCircle } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { ARTICLE_PAGE_SIZES } from '../../constants/newsStatus'
import { useFormat } from '../../hooks/useFormat'
import { useReviewCount } from '../../hooks/useReviewCount'
import { useWorkflowAction } from '../../hooks/useWorkflowAction'
import * as newsService from '../../services/newsService'
import { errorMessage } from '../../utils/errorMessage'
import { ArticleFooter, ArticleSkeleton } from './ArticleListParts'
import QuickReviewPanel from './QuickReviewPanel'
import { ReviewRow } from './ReviewParts'
import WorkflowDialog from './WorkflowDialog'

const DEFAULT_SIZE = ARTICLE_PAGE_SIZES[0]

// the message after an article left the queue, by the action that took it out
const REVIEW_DONE = { publish: 'news.review.published', schedule: 'news.review.scheduled', reject: 'news.review.rejected' }

// The editors' review queue: PENDING articles, the oldest first, as rows. "Quick review" opens the article in a panel
// where it can be published or rejected and the next one opens by itself. `area` comes from constants/articleAreas.js.
//
// The endpoint (GET /news/review) has no filters: only the page and the page size. So there is no search and no author
// or category filter here.
export default function ReviewQueue({ area }) {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  const { setCount, refresh } = useReviewCount()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1)
  const askedSize = parseInt(searchParams.get('size') ?? '', 10)
  const size = ARTICLE_PAGE_SIZES.includes(askedSize) ? askedSize : DEFAULT_SIZE

  // `tick` loads the list again without the skeleton (after an article left the queue)
  const queryKey = `${page}|${size}`
  const [tick, setTick] = useState(0)
  const [state, setState] = useState({ key: null, data: null, error: null })
  const loading = state.key !== queryKey
  const result = loading ? null : state.data
  const error = loading ? null : state.error
  const items = result?.items ?? []

  const [selectedId, setSelectedId] = useState(null)
  const [details, setDetails] = useState({}) // article id -> { article } | { error }
  const [detailsTick, setDetailsTick] = useState(0)
  const [toast, setToast] = useState(null)
  const reopen = useRef(false) // open the first article of the next load (the page was emptied but the queue was not)

  useEffect(() => {
    let current = true
    newsService
      .listReviewQueue({ page, size })
      .then((data) => {
        if (!current) return
        setState({ key: queryKey, data, error: null })
        setCount(data.totalElements)
        if (reopen.current) {
          reopen.current = false
          if (data.items.length > 0) setSelectedId(data.items[0].id)
        }
        // the last page was emptied: go to the new last page
        if (data.items.length === 0 && page > 1) {
          setSearchParams((current_) => {
            const next = new URLSearchParams(current_)
            next.set('page', String(Math.max(data.totalPages, 1)))
            return next
          }, { replace: true })
        }
      })
      .catch((caught) => {
        if (current) setState({ key: queryKey, data: null, error: caught })
      })
    return () => {
      current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, tick])

  // the article of the open panel (the whole article: content, tags, images)
  const entry = selectedId === null ? undefined : details[selectedId]
  useEffect(() => {
    if (selectedId === null || entry) return undefined
    let current = true
    newsService
      .getManagedNews(selectedId)
      .then((article) => current && setDetails((all) => ({ ...all, [selectedId]: { article } })))
      .catch((error_) => current && setDetails((all) => ({ ...all, [selectedId]: { error: error_ } })))
    return () => {
      current = false
    }
  }, [selectedId, entry, detailsTick])

  const index = items.findIndex((item) => item.id === selectedId)
  const item = index >= 0 ? items[index] : null
  const move = (delta) => {
    const target = items[index + delta]
    if (target) setSelectedId(target.id)
  }

  // after a publish or a reject: the article leaves the list at once, the counts follow and the next one opens
  const workflow = useWorkflowAction((updated, action) => {
    const position = items.findIndex((row) => row.id === updated.id)
    const next = items[position + 1] ?? items[position - 1]
    const remaining = (result?.totalElements ?? 1) - 1
    setState((current) => ({ ...current, data: { ...current.data, items: current.data.items.filter((row) => row.id !== updated.id), totalElements: remaining } }))
    setCount(remaining)
    refresh()
    setToast({ variant: 'success', text: `${t(REVIEW_DONE[action] ?? 'news.review.rejected')}${remaining === 0 ? ` ${t('news.review.caughtUp')}` : ''}` })
    if (next) {
      setSelectedId(next.id)
    } else {
      setSelectedId(null)
      reopen.current = remaining > 0
    }
    setTick((value) => value + 1)
  })

  // left / right arrows move through the queue, unless the focus is in a text field or a dialog is open
  useEffect(() => {
    if (!item || workflow.pending) return undefined
    const onKeyDown = (event) => {
      if ((event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') || event.altKey || event.ctrlKey || event.metaKey) return
      if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return
      event.preventDefault()
      move(event.key === 'ArrowRight' ? 1 : -1)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })

  const changeParams = (changes) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => (value === '' || value === undefined ? next.delete(key) : next.set(key, String(value))))
    if (!('page' in changes)) next.delete('page')
    setSearchParams(next)
  }

  return (
    <div>
      <div className="mb-3">
        <h1 className="h4 mb-1 d-flex align-items-center gap-2">
          {t('news.queue.title')}
          {result && (
            <Badge pill bg="" className="article-tab-count" aria-label={t('dashboard.menu.pendingCount', { count: result.totalElements })}>
              {formatNumber(result.totalElements)}
            </Badge>
          )}
        </h1>
        <p className="text-muted small mb-0">{t('news.queue.intro')}</p>
      </div>

      <Card className="article-card">
        {loading && <ArticleSkeleton staff />}
        {error && (
          <div className="p-4 text-center">
            <Alert variant="danger" className="d-inline-block mb-3">
              {errorMessage(error)}
            </Alert>
            <div>
              <Button variant="outline-primary" size="sm" onClick={() => setTick((value) => value + 1)}>
                {t('common.actions.retry')}
              </Button>
            </div>
          </div>
        )}
        {result && items.length === 0 && page === 1 && (
          <div className="d-flex flex-column align-items-center text-center text-muted py-5 px-3">
            <CheckCircle size={36} aria-hidden="true" className="mb-2" />
            <p className="mb-3">{t('news.review.caughtUp')}</p>
            <Button as={Link} to={area.listPath} variant="outline-primary" size="sm">
              {t('news.review.allArticles')}
            </Button>
          </div>
        )}
        {result && items.length > 0 && (
          <ul className="review-list list-unstyled mb-0">
            {items.map((article) => (
              <ReviewRow key={article.id} article={article} area={area} onOpen={() => setSelectedId(article.id)} />
            ))}
          </ul>
        )}
        {result && result.totalElements > 0 && (
          <ArticleFooter result={result} size={size} onPage={(next) => changeParams({ page: next })} onSize={(value) => changeParams({ size: value === DEFAULT_SIZE ? '' : value })} />
        )}
      </Card>

      <QuickReviewPanel
        item={item}
        details={entry}
        area={area}
        position={index + 1}
        total={items.length}
        dialogOpen={Boolean(workflow.pending)}
        onClose={() => setSelectedId(null)}
        onMove={move}
        onRetry={() => {
          setDetails((all) => {
            const rest = { ...all }
            delete rest[selectedId]
            return rest
          })
          setDetailsTick((value) => value + 1)
        }}
        onAction={(action) => workflow.start(action, entry.article)}
      />
      <WorkflowDialog
        key={`${workflow.pending?.action}-${workflow.pending?.article.id}`}
        action={workflow.pending?.action}
        article={workflow.pending?.article}
        busy={workflow.busy}
        error={workflow.error}
        onCancel={workflow.cancel}
        onConfirm={workflow.confirm}
      />

      <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 2000 }}>
        <Toast bg={toast?.variant ?? 'success'} show={Boolean(toast)} onClose={() => setToast(null)} delay={5000} autohide>
          <Toast.Body className="text-white d-flex justify-content-between gap-3">
            <span>{toast?.text}</span>
            <button type="button" className="btn-close btn-close-white" aria-label={t('common.actions.close')} onClick={() => setToast(null)} />
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  )
}
