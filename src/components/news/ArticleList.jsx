import { useEffect, useState } from 'react'
import { Alert, Button, Card, Table, Toast, ToastContainer } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { ARTICLE_PAGE_SIZES, WORKFLOW_ACTIONS } from '../../constants/newsStatus'
import { useArticleFilterChoices } from '../../hooks/useArticleFilterChoices'
import { useRefreshWhenDue } from '../../hooks/useRefreshWhenDue'
import { useWorkflowAction } from '../../hooks/useWorkflowAction'
import * as newsService from '../../services/newsService'
import * as reportService from '../../services/reportService'
import { errorMessage } from '../../utils/errorMessage'
import { ArticleActions, ArticleEmpty, ArticleFooter, ArticleSkeleton, ArticleStatusTabs, ArticleTitleCell, ArticleToolbar, AuthorCell, GoesLiveCell, UpdatedCell } from './ArticleListParts'
import DeleteArticleDialog from './DeleteArticleDialog'
import StatusBadge from './StatusBadge'
import WorkflowDialog from './WorkflowDialog'

const DEFAULT_SIZE = ARTICLE_PAGE_SIZES[0]

// Article list shared by the author area (own articles), the editor area (all articles, with author and category
// filters, Review and Archive) and the admin area (the same plus Publish now, Restore and Delete). `area` comes from
// constants/articleAreas.js. Status, filters, page and page size live in the URL.
//
// What the backend list (GET /news/manage) does not offer is left out here: no search by title, no sorting, and no views
// or comments per article.
export default function ArticleList({ area }) {
  const { t } = useTranslation()
  const admin = area.admin
  const staff = area.staff // editor or admin: sees every article and may filter by author and category

  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1)
  const askedSize = parseInt(searchParams.get('size') ?? '', 10)
  const size = ARTICLE_PAGE_SIZES.includes(askedSize) ? askedSize : DEFAULT_SIZE
  const status = searchParams.get('status') ?? ''
  const authorId = staff ? (searchParams.get('authorId') ?? '') : ''
  const categoryId = staff ? (searchParams.get('categoryId') ?? '') : ''

  const [reloadKey, setReloadKey] = useState(0)
  const queryKey = `${page}|${size}|${status}|${authorId}|${categoryId}|${reloadKey}`
  const [state, setState] = useState({ key: null, data: null, error: null })
  const loading = state.key !== queryKey
  const result = loading ? null : state.data
  const error = loading ? null : state.error

  const choices = useArticleFilterChoices(area)
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null) // { variant, text }

  // the numbers on the tabs: the status counts of the dashboard report (the whole site for an editor and an admin, the
  // own articles for an author). The last numbers stay while they are refreshed.
  const [counts, setCounts] = useState(null)
  useEffect(() => {
    let current = true
    const load = staff ? reportService.getSummary() : reportService.getAuthorDashboard()
    load
      .then((data) => {
        if (current) setCounts(data)
      })
      .catch(() => {
        // the tabs work without the numbers
      })
    return () => {
      current = false
    }
  }, [staff, reloadKey])

  useEffect(() => {
    let current = true
    newsService
      .listManagedNews({ page, size, status, authorId, categoryId, sort: status === 'SCHEDULED' ? 'scheduledAt' : undefined })
      .then((data) => {
        if (current) setState({ key: queryKey, data, error: null })
      })
      .catch((caught) => {
        if (current) setState({ key: queryKey, data: null, error: caught })
      })
    return () => {
      current = false
    }
  }, [queryKey, page, size, status, authorId, categoryId])

  const changeParams = (changes, options) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || value === undefined || value === null) {
        next.delete(key)
      } else {
        next.set(key, String(value))
      }
    })
    if (!('page' in changes)) {
      next.delete('page')
    }
    setSearchParams(next, options)
  }

  // after the last article of the last page was removed, go to the new last page
  useEffect(() => {
    if (result && result.items.length === 0 && page > 1) {
      changeParams({ page: Math.max(result.totalPages, 1) }, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result])

  const clearToolbar = () => changeParams({ authorId: '', categoryId: '' })
  const clearAll = () => changeParams({ status: '', authorId: '', categoryId: '' })
  const filtered = Boolean(status || authorId || categoryId)

  // an author may delete an own DRAFT only; an admin any article; an editor none
  const canDelete = (article) => admin || (!staff && article.status === 'DRAFT')

  const refresh = () => setReloadKey((key) => key + 1)
  // an article whose time has come is published by the backend within a minute: the list follows without a click
  useRefreshWhenDue(
    (result?.items ?? []).filter((article) => article.status === 'SCHEDULED' && article.scheduledAt).map((article) => article.scheduledAt),
    refresh,
  )
  const workflow = useWorkflowAction((updated, action) => {
    setToast({ variant: 'success', text: t('news.list.workflowDone', { title: updated.title, message: t(WORKFLOW_ACTIONS[action].doneKey) }) })
    refresh()
  })

  const handleDelete = async () => {
    setBusy(true)
    try {
      await newsService.deleteNews(toDelete.id)
      setToast({ variant: 'success', text: t('news.list.deleted', { title: toDelete.title }) })
      refresh()
    } catch (caught) {
      setToast({ variant: 'danger', text: errorMessage(caught) })
    } finally {
      setBusy(false)
      setToDelete(null)
    }
  }

  const actions = (article) => <ArticleActions article={article} area={area} canDelete={canDelete(article)} onWorkflow={workflow.start} onDelete={setToDelete} />
  const showEmpty = result && result.items.length === 0 && page === 1

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h1 className="h4 mb-1">{t(area.titleKey)}</h1>
          <p className="text-muted small mb-0">{t(area.descriptionKey)}</p>
        </div>
        {area.newPath && (
          <Button as={Link} to={area.newPath}>
            {t('news.list.create')}
          </Button>
        )}
      </div>

      <ArticleStatusTabs active={status} counts={counts} onChange={(value) => changeParams({ status: value })} />

      <Card className="article-card" role="tabpanel">
        {staff && <ArticleToolbar authorId={authorId} categoryId={categoryId} choices={choices} onChange={changeParams} onClear={clearToolbar} />}

        {loading && <ArticleSkeleton staff={staff} />}
        {error && (
          <div className="p-4 text-center">
            <Alert variant="danger" className="d-inline-block mb-3">
              {errorMessage(error)}
            </Alert>
            <div>
              <Button variant="outline-primary" size="sm" onClick={refresh}>
                {t('common.actions.retry')}
              </Button>
            </div>
          </div>
        )}
        {showEmpty && <ArticleEmpty filtered={filtered} area={area} onClear={clearAll} />}

        {result && result.items.length > 0 && (
          <>
            <div className="article-table-wrap d-none d-md-block">
              <Table hover className="article-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>{t('news.list.columns.article')}</th>
                    {staff && <th>{t('news.list.columns.author')}</th>}
                    <th>{t('news.list.columns.status')}</th>
                    <th>{status === 'SCHEDULED' ? t('news.list.columns.goesLive') : t('news.list.columns.updated')}</th>
                    <th className="text-end">{t('news.list.columns.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((article) => (
                    <tr key={article.id}>
                      <td>
                        <ArticleTitleCell article={article} area={area} />
                      </td>
                      {staff && (
                        <td>
                          <AuthorCell name={article.authorName} />
                        </td>
                      )}
                      <td>
                        <StatusBadge status={article.status} />
                      </td>
                      <td>{article.status === 'SCHEDULED' && article.scheduledAt ? <GoesLiveCell value={article.scheduledAt} /> : <UpdatedCell value={article.updatedAt} />}</td>
                      <td className="text-end text-nowrap">{actions(article)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <ul className="article-cards list-unstyled mb-0 d-md-none">
              {result.items.map((article) => (
                <li key={article.id}>
                  <ArticleTitleCell article={article} area={area} />
                  <div className="d-flex flex-wrap align-items-center gap-2 mt-2 small">
                    <StatusBadge status={article.status} />
                    {staff && <AuthorCell name={article.authorName} />}
                    <span className="text-muted">{article.status === 'SCHEDULED' && article.scheduledAt ? <GoesLiveCell value={article.scheduledAt} /> : <UpdatedCell value={article.updatedAt} />}</span>
                    <span className="ms-auto">{actions(article)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {result && result.totalElements > 0 && (
          <ArticleFooter result={result} size={size} onPage={(next) => changeParams({ page: next })} onSize={(value) => changeParams({ size: value === DEFAULT_SIZE ? '' : value })} />
        )}
      </Card>

      <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 2000 }}>
        <Toast bg={toast?.variant ?? 'success'} show={Boolean(toast)} onClose={() => setToast(null)} delay={5000} autohide>
          <Toast.Body className="text-white d-flex justify-content-between gap-3">
            <span>{toast?.text}</span>
            <button type="button" className="btn-close btn-close-white" aria-label={t('common.actions.close')} onClick={() => setToast(null)} />
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <WorkflowDialog
        key={`${workflow.pending?.action}-${workflow.pending?.article.id}`}
        action={workflow.pending?.action}
        article={workflow.pending?.article}
        busy={workflow.busy}
        error={workflow.error}
        onCancel={workflow.cancel}
        onConfirm={workflow.confirm}
      />
      <DeleteArticleDialog key={toDelete?.id ?? 'none'} article={toDelete} admin={admin} busy={busy} onCancel={() => setToDelete(null)} onConfirm={handleDelete} />
    </div>
  )
}
