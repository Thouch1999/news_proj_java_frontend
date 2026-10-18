import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Toast, ToastContainer } from 'react-bootstrap'
import { ChatDots, X } from 'react-bootstrap-icons'
import { Trans, useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import ConfirmDialog from '../common/ConfirmDialog'
import { useFormat } from '../../hooks/useFormat'
import { useRemoteData } from '../../hooks/useRemoteData'
import * as commentService from '../../services/commentService'
import * as newsService from '../../services/newsService'
import { errorMessage } from '../../utils/errorMessage'
import ArticlePicker from './ArticlePicker'
import { ArticleFooter, StatusTabs } from './ArticleListParts'
import { CommentRow, CommentSkeleton } from './CommentParts'

const SIZES = [20, 50] // the backend gives at most 50 comments per page
const DEFAULT_SIZE = SIZES[0]
const STATUSES = ['', 'VISIBLE', 'HIDDEN']

// Comment moderation for editors and admins, as a feed: every comment with Hide / Show and Delete, one by one or for a
// selection. Status, article, commenter, page and page size live in the URL: ?status=HIDDEN&newsId=12&userId=5&page=2
// `area` comes from constants/articleAreas.js.
//
// The endpoint (GET /comments) filters by status, article and commenter only: there is no search in the text.
export default function CommentModeration({ area }) {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1)
  const askedSize = parseInt(searchParams.get('size') ?? '', 10)
  const size = SIZES.includes(askedSize) ? askedSize : DEFAULT_SIZE
  const asked = searchParams.get('status') ?? ''
  const status = STATUSES.includes(asked) ? asked : ''
  const newsId = /^\d+$/.test(searchParams.get('newsId') ?? '') ? searchParams.get('newsId') : ''
  const userId = /^\d+$/.test(searchParams.get('userId') ?? '') ? searchParams.get('userId') : ''

  // the page; `tick` loads it again without the skeleton
  const queryKey = `${page}|${size}|${status}|${newsId}|${userId}`
  const [tick, setTick] = useState(0)
  const [state, setState] = useState({ key: null, data: null, error: null })
  const loading = state.key !== queryKey
  const data = loading ? null : state.data
  const error = loading ? null : state.error
  const items = data?.items ?? []

  useEffect(() => {
    let current = true
    commentService
      .listAllComments({ page, size, status, newsId, userId })
      .then((result) => {
        if (!current) return
        setState({ key: queryKey, data: result, error: null })
        // the last page was emptied: go to the new last page
        if (result.items.length === 0 && page > 1) {
          setSearchParams((previous) => {
            const next = new URLSearchParams(previous)
            next.set('page', String(Math.max(result.totalPages, 1)))
            return next
          }, { replace: true })
        }
      })
      .catch((caught) => current && setState({ key: queryKey, data: null, error: caught }))
    return () => {
      current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, tick])

  // the numbers on the tabs: the totals of the three lists (for the chosen article and commenter), kept while they refresh
  const [counts, setCounts] = useState(null)
  const [countsTick, setCountsTick] = useState(0)
  useEffect(() => {
    let current = true
    Promise.all(STATUSES.map((value) => commentService.listAllComments({ page: 1, size: 1, status: value, newsId, userId })))
      .then((lists) => current && setCounts(Object.fromEntries(STATUSES.map((value, index) => [value, lists[index].totalElements]))))
      .catch(() => {
        // the tabs work without the numbers
      })
    return () => {
      current = false
    }
  }, [newsId, userId, countsTick])

  // the article of the filter, for its chip: the one just picked, or loaded by its id (the page may be opened with it)
  const [picked, setPicked] = useState(null)
  const fetched = useRemoteData(`article|${newsId}`, () => (newsId ? newsService.getManagedNews(newsId) : Promise.resolve(null)))
  const fromList = items.find((comment) => String(comment.newsId) === newsId)?.newsTitle
  const articleTitle = (picked && String(picked.id) === newsId ? picked.title : null) ?? fetched.data?.title ?? fromList ?? `#${newsId}`
  const commenter = userId && items.find((comment) => String(comment.userId) === userId)?.userName

  const [selection, setSelection] = useState({ key: null, ids: [] }) // belongs to one page of one list
  const selectedIds = selection.key === queryKey ? selection.ids : []
  const selected = items.filter((comment) => selectedIds.includes(comment.id))
  const setSelected = (ids) => setSelection({ key: queryKey, ids })

  const [busyId, setBusyId] = useState(null)
  const [progress, setProgress] = useState(null) // { done, total } while a bulk action runs
  const [toast, setToast] = useState(null)
  const [toDelete, setToDelete] = useState(null) // a comment, or 'selected'
  const [deleting, setDeleting] = useState(false)

  const change = (changes) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([name, value]) => (value === '' || value === undefined || value === null ? next.delete(name) : next.set(name, String(value))))
    if (!('page' in changes)) next.delete('page')
    setSearchParams(next)
  }
  const hasFilters = Boolean(newsId || userId)
  const clearFilters = () => change({ newsId: '', userId: '' })
  const clearAll = () => change({ status: '', newsId: '', userId: '' })

  // ---- keep the page and the numbers right without loading them again ----

  // a comment was hidden or shown: the row changes, or leaves the list when the open tab is the other status
  const applyStatus = (before, after) => {
    setState((current) => {
      if (!current.data) return current
      const stays = !status || after.status === status
      const list = stays ? current.data.items.map((row) => (row.id === after.id ? after : row)) : current.data.items.filter((row) => row.id !== after.id)
      return { ...current, data: { ...current.data, items: list, totalElements: current.data.totalElements - (stays ? 0 : 1) } }
    })
    if (before.status !== after.status) setCounts((current) => current && { ...current, [before.status]: current[before.status] - 1, [after.status]: current[after.status] + 1 })
  }
  const applyDelete = (comment) => {
    setState((current) => (current.data ? { ...current, data: { ...current.data, items: current.data.items.filter((row) => row.id !== comment.id), totalElements: current.data.totalElements - 1 } } : current))
    setCounts((current) => current && { ...current, '': current[''] - 1, [comment.status]: current[comment.status] - 1 })
    setSelected(selectedIds.filter((id) => id !== comment.id))
  }
  const reload = () => {
    setTick((value) => value + 1)
    setCountsTick((value) => value + 1)
  }

  // ---- one comment ----

  const toggle = async (comment) => {
    const hide = comment.status === 'VISIBLE'
    setBusyId(comment.id)
    try {
      const updated = await (hide ? commentService.hideComment(comment.id) : commentService.unhideComment(comment.id))
      applyStatus(comment, updated)
      setToast({ variant: 'success', text: t(hide ? 'news.comments.moderation.hiddenDone' : 'news.comments.moderation.unhiddenDone') })
    } catch (caught) {
      setToast({ variant: 'danger', text: errorMessage(caught) })
    } finally {
      setBusyId(null)
    }
  }

  // ---- a selection: the single-item endpoints one by one, with a count of what worked and what failed ----

  const runBulk = async (kind, targets) => {
    setProgress({ done: 0, total: targets.length })
    const succeeded = []
    let failed = 0
    for (const comment of targets) {
      try {
        if (kind === 'delete') {
          await commentService.deleteComment(comment.id)
          applyDelete(comment)
        } else {
          applyStatus(comment, await (kind === 'hide' ? commentService.hideComment(comment.id) : commentService.unhideComment(comment.id)))
        }
        succeeded.push(comment.id)
      } catch {
        failed += 1
      }
      setProgress((current) => current && { ...current, done: current.done + 1 })
    }
    setProgress(null)
    setSelected(selectedIds.filter((id) => !succeeded.includes(id)))
    const done = t(`news.comments.moderation.bulk.${kind}`, { count: succeeded.length })
    setToast({ variant: failed > 0 ? 'danger' : 'success', text: failed > 0 ? `${done}, ${t('news.comments.moderation.bulk.failed', { count: failed })}` : done })
    reload()
  }
  const bulk = (kind) => {
    const wanted = kind === 'hide' ? 'VISIBLE' : 'HIDDEN'
    runBulk(kind, selected.filter((comment) => comment.status === wanted))
  }

  const confirmDelete = async () => {
    setDeleting(true)
    if (toDelete === 'selected') {
      await runBulk('delete', selected)
    } else {
      try {
        await commentService.deleteComment(toDelete.id)
        applyDelete(toDelete)
        setToast({ variant: 'success', text: t('news.comments.moderation.deleted') })
      } catch (caught) {
        setToast({ variant: 'danger', text: errorMessage(caught) })
      }
    }
    setDeleting(false)
    setToDelete(null)
  }

  const allSelected = items.length > 0 && selected.length === items.length
  const tabs = [
    { value: '', label: t('news.comments.moderation.tabs.all') },
    { value: 'VISIBLE', label: t('news.comments.moderation.tabs.VISIBLE') },
    { value: 'HIDDEN', label: t('news.comments.moderation.tabs.HIDDEN') },
  ].map((tab) => ({ ...tab, count: counts?.[tab.value] }))
  const noneFor = hasFilters || status === 'VISIBLE' ? 'filtered' : status === 'HIDDEN' ? 'hidden' : 'none'

  return (
    <div>
      <div className="mb-3">
        <h1 className="h4 mb-1">{t('news.comments.moderation.title')}</h1>
        <p className="text-muted small mb-0">{t('news.comments.moderation.intro')}</p>
      </div>

      <StatusTabs tabs={tabs} active={status} label={t('news.comments.moderation.status')} onChange={(value) => change({ status: value })} />

      <Card className="article-card">
        <div className="article-toolbar d-flex flex-wrap align-items-center gap-2 p-3">
          {newsId ? (
            <Badge bg="" className="filter-chip d-inline-flex align-items-center gap-2">
              <span className="news-title">{t('news.comments.moderation.articleChip', { title: articleTitle })}</span>
              <button type="button" className="tag-chip__remove" aria-label={t('news.comments.moderation.removeArticleFilter')} onClick={() => change({ newsId: '' })}>
                <X aria-hidden="true" />
              </button>
            </Badge>
          ) : (
            <div className="article-picker-wrap">
              <ArticlePicker
                onPick={(article) => {
                  setPicked(article)
                  change({ newsId: article.id })
                }}
              />
            </div>
          )}
          {userId && (
            <Badge bg="" className="filter-chip d-inline-flex align-items-center gap-2">
              <span>{t('news.comments.moderation.commenter', { name: commenter || `#${userId}` })}</span>
              <button type="button" className="tag-chip__remove" aria-label={t('news.comments.moderation.removeCommenterFilter')} onClick={() => change({ userId: '' })}>
                <X aria-hidden="true" />
              </button>
            </Badge>
          )}
          {hasFilters && (
            <Button variant="link" size="sm" className="p-0" onClick={clearFilters}>
              {t('news.list.toolbar.clear')}
            </Button>
          )}
        </div>

        {items.length > 0 && (
          <div className="comment-bar d-flex flex-wrap align-items-center gap-2 px-3 py-2">
            <input
              type="checkbox"
              className="form-check-input mt-0"
              aria-label={t('news.comments.moderation.selectAll')}
              checked={allSelected}
              ref={(element) => {
                if (element) element.indeterminate = selected.length > 0 && !allSelected
              }}
              disabled={Boolean(progress)}
              onChange={(event) => setSelected(event.target.checked ? items.map((comment) => comment.id) : [])}
            />
            {selected.length === 0 ? (
              <span className="small text-muted">{t('news.comments.moderation.selectAll')}</span>
            ) : (
              <>
                <span className="small fw-semibold" aria-live="polite">
                  {progress ? t('news.comments.moderation.bulk.progress', { done: formatNumber(progress.done), total: formatNumber(progress.total) }) : `${t('news.comments.moderation.selected', { count: selected.length })}:`}
                </span>
                <Button size="sm" variant="outline-secondary" disabled={Boolean(progress) || !selected.some((comment) => comment.status === 'VISIBLE')} onClick={() => bulk('hide')}>
                  {t('news.comments.moderation.hideSelected')}
                </Button>
                <Button size="sm" variant="outline-success" disabled={Boolean(progress) || !selected.some((comment) => comment.status === 'HIDDEN')} onClick={() => bulk('show')}>
                  {t('news.comments.moderation.showSelected')}
                </Button>
                <Button size="sm" variant="outline-danger" disabled={Boolean(progress)} onClick={() => setToDelete('selected')}>
                  {t('news.comments.moderation.deleteSelected')}
                </Button>
                <Button size="sm" variant="link" disabled={Boolean(progress)} onClick={() => setSelected([])}>
                  {t('news.comments.moderation.clearSelection')}
                </Button>
              </>
            )}
          </div>
        )}

        {loading && <CommentSkeleton />}
        {error && (
          <div className="p-4 text-center">
            <Alert variant="danger" className="d-inline-block mb-3">
              {errorMessage(error)}
            </Alert>
            <div>
              <Button variant="outline-primary" size="sm" onClick={reload}>
                {t('common.actions.retry')}
              </Button>
            </div>
          </div>
        )}
        {data && items.length === 0 && page === 1 && (
          <div className="d-flex flex-column align-items-center text-center text-muted py-5 px-3">
            <ChatDots size={36} aria-hidden="true" className="mb-2" />
            <p className="mb-3">{t(`news.comments.moderation.empty.${noneFor}`)}</p>
            {noneFor === 'filtered' && (
              <Button variant="outline-primary" size="sm" onClick={clearAll}>
                {t('news.list.toolbar.clear')}
              </Button>
            )}
          </div>
        )}
        {items.length > 0 && (
          <ul className="comment-list list-unstyled mb-0">
            {items.map((comment) => (
              <CommentRow
                key={comment.id}
                comment={comment}
                area={area}
                selected={selectedIds.includes(comment.id)}
                busy={busyId === comment.id}
                onSelect={(checked) => setSelected(checked ? [...selectedIds, comment.id] : selectedIds.filter((id) => id !== comment.id))}
                onToggle={toggle}
                onDelete={setToDelete}
                onFilterArticle={(row) => {
                  setPicked({ id: row.newsId, title: row.newsTitle })
                  change({ newsId: row.newsId })
                }}
                onFilterUser={(row) => change({ userId: row.userId })}
              />
            ))}
          </ul>
        )}
        {data && data.totalElements > 0 && (
          <ArticleFooter result={data} size={size} sizes={SIZES} onPage={(next) => change({ page: next })} onSize={(value) => change({ size: value === DEFAULT_SIZE ? '' : value })} />
        )}
      </Card>

      <ConfirmDialog
        show={Boolean(toDelete)}
        title={toDelete === 'selected' ? t('news.comments.moderation.deleteSelectedTitle') : t('news.comments.moderation.deleteTitle')}
        confirmLabel={t('common.actions.delete')}
        confirmVariant="danger"
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      >
        {toDelete === 'selected' && <p className="mb-0">{t('news.comments.moderation.deleteSelectedBody', { count: selected.length })}</p>}
        {toDelete && toDelete !== 'selected' && (
          <>
            <Trans i18nKey="news.comments.moderation.deleteBody" values={{ user: toDelete.userName, article: toDelete.newsTitle }} components={{ strong: <strong /> }} />
            <blockquote className="comment-body border-start ps-3 mt-3 mb-0 text-muted">{toDelete.content}</blockquote>
          </>
        )}
      </ConfirmDialog>

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
