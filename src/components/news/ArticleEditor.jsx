import { useEffect, useRef, useState } from 'react'
import { Card, Form, Toast, ToastContainer } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../common/ConfirmDialog'
import ErrorAlert from '../common/ErrorAlert'
import PageSpinner from '../common/PageSpinner'
import { WORKFLOW_ACTIONS, workflowActions } from '../../constants/newsStatus'
import { MAX_IMAGES_PER_NEWS } from '../../constants/upload'
import { useAuth } from '../../hooks/useAuth'
import { useNewsHistory } from '../../hooks/useNewsHistory'
import { useReviewCount } from '../../hooks/useReviewCount'
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning'
import { useWorkflowAction } from '../../hooks/useWorkflowAction'
import * as categoryService from '../../services/categoryService'
import * as newsService from '../../services/newsService'
import * as tagService from '../../services/tagService'
import { errorMessage } from '../../utils/errorMessage'
import { mediaUrl } from '../../utils/mediaUrl'
import { blankToNull, hasErrors, rules } from '../../utils/validators'
import ArticleEditorHeader, { ArticleNotice } from './ArticleEditorHeader'
import { ContentField, SummaryField, TitleField } from './ArticleFields'
import { ImagesCard, ThumbnailCard } from './ArticleMedia'
import ArticlePreviewModal from './ArticlePreviewModal'
import ActivityHistoryCard from '../activity/ActivityHistoryCard'
import { CommentsFormCard, HistoryCard, OrganizeCard, PublishingCard } from './ArticleSideCards'
import CommentsToggleCard from './CommentsToggleCard'
import DeleteArticleDialog from './DeleteArticleDialog'
import SafeHtml from './SafeHtml'
import WorkflowDialog from './WorkflowDialog'

// The fields the backend can report an error for, in the order of the page (the page scrolls to the first one)
const FIELD_ORDER = ['title', 'summary', 'content', 'categoryId', 'tagIds']
const FIELD_ID = { title: 'field-title', summary: 'field-summary', content: 'field-content', categoryId: 'field-category', tagIds: 'field-tags' }

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

// An article that this role cannot edit (an author: any status except DRAFT and REJECTED; an editor: ARCHIVED): shown as it is
function ReadOnlyArticle({ article }) {
  const { t } = useTranslation()
  return (
    <Card body>
      <h2 className="h3 mb-2">{article.title}</h2>
      <p className="text-muted small">
        {article.category.name}
        {article.tags.length > 0 && <> &middot; {t('news.editor.tagsLine', { tags: article.tags.map((tag) => tag.name).join(', ') })}</>}
      </p>
      {article.summary && <p className="lead">{article.summary}</p>}
      <SafeHtml html={article.content} />
    </Card>
  )
}

function ArticleForm({ area, initial, categories, tags }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const admin = area.admin
  const navigate = useNavigate()
  const { state: locationState } = useLocation()
  const [article, setArticle] = useState(initial) // null while writing a new article
  const [form, setForm] = useState(() => toForm(initial))
  const [saved, setSaved] = useState(() => JSON.stringify(toForm(initial)))
  const [errors, setErrors] = useState({}) // the checks of this page
  const [apiFields, setApiFields] = useState({}) // field errors the backend answered with
  const [apiError, setApiError] = useState(null)
  const [toast, setToast] = useState(() => (locationState?.message ? { variant: 'success', text: t(locationState.message) } : null))
  const [submitting, setSubmitting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [focusField, setFocusField] = useState(null)
  const [imageBusy, setImageBusy] = useState(false)
  const rootRef = useRef(null)
  const headerRef = useRef(null)

  const history = useNewsHistory(article)
  const { refresh: refreshReviewCount } = useReviewCount()
  const dirty = JSON.stringify(form) !== saved
  const { blocker, markClean } = useUnsavedChangesWarning(dirty)
  const readOnly = Boolean(article) && !article.editable
  const actions = article ? workflowActions(area.role, article.status) : []

  // after a workflow action (submit, publish, ...) the backend returns the whole article
  const workflow = useWorkflowAction((updated, action) => {
    setArticle(updated)
    setApiError(null)
    setToast({ variant: 'success', text: t(WORKFLOW_ACTIONS[action].doneKey) })
    refreshReviewCount() // submit, publish, reject or archive can change the number of pending articles
  })
  // after the comments switch of an editor / admin
  const handleCommentsChange = (updated, messageKey) => {
    setArticle(updated)
    setToast({ variant: 'success', text: t(messageKey) })
  }

  const change = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setApiFields((current) => ({ ...current, [field]: '' }))
  }
  const fieldErrors = { ...apiFields, ...errors }

  // the article's own category may have been deactivated since: keep it in the list so the form still shows it
  const options = [...categories]
  if (article && !options.some((category) => category.id === article.category.id)) {
    options.push({ ...article.category, name: `${article.category.name} ${t('news.list.inactive')}` })
  }

  // an author may delete an own DRAFT only; an admin any article; an editor none
  const canDelete = Boolean(article) && (admin || (!area.staff && article.status === 'DRAFT'))

  const revealFirst = (found) => {
    const name = FIELD_ORDER.find((field) => found[field])
    if (name) setFocusField({ name, nonce: Date.now() })
  }

  const handleSave = async (event) => {
    event?.preventDefault()
    if (readOnly || submitting) return
    const found = {
      title: rules.title(form.title),
      summary: rules.summary(form.summary),
      content: rules.content(form.content),
      categoryId: form.categoryId ? '' : t('news.editor.errors.chooseCategory'),
      tagIds: form.tagIds.length > 20 ? t('news.editor.errors.maxTags') : '',
    }
    setErrors(found)
    setApiFields({})
    setApiError(null)
    if (hasErrors(found)) {
      revealFirst(found)
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
        // for a saved article an editor/admin changes this with the Comments card: never overwrite it with an old value
        commentsEnabled: area.staff && article ? article.commentsEnabled : form.commentsEnabled,
      }
      if (article) {
        const updated = await newsService.updateNews(article.id, payload)
        setArticle(updated)
        setSaved(JSON.stringify(form))
        setToast({ variant: 'success', text: t(article.status === 'DRAFT' ? 'news.editor.messages.draftSaved' : 'news.editor.messages.changesSaved') })
      } else {
        const created = await newsService.createNews(payload)
        markClean() // the page changes to the saved article: no "unsaved changes" question
        navigate(area.editPath(created.id), { replace: true, state: { message: 'news.editor.messages.draftCreated' } })
      }
    } catch (error) {
      // field errors go under their fields; anything else stays in the alert at the top
      const details = Object.fromEntries(Object.entries(error?.details ?? {}).filter(([field]) => FIELD_ORDER.includes(field)))
      setApiFields(details)
      setApiError(Object.keys(details).length > 0 ? null : error)
      if (Object.keys(details).length > 0) revealFirst(details)
      else window.scrollTo({ top: 0, behavior: 'smooth' })
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

  // Ctrl/Cmd+S saves
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        if (dirty) handleSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  // the first field with an error scrolls into view and takes the focus
  useEffect(() => {
    if (!focusField) return
    const element = document.getElementById(FIELD_ID[focusField.name])
    if (!element) return
    element.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const target = focusField.name === 'content' ? element.querySelector('.ProseMirror') : element
    target?.focus?.({ preventScroll: true })
  }, [focusField])

  // the sticky header's height, so the editor toolbar can stick right under it (see _theme.scss)
  useEffect(() => {
    const header = headerRef.current
    if (!header || typeof ResizeObserver === 'undefined') return undefined
    const apply = () => rootRef.current?.style.setProperty('--editor-header-h', `${header.offsetHeight}px`)
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(header)
    return () => observer.disconnect()
  }, [])

  const setThumbnail = (thumbnail) => setArticle((current) => ({ ...current, thumbnail }))
  const setImages = (change) => setArticle((current) => ({ ...current, images: typeof change === 'function' ? change(current.images) : change }))
  const name = user?.fullName || user?.username || ''

  // An image pasted or dropped into the text is stored as an image of the article (the only way the backend takes a
  // file), so it also shows in the Images card and counts for the limit. Returns the address for the text, or null.
  const addContentImage = async (file) => {
    const fail = (text) => {
      setToast({ variant: 'danger', text })
      return null
    }
    if (!article) return fail(t('news.editor.imageSaveFirst'))
    const problem = rules.imageFile(file)
    if (problem) return fail(problem)
    if (article.images.length >= MAX_IMAGES_PER_NEWS) return fail(t('news.media.limitReached', { max: MAX_IMAGES_PER_NEWS }))
    setImageBusy(true)
    try {
      const added = await newsService.addNewsImage(article.id, file, null)
      setImages((current) => [...current, added])
      return mediaUrl(added.url)
    } catch (caught) {
      return fail(errorMessage(caught))
    } finally {
      setImageBusy(false)
    }
  }
  const previewArticle = {
    id: article?.id,
    title: form.title,
    summary: form.summary,
    content: form.content,
    thumbnail: article?.thumbnail ?? null,
    images: article?.images ?? [],
    tags: tags.filter((tag) => form.tagIds.includes(tag.id)),
    category: options.find((category) => String(category.id) === form.categoryId) ?? { name: '' },
    authorName: article?.authorName ?? name,
    publishedAt: article?.publishedAt ?? null,
  }
  const slot = (order, node) => <div style={{ order }}>{node}</div>

  return (
    <div ref={rootRef} className="editor-page">
      <ArticleEditorHeader
        innerRef={headerRef}
        area={area}
        article={article}
        creating={!article}
        readOnly={readOnly}
        dirty={dirty}
        saving={submitting}
        onSave={handleSave}
        onPreview={() => setPreviewing(true)}
        actions={actions}
        onAction={(key) => workflow.start(key, article)}
        canDelete={canDelete}
        onDelete={() => setConfirmDelete(true)}
      />
      <ArticleNotice area={area} article={article} readOnly={readOnly} />
      <ErrorAlert error={apiError} />

      <Form onSubmit={handleSave} noValidate>
        <div className="editor-layout">
          <div className="editor-col editor-col--main">
            {readOnly ? (
              slot(1, <ReadOnlyArticle article={article} />)
            ) : (
              <>
                {slot(1, <TitleField value={form.title} error={fieldErrors.title} onChange={(value) => change('title', value)} />)}
                {slot(2, <SummaryField value={form.summary} error={fieldErrors.summary} onChange={(value) => change('summary', value)} />)}
                {slot(3, <ContentField value={form.content} error={fieldErrors.content} busy={imageBusy} onChange={(html) => change('content', html)} onImage={addContentImage} />)}
              </>
            )}
            {slot(7, <ImagesCard newsId={article?.id} images={article?.images ?? []} editable={!readOnly} saved={Boolean(article)} onImagesChange={setImages} />)}
          </div>

          <div className="editor-col editor-col--side">
            {slot(4, <PublishingCard article={article} author={name} dirty={dirty} actions={actions} onAction={(key) => workflow.start(key, article)} />)}
            {!readOnly && slot(5, <OrganizeCard form={form} errors={fieldErrors} categories={options} tags={tags} onChange={change} />)}
            {slot(6, <ThumbnailCard newsId={article?.id} thumbnail={article?.thumbnail} editable={!readOnly} saved={Boolean(article)} onThumbnailChange={setThumbnail} />)}
            {/* an editor/admin switches the comments of a saved article at once; everybody else saves the switch with the article */}
            {article && area.staff
              ? slot(8, <CommentsToggleCard area={area} article={article} onChange={handleCommentsChange} />)
              : !readOnly && slot(8, <CommentsFormCard checked={form.commentsEnabled} onChange={(value) => change('commentsEnabled', value)} />)}
            {article && slot(9, <HistoryCard history={history} />)}
            {/* the activity log of this article (who edited, published, deleted ...): the admin only */}
            {article && area.admin && slot(10, <ActivityHistoryCard types={['NEWS']} id={article.id} refreshKey={article.updatedAt} />)}
          </div>
        </div>
      </Form>

      <ConfirmDialog show={blocker.state === 'blocked'} title={t('news.editor.leave.title')} confirmLabel={t('news.editor.leave.confirm')} confirmVariant="danger" onCancel={() => blocker.reset()} onConfirm={() => blocker.proceed()}>
        {t('news.editor.leave.body')}
      </ConfirmDialog>
      <WorkflowDialog
        key={`${workflow.pending?.action}-${workflow.pending?.article.id}`}
        action={workflow.pending?.action}
        article={workflow.pending?.article}
        busy={workflow.busy}
        error={workflow.error}
        onCancel={workflow.cancel}
        onConfirm={workflow.confirm}
      />
      <DeleteArticleDialog key={confirmDelete ? 'open' : 'closed'} article={confirmDelete ? article : null} admin={admin} busy={deleting} onCancel={() => setConfirmDelete(false)} onConfirm={handleDelete} />
      <ArticlePreviewModal show={previewing} article={previewArticle} onClose={() => setPreviewing(false)} />

      <ToastContainer position="bottom-end" className="p-3 editor-toasts" style={{ zIndex: 2000 }}>
        <Toast bg={toast?.variant ?? 'success'} show={Boolean(toast)} onClose={() => setToast(null)} delay={4000} autohide>
          <Toast.Body className="text-white d-flex justify-content-between gap-3">
            <span>{toast?.text}</span>
            <button type="button" className="btn-close btn-close-white" aria-label={t('common.actions.close')} onClick={() => setToast(null)} />
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  )
}

// Loads the article (when editing), the active categories and the tags; the form mounts when all are there.
export default function ArticleEditor({ area }) {
  const { t } = useTranslation()
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
        <Link to={area.listPath}>{t(area.backLabelKey)}</Link>
      </div>
    )
  }
  return <ArticleForm key={key} area={area} initial={data.article} categories={data.categories} tags={data.tags} />
}
