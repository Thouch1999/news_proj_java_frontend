import { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Form, Row, Table } from 'react-bootstrap'
import { Link, useSearchParams } from 'react-router-dom'
import ErrorAlert from '../common/ErrorAlert'
import PageSpinner from '../common/PageSpinner'
import Pagination from '../common/Pagination'
import { NEWS_STATUS, WORKFLOW_ACTIONS, workflowActions } from '../../constants/newsStatus'
import { useWorkflowAction } from '../../hooks/useWorkflowAction'
import * as categoryService from '../../services/categoryService'
import * as newsService from '../../services/newsService'
import * as userService from '../../services/userService'
import DeleteArticleDialog from './DeleteArticleDialog'
import StatusBadge from './StatusBadge'
import WorkflowDialog from './WorkflowDialog'

const PAGE_SIZE = 10

// Article list shared by the author area (own articles), the editor area (all articles, with author and category
// filters, Review and Archive) and the admin area (the same plus Publish now, Restore and Delete on every row). `area` comes from constants/articleAreas.js.
export default function ArticleList({ area }) {
  const admin = area.admin
  const staff = area.staff // editor or admin: sees every article and may filter by author and category

  // filters and page live in the URL
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1)
  const status = searchParams.get('status') ?? ''
  const authorId = staff ? (searchParams.get('authorId') ?? '') : ''
  const categoryId = staff ? (searchParams.get('categoryId') ?? '') : ''

  const [reloadKey, setReloadKey] = useState(0)
  const queryKey = `${page}|${status}|${authorId}|${categoryId}|${reloadKey}`
  const [state, setState] = useState({ key: null, data: null, error: null })
  const loading = state.key !== queryKey
  const result = loading ? null : state.data
  const error = loading ? null : state.error

  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [actionError, setActionError] = useState(null)

  // choices for the extra filters of an editor/admin.
  //  - admin: everybody who can write articles, and all categories (also inactive ones)
  //  - editor: the users endpoint is admin only, so the authors are the ones found on the first 50 articles;
  //    the categories are the active ones
  const [choices, setChoices] = useState({ authors: [], categories: [] })

  useEffect(() => {
    if (!staff) {
      return undefined
    }
    let current = true
    const load = admin
      ? Promise.all([
          userService.listUsers({ role: 'AUTHOR', size: 100 }),
          userService.listUsers({ role: 'ADMIN', size: 100 }),
          categoryService.listCategoriesForAdmin(),
        ]).then(([authors, admins, categories]) => ({
          authors: [...authors.items, ...admins.items].map((user) => ({ id: user.id, label: `${user.fullName || user.username} (${user.role})` })),
          categories: categories ?? [],
        }))
      : Promise.all([newsService.listManagedNews({ size: 50 }), categoryService.listActiveCategories()]).then(([articles, categories]) => {
          const seen = new Map()
          articles.items.forEach((article) => seen.set(article.authorId, article.authorName))
          return { authors: [...seen].map(([id, label]) => ({ id, label: label || `User ${id}` })), categories: categories ?? [] }
        })
    load
      .then((loaded) => {
        if (current) setChoices(loaded)
      })
      .catch(() => {
        // the list still works without the filter choices
      })
    return () => {
      current = false
    }
  }, [staff, admin])

  useEffect(() => {
    let current = true
    newsService
      .listManagedNews({ page, size: PAGE_SIZE, status, authorId, categoryId })
      .then((data) => {
        if (current) setState({ key: queryKey, data, error: null })
      })
      .catch((caught) => {
        if (current) setState({ key: queryKey, data: null, error: caught })
      })
    return () => {
      current = false
    }
  }, [queryKey, page, status, authorId, categoryId])

  const changeParams = (changes) => {
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
    setSearchParams(next)
  }

  // an author may delete an own DRAFT only; an admin any article; an editor none
  const canDelete = (article) => admin || (!staff && article.status === 'DRAFT')

  // workflow actions offered on a row: archive a PUBLISHED article; an admin also "publish now" (DRAFT) and restore.
  // Reviewing a PENDING article (publish / reject) happens on its review page.
  const rowActions = (article) =>
    workflowActions(area.role, article.status).filter((action) => ['archive', 'restore'].includes(action.key) || (action.key === 'publish' && article.status === 'DRAFT'))

  const workflow = useWorkflowAction((updated, action) => {
    setActionError(null)
    setMessage(`"${updated.title}": ${WORKFLOW_ACTIONS[action].done}`)
    setReloadKey((key) => key + 1)
  })

  const handleDelete = async () => {
    setBusy(true)
    setActionError(null)
    setMessage(null)
    try {
      await newsService.deleteNews(toDelete.id)
      setMessage(`"${toDelete.title}" deleted.`)
      setReloadKey((key) => key + 1)
    } catch (caught) {
      setActionError(caught)
    } finally {
      setBusy(false)
      setToDelete(null)
    }
  }

  const hasFilters = Boolean(status || authorId || categoryId)

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">{area.title}</h1>
        {area.newPath && (
          <Button as={Link} to={area.newPath}>
            Write an article
          </Button>
        )}
      </div>

      <Card body className="mb-3">
        <Row className="g-2 align-items-end">
          <Col sm={6} md={3}>
            <Form.Label htmlFor="status-filter">Status</Form.Label>
            <Form.Select id="status-filter" value={status} onChange={(event) => changeParams({ status: event.target.value })}>
              <option value="">All</option>
              {Object.values(NEWS_STATUS).map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Form.Select>
          </Col>
          {staff && (
            <>
              <Col sm={6} md={3}>
                <Form.Label htmlFor="author-filter">Author</Form.Label>
                <Form.Select id="author-filter" value={authorId} onChange={(event) => changeParams({ authorId: event.target.value })}>
                  <option value="">All authors</option>
                  {choices.authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.label}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col sm={6} md={3}>
                <Form.Label htmlFor="category-filter">Category</Form.Label>
                <Form.Select id="category-filter" value={categoryId} onChange={(event) => changeParams({ categoryId: event.target.value })}>
                  <option value="">All categories</option>
                  {choices.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                      {category.active ? '' : ' (inactive)'}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </>
          )}
          {hasFilters && (
            <Col xs="auto">
              <Button variant="outline-secondary" onClick={() => setSearchParams(new URLSearchParams())}>
                Clear
              </Button>
            </Col>
          )}
        </Row>
      </Card>

      {message && <Alert variant="success">{message}</Alert>}
      <ErrorAlert error={actionError} />
      <ErrorAlert error={error} />
      {loading && <PageSpinner />}
      {!loading && result && (
        <>
          <Table responsive hover className="bg-white align-middle">
            <thead>
              <tr>
                <th>Title</th>
                {staff && <th>Author</th>}
                <th>Category</th>
                <th>Status</th>
                <th>Updated</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.items.length === 0 && (
                <tr>
                  <td colSpan={staff ? 6 : 5} className="text-center text-muted py-4">
                    No articles found.
                  </td>
                </tr>
              )}
              {result.items.map((article) => (
                <tr key={article.id}>
                  <td>
                    <Link to={area.editPath(article.id)}>{article.title}</Link>
                    {article.rejectionReason && article.status === 'REJECTED' && (
                      <div className="text-danger small">Rejected: {article.rejectionReason}</div>
                    )}
                  </td>
                  {staff && <td>{article.authorName}</td>}
                  <td>{article.categoryName}</td>
                  <td>
                    <StatusBadge status={article.status} />
                  </td>
                  <td className="text-nowrap">{article.updatedAt ? new Date(article.updatedAt).toLocaleString() : ''}</td>
                  <td className="text-end text-nowrap">
                    <Button as={Link} to={area.editPath(article.id)} size="sm" variant="outline-primary" className="me-1">
                      {article.editable ? 'Edit' : 'View'}
                    </Button>
                    {staff && article.status === 'PENDING' && (
                      <Button as={Link} to={area.reviewPath(article.id)} size="sm" variant="outline-warning" className="me-1">
                        Review
                      </Button>
                    )}
                    {rowActions(article).map((action) => (
                      <Button key={action.key} size="sm" variant={action.variant} className="me-1" onClick={() => workflow.start(action.key, article)}>
                        {action.label}
                      </Button>
                    ))}
                    {canDelete(article) && (
                      <Button size="sm" variant="outline-danger" onClick={() => setToDelete(article)}>
                        Delete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted small">
              {result.totalElements} article(s), page {result.totalPages === 0 ? 0 : result.page} of {result.totalPages}
            </span>
            <Pagination page={result.page} totalPages={result.totalPages} onChange={(next) => changeParams({ page: next })} />
          </div>
        </>
      )}

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
