import { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../common/ConfirmDialog'
import ErrorAlert from '../common/ErrorAlert'
import PageSpinner from '../common/PageSpinner'
import FormField from '../form/FormField'
import RichTextEditor from '../form/RichTextEditor'
import { useNewsHistory } from '../../hooks/useNewsHistory'
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning'
import { NEWS_STATUS } from '../../constants/newsStatus'
import * as categoryService from '../../services/categoryService'
import * as newsService from '../../services/newsService'
import * as tagService from '../../services/tagService'
import { blankToNull, hasErrors, rules } from '../../utils/validators'
import ArticleMedia from './ArticleMedia'
import DeleteArticleDialog from './DeleteArticleDialog'
import SafeHtml from './SafeHtml'
import StatusBadge from './StatusBadge'
import WorkflowCard from './WorkflowCard'

// What the backend needs from the form
function toForm(article) {
  return {
    title: article?.title ?? '',
    summary: article?.summary ?? '',
    content: article?.content ?? '',
    categoryId: article ? String(article.category.id) : '',
    tagIds: article ? article.tags.map((tag) => tag.id) : [],
    commentsEnabled: article?.commentsEnabled ?? true,
  }
}

function RejectionNotice({ reason, area }) {
  const hint = area.admin
    ? 'As an admin you can edit this article in any status.'
    : area.staff
      ? 'The author can fix it and submit it again. You can also edit it yourself.'
      : 'Fix what the editor asked for, save your changes and submit the article for review again.'
  return (
    <Alert variant="danger">
      <Alert.Heading className="h6">This article was rejected</Alert.Heading>
      <p className="mb-0">{reason || 'The editor did not give a reason.'}</p>
      <hr />
      <p className="mb-0 small">{hint}</p>
    </Alert>
  )
}

// Why a read-only article cannot be edited by this role
function lockedReason(article, area) {
  const status = NEWS_STATUS[article.status]?.label.toLowerCase() ?? article.status
  if (area.staff) {
    return `This article is ${status}. Only an admin can edit an archived article.`
  }
  return `This article is ${status} and cannot be edited. Only a draft or a rejected article can be changed.`
}

// Everything of an article that cannot be edited: shown as it is
function ArticleView({ area, article, history, message, onWorkflowChange, onThumbnailChange, onImagesChange }) {
  return (
    <Row className="g-4">
      <Col lg={8}>
        <h1 className="h3 mb-2">{article.title}</h1>
        <p className="mb-3">
          <StatusBadge status={article.status} /> <span className="text-muted small ms-2">{article.category.name}</span>
          {area.staff && article.authorName && <span className="text-muted small ms-2">by {article.authorName}</span>}
        </p>
        {message && <Alert variant="success">{message}</Alert>}
        <Alert variant="secondary">{lockedReason(article, area)}</Alert>
        {article.summary && <p className="lead">{article.summary}</p>}
        <SafeHtml html={article.content} />
        {article.tags.length > 0 && <p className="text-muted small">Tags: {article.tags.map((tag) => tag.name).join(', ')}</p>}
        <ArticleMedia newsId={article.id} thumbnail={article.thumbnail} images={article.images} editable={false} onThumbnailChange={onThumbnailChange} onImagesChange={onImagesChange} />
      </Col>
      <Col lg={4}>
        <WorkflowCard area={area} article={article} history={history} onChange={onWorkflowChange} />
      </Col>
    </Row>
  )
}

function ArticleForm({ area, initial, categories, tags }) {
  const admin = area.admin
  const navigate = useNavigate()
  const { state: locationState } = useLocation()
  const [article, setArticle] = useState(initial) // null while writing a new article
  const [form, setForm] = useState(() => toForm(initial))
  const [saved, setSaved] = useState(() => JSON.stringify(toForm(initial)))
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [message, setMessage] = useState(locationState?.message ?? null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const history = useNewsHistory(article)

  const dirty = JSON.stringify(form) !== saved
  const { blocker, markClean } = useUnsavedChangesWarning(dirty)

  // after a workflow action (submit, publish, ...) the backend returns the whole article
  const handleWorkflowChange = (updated, done) => {
    setArticle(updated)
    setMessage(done)
    setApiError(null)
  }

  const change = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const toggleTag = (id) => change('tagIds', form.tagIds.includes(id) ? form.tagIds.filter((tagId) => tagId !== id) : [...form.tagIds, id])

  // the article's own category may have been deactivated since: keep it in the list so the form still shows it
  const options = [...categories]
  if (article && !options.some((category) => category.id === article.category.id)) {
    options.push({ ...article.category, name: `${article.category.name} (inactive)` })
  }

  // an author may delete an own DRAFT only; an admin any article; an editor none
  const canDelete = Boolean(article) && (admin || (!area.staff && article.status === 'DRAFT'))

  const handleSave = async (event) => {
    event.preventDefault()
    const found = {
      title: rules.title(form.title),
      summary: rules.summary(form.summary),
      content: rules.content(form.content),
      categoryId: form.categoryId ? '' : 'Choose a category',
      tagIds: form.tagIds.length > 20 ? 'An article can have at most 20 tags' : '',
    }
    setErrors(found)
    setApiError(null)
    setMessage(null)
    if (hasErrors(found)) {
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        title: form.title.trim(),
        summary: blankToNull(form.summary),
        content: form.content,
        categoryId: Number(form.categoryId),
        tagIds: form.tagIds,
        commentsEnabled: form.commentsEnabled,
      }
      if (article) {
        const updated = await newsService.updateNews(article.id, payload)
        setArticle(updated)
        setSaved(JSON.stringify(form))
        setMessage(article.status === 'DRAFT' ? 'Draft saved.' : 'Changes saved.')
      } else {
        const created = await newsService.createNews(payload)
        markClean() // the page changes to the saved article: no "unsaved changes" question
        navigate(area.editPath(created.id), { replace: true, state: { message: 'Draft saved. You can now add a thumbnail and images.' } })
      }
    } catch (error) {
      setApiError(error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setApiError(null)
    try {
      await newsService.deleteNews(article.id)
      markClean()
      navigate(area.listPath, { replace: true })
    } catch (error) {
      setApiError(error)
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const leaveDialog = (
    <ConfirmDialog show={blocker.state === 'blocked'} title="Leave without saving?" confirmLabel="Leave" confirmVariant="danger" onCancel={() => blocker.reset()} onConfirm={() => blocker.proceed()}>
      You have unsaved changes. If you leave this page they are lost.
    </ConfirmDialog>
  )

  // not editable (an author: any status except DRAFT and REJECTED; an editor: ARCHIVED): read-only view
  if (article && !article.editable) {
    return (
      <div style={{ maxWidth: 1000 }}>
        <div className="mb-3">
          <Link to={area.listPath}>&larr; {area.backLabel}</Link>
        </div>
        <ArticleView
          area={area}
          article={article}
          history={history}
          message={message}
          onWorkflowChange={handleWorkflowChange}
          onThumbnailChange={(thumbnail) => setArticle((current) => ({ ...current, thumbnail }))}
          onImagesChange={(images) => setArticle((current) => ({ ...current, images }))}
        />
      </div>
    )
  }

  const staffEditingNonDraft = area.staff && article && article.status !== 'DRAFT' && article.status !== 'REJECTED'

  return (
    <div style={{ maxWidth: 1000 }}>
      <div className="mb-3">
        <Link to={area.listPath}>&larr; {area.backLabel}</Link>
      </div>
      {article?.status === 'REJECTED' && <RejectionNotice reason={article.rejectionReason} area={area} />}
      {staffEditingNonDraft && (
        <Alert variant="warning">
          This article is {NEWS_STATUS[article.status]?.label.toLowerCase() ?? article.status}. You can edit it as {admin ? 'an admin' : 'an editor'}; changes apply to the stored article straight away.
        </Alert>
      )}
      <div className="d-flex align-items-center gap-3 mb-3">
        <h1 className="h4 mb-0">{article ? 'Edit article' : 'Write an article'}</h1>
        {article && <StatusBadge status={article.status} />}
        {article && area.staff && article.authorName && <span className="text-muted small">by {article.authorName}</span>}
        {dirty && <span className="text-warning small">Unsaved changes</span>}
      </div>
      {message && <Alert variant="success">{message}</Alert>}
      <ErrorAlert error={apiError} />

      <Form onSubmit={handleSave} noValidate>
        <Row className="g-4">
          <Col lg={8}>
            <FormField id="title" label="Title" value={form.title} onChange={(event) => change('title', event.target.value)} error={errors.title} />
            <FormField id="summary" label="Summary (optional)" as="textarea" rows={3} value={form.summary} onChange={(event) => change('summary', event.target.value)} error={errors.summary} />
            <Form.Group className="mb-3">
              <Form.Label>Content</Form.Label>
              <RichTextEditor value={form.content} onChange={(html) => change('content', html)} invalid={Boolean(errors.content)} />
              {errors.content && <div className="text-danger small mt-1">{errors.content}</div>}
            </Form.Group>
          </Col>

          <Col lg={4}>
            <Card body className="mb-3">
              <Form.Group className="mb-3" controlId="category">
                <Form.Label>Category</Form.Label>
                <Form.Select value={form.categoryId} isInvalid={Boolean(errors.categoryId)} onChange={(event) => change('categoryId', event.target.value)}>
                  <option value="">Choose a category</option>
                  {options.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.categoryId}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Tags</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {tags.length === 0 && <span className="text-muted small">No tags exist yet.</span>}
                  {tags.map((tag) => (
                    <Button key={tag.id} type="button" size="sm" variant={form.tagIds.includes(tag.id) ? 'primary' : 'outline-secondary'} aria-pressed={form.tagIds.includes(tag.id)} onClick={() => toggleTag(tag.id)}>
                      {tag.name}
                    </Button>
                  ))}
                </div>
                {errors.tagIds && <div className="text-danger small mt-1">{errors.tagIds}</div>}
              </Form.Group>

              <Form.Check id="comments" type="switch" label="Allow comments" checked={form.commentsEnabled} onChange={(event) => change('commentsEnabled', event.target.checked)} />
            </Card>

            <div className="d-flex gap-2 mb-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : article && article.status !== 'DRAFT' ? 'Save changes' : 'Save draft'}
              </Button>
              {canDelete && (
                <Button type="button" variant="outline-danger" disabled={submitting} onClick={() => setConfirmDelete(true)}>
                  {admin ? 'Delete article' : 'Delete draft'}
                </Button>
              )}
            </div>

            {article && <WorkflowCard area={area} article={article} history={history} dirty={dirty} onChange={handleWorkflowChange} />}

            {article ? (
              <ArticleMedia
                newsId={article.id}
                thumbnail={article.thumbnail}
                images={article.images}
                editable
                onThumbnailChange={(thumbnail) => setArticle((current) => ({ ...current, thumbnail }))}
                onImagesChange={(images) => setArticle((current) => ({ ...current, images }))}
              />
            ) : (
              <Alert variant="info" className="small">
                Save the draft first. Then you can add a thumbnail and images.
              </Alert>
            )}
          </Col>
        </Row>
      </Form>

      {leaveDialog}
      <DeleteArticleDialog key={confirmDelete ? 'open' : 'closed'} article={confirmDelete ? article : null} admin={admin} busy={deleting} onCancel={() => setConfirmDelete(false)} onConfirm={handleDelete} />
    </div>
  )
}

// Loads the article (when editing), the active categories and the tags; the form mounts when all are there.
export default function ArticleEditor({ area }) {
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [data, setData] = useState({ key: null, article: null, categories: [], tags: [], error: null })
  const key = id ?? 'new'
  const loading = data.key !== key

  useEffect(() => {
    let current = true
    Promise.all([
      isEdit ? newsService.getManagedNews(id) : Promise.resolve(null),
      categoryService.listActiveCategories(),
      tagService.listTags(),
    ])
      .then(([article, categories, tags]) => {
        if (current) setData({ key, article, categories: categories ?? [], tags: tags ?? [], error: null })
      })
      .catch((error) => {
        if (current) setData({ key, article: null, categories: [], tags: [], error })
      })
    return () => {
      current = false
    }
  }, [key, id, isEdit])

  if (loading) {
    return <PageSpinner />
  }
  if (data.error) {
    return (
      <div>
        <ErrorAlert error={data.error} />
        <Link to={area.listPath}>{area.backLabel}</Link>
      </div>
    )
  }
  return <ArticleForm key={key} area={area} initial={data.article} categories={data.categories} tags={data.tags} />
}
