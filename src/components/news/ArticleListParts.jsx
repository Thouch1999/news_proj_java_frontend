import { useState } from 'react'
import { Badge, Button, Dropdown, Form, Nav, OverlayTrigger, Placeholder, Tooltip } from 'react-bootstrap'
import { BoxArrowUpRight, FileEarmarkText, Funnel, Image, Inbox, PencilSquare, ThreeDots } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Pagination from '../common/Pagination'
import UserAvatar from '../common/UserAvatar'
import { ARTICLE_PAGE_SIZES, NEWS_STATUS, workflowActions } from '../../constants/newsStatus'
import { newsPath } from '../../constants/routes'
import { useFormat } from '../../hooks/useFormat'
import { mediaUrl } from '../../utils/mediaUrl'

// The parts of the article list (admin "All articles", editor "All articles", author "My articles"). `area` comes from
// constants/articleAreas.js and decides which columns and actions a role gets.

// ---- status tabs ----

// Tabs that filter a list by status, each with its number when it is known.
//   tabs: [{ value, label, count? }]  (value '' is "All")   active: the value of the open tab   label: the aria-label
export function StatusTabs({ tabs, active, label, onChange }) {
  const { formatNumber } = useFormat()

  return (
    <Nav variant="underline" className="article-tabs mb-3" role="tablist" aria-label={label} activeKey={active} onSelect={(value) => onChange(value ?? '')}>
      {tabs.map((tab) => (
        <Nav.Item key={tab.value || 'all'} role="presentation">
          <Nav.Link as="button" type="button" eventKey={tab.value} role="tab" aria-selected={active === tab.value}>
            {tab.label}
            {tab.count !== undefined && (
              <Badge pill bg="" className="article-tab-count">
                {formatNumber(tab.count)}
              </Badge>
            )}
          </Nav.Link>
        </Nav.Item>
      ))}
    </Nav>
  )
}

// All | Draft | Pending | ... with the number of articles of each status (the counts come from the dashboard reports)
export function ArticleStatusTabs({ active, counts, onChange }) {
  const { t } = useTranslation()
  const tabs = [{ value: '', label: t('news.list.tabs.all'), count: counts?.totalNews }].concat(
    Object.values(NEWS_STATUS).map((status) => ({ value: status.value, label: t(`news.list.tabs.${status.value}`), count: counts?.newsByStatus?.[status.value] })),
  )
  return <StatusTabs tabs={tabs} active={active} label={t('news.list.tabs.label')} onChange={onChange} />
}

// ---- toolbar (editor and admin) ----

// The author and category selects and "Clear filters", in one row. Below 768px the selects are behind a "Filters" button.
export function ArticleToolbar({ authorId, categoryId, choices, onChange, onClear }) {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  const [open, setOpen] = useState(false)
  const active = [authorId, categoryId].filter(Boolean).length

  return (
    <div className="article-toolbar d-flex flex-wrap align-items-center gap-2 p-3">
      <Button variant="outline-secondary" size="sm" className="d-md-none" aria-expanded={open} aria-controls="article-filters" onClick={() => setOpen((value) => !value)}>
        <Funnel className="me-1" aria-hidden="true" />
        {t('news.list.toolbar.filters')}
        {active > 0 && (
          <Badge pill bg="primary" className="ms-2">
            {formatNumber(active)}
          </Badge>
        )}
      </Button>
      <div id="article-filters" className={`${open ? 'd-flex' : 'd-none'} d-md-flex flex-column flex-md-row flex-grow-1 flex-md-grow-0 align-items-md-center gap-2`}>
        <Form.Select size="sm" className="w-auto-md" aria-label={t('news.list.filters.author')} value={authorId} onChange={(event) => onChange({ authorId: event.target.value })}>
          <option value="">{t('news.list.filters.allAuthors')}</option>
          {choices.authors.map((author) => (
            <option key={author.id} value={author.id}>
              {author.name ? (author.role ? `${author.name} (${t(`common.roles.${author.role}`)})` : author.name) : t('news.list.userFallback', { id: author.id })}
            </option>
          ))}
        </Form.Select>
        <Form.Select size="sm" className="w-auto-md" aria-label={t('news.list.filters.category')} value={categoryId} onChange={(event) => onChange({ categoryId: event.target.value })}>
          <option value="">{t('news.list.filters.allCategories')}</option>
          {choices.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
              {category.active ? '' : ` ${t('news.list.inactive')}`}
            </option>
          ))}
        </Form.Select>
      </div>
      {active > 0 && (
        <Button variant="link" size="sm" className="p-0 ms-md-1" onClick={onClear}>
          {t('news.list.toolbar.clear')}
        </Button>
      )}
    </div>
  )
}

// ---- cells ----

export function ArticleThumb({ src }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <span className="article-thumb article-thumb--empty" aria-hidden="true">
        <Image />
      </span>
    )
  }
  return <img src={mediaUrl(src)} alt="" className="article-thumb" loading="lazy" onError={() => setFailed(true)} />
}

// thumbnail, the title (a link to the editor, bold) and the category under it
export function ArticleTitleCell({ article, area }) {
  const { t } = useTranslation()
  return (
    <div className="d-flex align-items-center gap-3">
      <ArticleThumb src={article.thumbnail} />
      <div className="min-w-0">
        <Link to={area.editPath(article.id)} className="article-title news-title">
          {article.title}
        </Link>
        <div className="text-muted small">{article.categoryName}</div>
        {article.status === 'REJECTED' && article.rejectionReason && (
          <div className="text-danger small text-truncate article-reason" title={article.rejectionReason}>
            {t('news.list.rejected', { reason: article.rejectionReason })}
          </div>
        )}
      </div>
    </div>
  )
}

// The list gives the name of the author only, so the avatar is the first letter of the name
export function AuthorCell({ name }) {
  return (
    <span className="d-inline-flex align-items-center gap-2">
      <UserAvatar name={name ?? ''} fallback="initial" className="article-avatar" />
      <span>{name}</span>
    </span>
  )
}

// "2 hours ago", with the full date in a tooltip
export function UpdatedCell({ value }) {
  const { formatAgo, formatFullDate } = useFormat()
  return (
    <OverlayTrigger placement="top" overlay={<Tooltip id={`updated-${value}`}>{formatFullDate(value)}</Tooltip>}>
      <time dateTime={value} tabIndex={0} className="text-nowrap">
        {formatAgo(value)}
      </time>
    </OverlayTrigger>
  )
}

// ---- actions ----

// View on the site (a PUBLISHED article only) and Edit as icon buttons, then a "..." menu with the other actions that
// are valid for the status and the role: Review (a PENDING article, staff), Publish now (admin, DRAFT), Archive,
// Restore (admin) and, last and in red, Delete. Reviewing happens on the review page.
export function ArticleActions({ article, area, canDelete, onWorkflow, onDelete }) {
  const { t } = useTranslation()
  const workflow = workflowActions(area.role, article.status).filter((action) => ['archive', 'restore'].includes(action.key) || (action.key === 'publish' && article.status === 'DRAFT'))
  const review = area.staff && article.status === 'PENDING' && area.reviewPath
  const hasMenu = Boolean(review) || workflow.length > 0 || canDelete
  const editLabel = article.editable ? t('common.actions.edit') : t('common.actions.view')

  return (
    <div className="d-inline-flex align-items-center gap-1">
      {article.status === 'PUBLISHED' && (
        <Button as={Link} to={newsPath(article.slug)} target="_blank" rel="noopener noreferrer" size="sm" variant="light" className="icon-btn" aria-label={t('news.list.actions.viewOnSite')} title={t('news.list.actions.viewOnSite')}>
          <BoxArrowUpRight aria-hidden="true" />
        </Button>
      )}
      <Button as={Link} to={area.editPath(article.id)} size="sm" variant="light" className="icon-btn" aria-label={editLabel} title={editLabel}>
        {article.editable ? <PencilSquare aria-hidden="true" /> : <FileEarmarkText aria-hidden="true" />}
      </Button>
      {hasMenu && (
        <Dropdown align="end">
          <Dropdown.Toggle size="sm" variant="light" className="icon-btn article-more" aria-label={t('news.list.actions.more')} title={t('news.list.actions.more')}>
            <ThreeDots aria-hidden="true" />
          </Dropdown.Toggle>
          <Dropdown.Menu popperConfig={{ strategy: 'fixed' }}>
            {review && (
              <Dropdown.Item as={Link} to={area.reviewPath(article.id)}>
                {t('common.actions.review')}
              </Dropdown.Item>
            )}
            {workflow.map((action) => (
              <Dropdown.Item key={action.key} onClick={() => onWorkflow(action.key, article)}>
                {t(action.labelKey)}
              </Dropdown.Item>
            ))}
            {canDelete && (
              <>
                {(review || workflow.length > 0) && <Dropdown.Divider />}
                <Dropdown.Item className="text-danger" onClick={() => onDelete(article)}>
                  {t('common.actions.delete')}
                </Dropdown.Item>
              </>
            )}
          </Dropdown.Menu>
        </Dropdown>
      )}
    </div>
  )
}

// ---- states ----

// Grey rows (a table on wide screens, cards on mobile) while the page loads
export function ArticleSkeleton({ staff }) {
  const { t } = useTranslation()
  const rows = [0, 1, 2, 3, 4]
  return (
    <div role="status">
      <span className="visually-hidden">{t('common.loading')}</span>
      <Placeholder as="div" animation="glow" aria-hidden="true">
        {rows.map((row) => (
          <div key={row} className="article-skeleton-row d-flex align-items-center gap-3 px-3 py-3">
            <Placeholder className="article-thumb" />
            <div className="flex-grow-1">
              <Placeholder xs={8} md={5} className="d-block mb-1" />
              <Placeholder xs={4} md={2} size="sm" className="d-block" />
            </div>
            {staff && <Placeholder xs={2} className="d-none d-md-block" />}
            <Placeholder xs={2} className="d-none d-md-block" />
            <Placeholder xs={1} className="d-none d-md-block" />
          </div>
        ))}
      </Placeholder>
    </div>
  )
}

// No article at all ("No articles yet" + Create article) or none for the filters ("No articles match these filters")
export function ArticleEmpty({ filtered, area, onClear }) {
  const { t } = useTranslation()
  return (
    <div className="d-flex flex-column align-items-center text-center text-muted py-5 px-3">
      <Inbox size={36} aria-hidden="true" className="mb-2" />
      <p className="mb-3">{filtered ? t('news.list.empty.filtered') : t('news.list.empty.none')}</p>
      {filtered ? (
        <Button variant="outline-primary" size="sm" onClick={onClear}>
          {t('news.list.toolbar.clear')}
        </Button>
      ) : (
        area.newPath && (
          <Button as={Link} to={area.newPath} size="sm">
            {t('news.list.create')}
          </Button>
        )
      )}
    </div>
  )
}

// ---- footer: "Showing 1-10 of 25", rows per page, pagination ----

export function ArticleFooter({ result, size, sizes = ARTICLE_PAGE_SIZES, onPage, onSize }) {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  const from = result.totalElements === 0 ? 0 : (result.page - 1) * size + 1
  const to = Math.min(result.page * size, result.totalElements)

  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 px-3 py-3 border-top">
      <span className="text-muted small">{t('news.list.showing', { from: formatNumber(from), to: formatNumber(to), total: formatNumber(result.totalElements) })}</span>
      <div className="d-flex flex-wrap align-items-center gap-3">
        <Form.Select size="sm" className="w-auto" aria-label={t('news.list.pageSize')} value={size} onChange={(event) => onSize(Number(event.target.value))}>
          {sizes.map((option) => (
            <option key={option} value={option}>
              {t('news.list.perPage', { count: option })}
            </option>
          ))}
        </Form.Select>
        <Pagination page={result.page} totalPages={result.totalPages} onChange={onPage} />
      </div>
    </div>
  )
}
