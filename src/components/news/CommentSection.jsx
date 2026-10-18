import { useEffect, useState } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import ConfirmDialog from '../common/ConfirmDialog'
import UserAvatar from '../common/UserAvatar'
import ErrorAlert from '../common/ErrorAlert'
import PageSpinner from '../common/PageSpinner'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import * as commentService from '../../services/commentService'
import { useFormat } from '../../hooks/useFormat'

const PAGE_SIZE = 10
const MAX_LENGTH = 2000

function CommentForm({ newsId, onAdded }) {
  const { t } = useTranslation()
  const [content, setContent] = useState('')
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const blank = !content.trim()

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (blank) {
      return
    }
    setSending(true)
    setError(null)
    try {
      const created = await commentService.addComment(newsId, content.trim())
      setContent('')
      onAdded(created)
    } catch (caught) {
      setError(caught) // for example 409: an editor switched the comments off meanwhile
    } finally {
      setSending(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit} className="mb-4" noValidate>
      <ErrorAlert error={error} />
      <Form.Group controlId="new-comment">
        <Form.Label className="visually-hidden">{t('public.comments.write')}</Form.Label>
        <Form.Control as="textarea" rows={3} maxLength={MAX_LENGTH} placeholder={t('public.comments.placeholder')} value={content} onChange={(event) => setContent(event.target.value)} />
      </Form.Group>
      <div className="d-flex justify-content-between align-items-center mt-2">
        <span className="text-muted small">
          {content.length}/{MAX_LENGTH}
        </span>
        <Button type="submit" disabled={sending || blank}>
          {sending ? t('public.comments.sending') : t('public.comments.post')}
        </Button>
      </div>
    </Form>
  )
}

function CommentItem({ comment, own, onDelete }) {
  const { t } = useTranslation()
  const { formatAgo, formatFullDate } = useFormat()
  return (
    <li className="comment-item">
      <UserAvatar name={comment.userName ?? ''} size={36} fallback="initial" className={`user-avatar user-avatar--${(comment.userId ?? 0) % 6}`} />
      <div className="comment-item__body">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div className="min-w-0">
            <span className="fw-semibold news-title">{comment.userName}</span>
            <time className="text-muted small ms-2" dateTime={comment.createdAt} title={formatFullDate(comment.createdAt)}>
              {formatAgo(comment.createdAt)}
            </time>
          </div>
          {own && (
            <Button size="sm" variant="link" className="text-danger p-0 flex-shrink-0" onClick={() => onDelete(comment)}>
              {t('common.actions.delete')}
            </Button>
          )}
        </div>
        {/* plain text: React escapes it, line breaks are kept by the CSS class */}
        <p className="comment-text mb-0 mt-1">{comment.content}</p>
      </div>
    </li>
  )
}

// The comments of a published article: the list ("Load more"), the form for logged-in users, "Log in to comment"
// for guests and a notice when an editor switched the comments off. `article` is the public article.
export default function CommentSection({ article }) {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  const [state, setState] = useState({ items: [], page: 0, total: 0, hasNext: false, loading: true, error: null })
  const [loadingMore, setLoadingMore] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  useEffect(() => {
    let current = true
    commentService
      .listComments(article.id, { page: 1, size: PAGE_SIZE })
      .then((result) => {
        if (current) setState({ items: result.items, page: 1, total: result.totalElements, hasNext: result.hasNext, loading: false, error: null })
      })
      .catch((error) => {
        if (current) setState((previous) => ({ ...previous, loading: false, error }))
      })
    return () => {
      current = false
    }
  }, [article.id])

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const result = await commentService.listComments(article.id, { page: state.page + 1, size: PAGE_SIZE })
      // a comment added meanwhile moves the pages: never show the same comment twice
      setState((previous) => {
        const known = new Set(previous.items.map((item) => item.id))
        return { ...previous, items: [...previous.items, ...result.items.filter((item) => !known.has(item.id))], page: result.page, total: result.totalElements, hasNext: result.hasNext }
      })
    } catch (error) {
      setState((previous) => ({ ...previous, error }))
    } finally {
      setLoadingMore(false)
    }
  }

  const handleAdded = (created) => setState((previous) => ({ ...previous, items: [created, ...previous.items], total: previous.total + 1, error: null }))

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await commentService.deleteComment(toDelete.id)
      const removed = toDelete.id
      setState((previous) => ({ ...previous, items: previous.items.filter((item) => item.id !== removed), total: Math.max(previous.total - 1, 0) }))
      setToDelete(null)
    } catch (error) {
      setDeleteError(error)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section aria-labelledby="comments-title" className="mt-5">
      <h2 id="comments-title" className="article-section-title">
        {t('public.comments.title', { total: formatNumber(state.total) })}
      </h2>

      {!article.commentsEnabled && <Alert variant="secondary">{t('public.comments.off')}</Alert>}
      {article.commentsEnabled && isAuthenticated && <CommentForm newsId={article.id} onAdded={handleAdded} />}
      {article.commentsEnabled && !isAuthenticated && (
        <div className="comment-login">
          <Trans i18nKey="public.comments.loginPrompt" components={{ 1: <Link to={ROUTES.LOGIN} state={{ from: location }} /> }} />
        </div>
      )}

      {state.loading && <PageSpinner />}
      <ErrorAlert error={state.error} />
      {!state.loading && state.items.length === 0 && !state.error && <p className="text-muted">{t('public.comments.empty')}</p>}
      {state.items.length > 0 && (
        <ul className="comment-list list-unstyled mb-0">
          {state.items.map((comment) => (
            <CommentItem key={comment.id} comment={comment} own={user?.id === comment.userId} onDelete={(item) => { setDeleteError(null); setToDelete(item) }} />
          ))}
        </ul>
      )}
      {state.hasNext && (
        <div className="text-center mt-3">
          <Button variant="outline-primary" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? t('common.loading') : t('public.comments.loadMore')}
          </Button>
        </div>
      )}

      <ConfirmDialog show={Boolean(toDelete)} title={t('public.comments.deleteTitle')} confirmLabel={t('common.actions.delete')} confirmVariant="danger" busy={deleting} onCancel={() => setToDelete(null)} onConfirm={handleDelete}>
        <ErrorAlert error={deleteError} />
        {t('public.comments.deleteConfirm')}
      </ConfirmDialog>
    </section>
  )
}
