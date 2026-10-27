import { Button, Card, Form, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { Clock } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import TagPicker from '../form/TagPicker'
import { useFormat } from '../../hooks/useFormat'
import { useNow } from '../../hooks/useNow'
import ArticleHistory from './ArticleHistory'
import { AuthorCell } from './ArticleListParts'
import PublishSplitButton from './PublishSplitButton'
import StatusBadge from './StatusBadge'

// The cards of the side column of the article page: Publishing and Organize here, the others (thumbnail, comments,
// history) are ArticleMedia.jsx, CommentsToggleCard.jsx and HistoryCard below.

// A date as "Oct 17, 2026, 15:29" with "2 hours ago" in a tooltip
function DateValue({ value }) {
  const { formatFullDate, formatAgo } = useFormat()
  if (!value) return <span className="text-muted">&ndash;</span>
  return (
    <OverlayTrigger placement="top" overlay={<Tooltip id={`date-${value}`}>{formatAgo(value)}</Tooltip>}>
      <time dateTime={value} tabIndex={0}>
        {formatFullDate(value)}
      </time>
    </OverlayTrigger>
  )
}

function Row({ label, children }) {
  return (
    <div className="d-flex justify-content-between align-items-center gap-3 py-2 border-bottom">
      <dt className="fw-normal text-muted small mb-0">{label}</dt>
      <dd className="mb-0 text-end small">{children}</dd>
    </div>
  )
}

// Status, author, the dates and the main workflow button of the status (Submit for review, Publish, Archive, ...).
// `author` is the name to show for an article that is not saved yet (the logged-in user).
export function PublishingCard({ article, author, dirty, actions, onAction }) {
  const { t } = useTranslation()
  const { formatSchedule, formatUntil } = useFormat()
  const now = useNow()
  const scheduled = article?.status === 'SCHEDULED'
  // a PENDING (or admin DRAFT) article: the main action, and "Schedule…" in the same button when both are there
  const action = scheduled ? null : actions[0]
  const canSchedule = !scheduled && actions.some((item) => item.key === 'schedule')
  return (
    <Card>
      <Card.Header className="bg-surface">
        <h2 className="h6 mb-0">{t('news.editor.publishing.title')}</h2>
      </Card.Header>
      <Card.Body>
        <dl className="mb-3">
          <Row label={t('news.editor.publishing.status')}>
            <StatusBadge status={article?.status ?? 'DRAFT'} />
          </Row>
          <Row label={t('news.editor.publishing.author')}>
            <AuthorCell name={article?.authorName ?? author} />
          </Row>
          <Row label={t('news.editor.publishing.created')}>{article ? <DateValue value={article.createdAt} /> : <span className="text-muted">{t('news.editor.publishing.notSaved')}</span>}</Row>
          <Row label={t('news.editor.publishing.updated')}>{article ? <DateValue value={article.updatedAt} /> : <span className="text-muted">&ndash;</span>}</Row>
          {scheduled && article.scheduledAt ? (
            <>
              <Row label={t('news.editor.publishing.goesLive')}>
                <span className="d-inline-flex align-items-center gap-1 fw-semibold">
                  <Clock aria-hidden="true" />
                  <time dateTime={article.scheduledAt}>{formatSchedule(article.scheduledAt)}</time>
                </span>
                <div className="text-muted">{t('news.editor.publishing.goesLiveIn', { relative: formatUntil(article.scheduledAt, now) })}</div>
              </Row>
              {article.scheduledByName && <Row label={t('news.editor.publishing.scheduledBy')}>{article.scheduledByName}</Row>}
            </>
          ) : (
            <Row label={t('news.editor.publishing.published')}>{article?.publishedAt ? <DateValue value={article.publishedAt} /> : <span className="text-muted">{t('news.editor.publishing.notPublished')}</span>}</Row>
          )}
        </dl>
        {scheduled && (
          <div className="d-flex flex-wrap gap-2">
            {actions.map((item) => (
              <Button key={item.key} variant={item.key === 'publish' ? 'primary' : item.variant} size="sm" disabled={dirty} onClick={() => onAction(item.key)}>
                {t(item.labelKey)}
              </Button>
            ))}
          </div>
        )}
        {action && canSchedule && <PublishSplitButton block disabled={dirty} onPublish={() => onAction(action.key)} onSchedule={() => onAction('schedule')} />}
        {action && !canSchedule && (
          <Button variant={action.variant} className="w-100" disabled={dirty} onClick={() => onAction(action.key)}>
            {t(action.labelKey)}
          </Button>
        )}
        {dirty && (scheduled || action) && <p className="text-warning small mt-2 mb-0">{t('news.workflow.saveFirst')}</p>}
      </Card.Body>
    </Card>
  )
}

// Category select and tags (searchable chips)
export function OrganizeCard({ form, errors, categories, tags, onChange }) {
  const { t } = useTranslation()
  return (
    <Card className="editor-field">
      <Card.Header className="bg-surface">
        <h2 className="h6 mb-0">{t('news.editor.organize.title')}</h2>
      </Card.Header>
      <Card.Body>
        <Form.Group className="mb-3" controlId="field-category">
          <Form.Label>{t('news.editor.fields.category')}</Form.Label>
          <Form.Select value={form.categoryId} isInvalid={Boolean(errors.categoryId)} onChange={(event) => onChange('categoryId', event.target.value)}>
            <option value="">{t('news.editor.errors.chooseCategory')}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Form.Select>
          <Form.Control.Feedback type="invalid">{errors.categoryId}</Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="field-tags">
          <Form.Label>{t('news.editor.fields.tags')}</Form.Label>
          <TagPicker id="field-tags" tags={tags} value={form.tagIds} invalid={Boolean(errors.tagIds)} onChange={(ids) => onChange('tagIds', ids)} />
          {errors.tagIds && <div className="text-danger small mt-1">{errors.tagIds}</div>}
        </Form.Group>
      </Card.Body>
    </Card>
  )
}

// The comments switch of an article that is being created or edited by its author (it is saved with the article).
// An editor or admin switches a saved article's comments in CommentsToggleCard, which applies at once.
export function CommentsFormCard({ checked, onChange }) {
  const { t } = useTranslation()
  return (
    <Card>
      <Card.Header className="bg-surface">
        <h2 className="h6 mb-0">{t('news.comments.toggle.title')}</h2>
      </Card.Header>
      <Card.Body>
        <Form.Check id="comments" type="switch" label={checked ? t('news.comments.toggle.enabled') : t('news.comments.toggle.disabled')} checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <p className="text-muted small mt-2 mb-0">{t('news.editor.commentsHelp')}</p>
      </Card.Body>
    </Card>
  )
}

// The status history, newest first, three rows and a "Show all" button
export function HistoryCard({ history }) {
  const { t } = useTranslation()
  return (
    <Card>
      <Card.Header className="bg-surface">
        <h2 className="h6 mb-0">{t('news.workflow.history')}</h2>
      </Card.Header>
      <Card.Body>
        <ArticleHistory state={history} newestFirst collapseAfter={3} />
      </Card.Body>
    </Card>
  )
}
