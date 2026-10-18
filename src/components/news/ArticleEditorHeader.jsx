import { Alert, Breadcrumb, Button, Dropdown, Spinner } from 'react-bootstrap'
import { BoxArrowUpRight, CheckCircle, Eye, ExclamationTriangle, HourglassSplit, InfoCircle, Lock, PencilSquare, ThreeDots } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { NEWS_STATUS } from '../../constants/newsStatus'
import { newsPath } from '../../constants/routes'
import StatusBadge from './StatusBadge'

// The sticky top of the article page: breadcrumb, title with the status, the save state and the buttons (Preview, View
// on site, Save changes and a "..." menu with the workflow actions and Delete). Below 768px the buttons move to a bar at
// the bottom of the screen.

function Buttons({ area, article, readOnly, dirty, saving, creating, onSave, onPreview, actions, onAction, canDelete, onDelete, bottom }) {
  const { t } = useTranslation()
  const label = (key) => <span className={bottom ? 'visually-hidden' : 'd-none d-lg-inline ms-1'}>{t(key)}</span>
  const hasMenu = actions.length > 0 || canDelete

  return (
    <>
      {!readOnly && (
        <Button type="button" variant="outline-secondary" size="sm" onClick={onPreview} aria-label={t('news.editor.preview')} title={t('news.editor.preview')}>
          <Eye aria-hidden="true" />
          {label('news.editor.preview')}
        </Button>
      )}
      {article?.status === 'PUBLISHED' && (
        <Button as={Link} to={newsPath(article.slug)} target="_blank" rel="noopener noreferrer" variant="outline-secondary" size="sm" aria-label={t('news.list.actions.viewOnSite')} title={t('news.list.actions.viewOnSite')}>
          <BoxArrowUpRight aria-hidden="true" />
          {label('news.list.actions.viewOnSite')}
        </Button>
      )}
      {!readOnly && (
        <Button type="button" size="sm" disabled={!dirty || saving} onClick={onSave}>
          {saving && <Spinner size="sm" animation="border" className="me-1" />}
          {saving ? t('common.actions.saving') : creating || article?.status === 'DRAFT' ? t('news.editor.saveDraft') : t('news.editor.saveChanges')}
        </Button>
      )}
      {hasMenu && (
        <Dropdown align="end" drop={bottom ? 'up' : 'down'}>
          <Dropdown.Toggle size="sm" variant="outline-secondary" className="article-more" aria-label={t('news.list.actions.more')} title={t('news.list.actions.more')}>
            <ThreeDots aria-hidden="true" />
          </Dropdown.Toggle>
          <Dropdown.Menu popperConfig={{ strategy: 'fixed' }}>
            {actions.map((action) => (
              <Dropdown.Item key={action.key} disabled={dirty} onClick={() => onAction(action.key)}>
                {t(action.labelKey)}
              </Dropdown.Item>
            ))}
            {dirty && actions.length > 0 && <Dropdown.ItemText className="small text-muted">{t('news.workflow.saveFirst')}</Dropdown.ItemText>}
            {canDelete && (
              <>
                {actions.length > 0 && <Dropdown.Divider />}
                <Dropdown.Item className="text-danger" onClick={onDelete}>
                  {area.admin ? t('news.editor.deleteArticle') : t('news.editor.deleteDraft')}
                </Dropdown.Item>
              </>
            )}
          </Dropdown.Menu>
        </Dropdown>
      )}
    </>
  )
}

export default function ArticleEditorHeader({ innerRef, area, article, creating, readOnly, dirty, ...rest }) {
  const { t } = useTranslation()
  const title = creating ? t('news.list.create') : readOnly ? t('news.editor.viewTitle') : t('news.editor.editTitle')
  const buttons = { area, article, creating, readOnly, dirty, ...rest }

  return (
    <>
      <div className="editor-header" ref={innerRef}>
        <Breadcrumb listProps={{ className: 'mb-1 small' }}>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: area.listPath }}>
            {t(area.titleKey)}
          </Breadcrumb.Item>
          <Breadcrumb.Item active>{title}</Breadcrumb.Item>
        </Breadcrumb>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="d-flex flex-wrap align-items-center gap-2 min-w-0">
            <h1 className="h4 mb-0">{title}</h1>
            {article && <StatusBadge status={article.status} />}
            {!readOnly && (dirty || !creating) && (
              <span className={`save-state small${dirty ? ' save-state--dirty' : ''}`} role="status">
                {dirty && <span className="save-state__dot" aria-hidden="true" />}
                {dirty ? t('news.editor.unsaved') : t('news.editor.allSaved')}
              </span>
            )}
          </div>
          <div className="d-none d-md-flex align-items-center gap-2">
            <Buttons {...buttons} />
          </div>
        </div>
      </div>
      <div className="editor-bottom-bar d-md-none">
        <Buttons {...buttons} bottom />
      </div>
    </>
  )
}

function statusName(status, t) {
  const item = NEWS_STATUS[status]
  return item ? t(item.labelKey).toLowerCase() : status
}

// A compact line under the header that says what the status means for this article (a rejected article shows the
// reason). `locked` is a read-only article: the text says why it cannot be edited.
export function ArticleNotice({ area, article, readOnly }) {
  const { t } = useTranslation()
  if (!article) return null

  let icon = InfoCircle
  let variant = 'secondary'
  let body
  if (readOnly) {
    icon = Lock
    body = area.staff ? t('news.editor.locked.staff', { status: statusName(article.status, t) }) : t('news.editor.locked.author', { status: statusName(article.status, t) })
  } else if (article.status === 'REJECTED') {
    icon = ExclamationTriangle
    variant = 'danger'
    const hint = area.admin ? t('news.editor.rejection.hintAdmin') : area.staff ? t('news.editor.rejection.hintEditor') : t('news.editor.rejection.hintAuthor')
    body = (
      <>
        <strong>{t('news.editor.rejection.title')}:</strong> {article.rejectionReason || t('news.editor.rejection.noReason')}
        <div className="small mt-1">{hint}</div>
      </>
    )
  } else if (article.status === 'PUBLISHED') {
    icon = CheckCircle
    variant = 'info'
    body = t('news.editor.notice.PUBLISHED')
  } else if (article.status === 'PENDING') {
    icon = HourglassSplit
    variant = 'warning'
    body = t('news.editor.notice.PENDING')
  } else if (article.status === 'DRAFT') {
    icon = PencilSquare
    body = t('news.editor.notice.DRAFT')
  } else {
    body = t('news.editor.notice.ARCHIVED')
  }
  const Icon = icon

  return (
    <Alert variant={variant} className="editor-notice d-flex align-items-start gap-2 py-2 mb-3">
      <Icon aria-hidden="true" className="flex-shrink-0 mt-1" />
      <div>{body}</div>
    </Alert>
  )
}
