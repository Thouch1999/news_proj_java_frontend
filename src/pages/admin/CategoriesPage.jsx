import { useEffect, useState } from 'react'
import { Button, Card, Dropdown, Form, OverlayTrigger, Spinner, Toast, ToastContainer, Tooltip, Table } from 'react-bootstrap'
import { Folder, PencilSquare, ThreeDots } from 'react-bootstrap-icons'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { EmptyState, ErrorState, RowsSkeleton } from '../../components/common/ListStates'
import SearchBox from '../../components/common/SearchBox'
import TaxonomyFormModal from '../../components/form/TaxonomyFormModal'
import { StatusTabs } from '../../components/news/ArticleListParts'
import { categoryPath, ROUTES } from '../../constants/routes'
import { useFormat } from '../../hooks/useFormat'
import * as categoryService from '../../services/categoryService'
import { errorMessage } from '../../utils/errorMessage'

const STATUSES = ['', 'active', 'inactive']

// The articles of one category in "All articles"
const articlesOf = (category) => `${ROUTES.ADMIN_NEWS}?categoryId=${category.id}`

// a stable object (not a new one on every render), so the menu is positioned on the first click
const MENU_POPPER = { strategy: 'fixed' }

// "Shown on website": a switch. It changes only when the backend has answered (a spinner while it saves), so a failure
// leaves it where it was. Hiding asks first (see the page).
function ShownSwitch({ category, busy, onToggle }) {
  const { t } = useTranslation()
  return (
    <span className="d-inline-flex align-items-center gap-2">
      <Form.Check type="switch" id={`shown-${category.id}`} className="mb-0" checked={category.active} disabled={busy} aria-label={t('dashboard.categories.shownOnWebsite', { name: category.name })} onChange={() => onToggle(category)} />
      {busy && <Spinner size="sm" animation="border" />}
    </span>
  )
}

// Edit (an icon button) and the "..." menu: View on site (an active category), View articles, Delete (not while the
// category has news: it can only be turned off)
function CategoryActions({ category, onEdit, onDelete }) {
  const { t } = useTranslation()
  const hasNews = category.newsCount > 0
  return (
    <div className="d-inline-flex align-items-center gap-1">
      <Button size="sm" variant="light" className="icon-btn" aria-label={t('common.actions.edit')} title={t('common.actions.edit')} onClick={() => onEdit(category)}>
        <PencilSquare aria-hidden="true" />
      </Button>
      <Dropdown align="end">
        <Dropdown.Toggle size="sm" variant="light" className="icon-btn article-more" aria-label={t('news.list.actions.more')} title={t('news.list.actions.more')}>
          <ThreeDots aria-hidden="true" />
        </Dropdown.Toggle>
        <Dropdown.Menu popperConfig={MENU_POPPER}>
          {category.active && (
            <Dropdown.Item as={Link} to={categoryPath(category.slug)} target="_blank" rel="noopener noreferrer">
              {t('news.list.actions.viewOnSite')}
            </Dropdown.Item>
          )}
          <Dropdown.Item as={Link} to={articlesOf(category)}>
            {t('dashboard.categories.viewArticles')}
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item className={hasNews ? undefined : 'text-danger'} disabled={hasNews} onClick={() => onDelete(category)}>
            {t('common.actions.delete')}
          </Dropdown.Item>
          {hasNews && <Dropdown.ItemText className="small text-muted category-delete-reason">{t('dashboard.categories.deleteBlocked', { count: category.newsCount })}</Dropdown.ItemText>}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  )
}

function Description({ text }) {
  const { t } = useTranslation()
  if (!text) return <span className="text-muted small">{t('dashboard.categories.noDescription')}</span>
  return (
    <OverlayTrigger placement="top" overlay={<Tooltip id={`description-${text.length}-${text.slice(0, 8)}`}>{text}</Tooltip>}>
      <span className="taxonomy-description d-inline-block text-truncate align-bottom" tabIndex={0}>
        {text}
      </span>
    </OverlayTrigger>
  )
}

// The name, with the public path under it
function NameCell({ category }) {
  return (
    <div className="taxonomy-name min-w-0">
      <div className="news-title">{category.name}</div>
      <div className="small text-muted">{categoryPath(category.slug)}</div>
    </div>
  )
}

function NewsCount({ category }) {
  const { formatNumber } = useFormat()
  return category.newsCount > 0 ? <Link to={articlesOf(category)}>{formatNumber(category.newsCount)}</Link> : <span className="text-muted">{formatNumber(0)}</span>
}

export default function CategoriesPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const status = STATUSES.includes(searchParams.get('status') ?? '') ? (searchParams.get('status') ?? '') : ''
  const query = searchParams.get('q') ?? ''

  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState({ data: null, error: null })
  const [form, setForm] = useState(null) // { category } while the create / edit modal is open
  const [confirm, setConfirm] = useState(null) // { type: 'hide' | 'delete', category }
  const [busyId, setBusyId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  // every category comes at once; after a change the rows are updated here and the list is loaded again quietly
  useEffect(() => {
    let current = true
    categoryService
      .listCategoriesForAdmin()
      .then((data) => current && setState({ data: data ?? [], error: null }))
      .catch((error) => current && setState((previous) => ({ data: previous.data, error: previous.data ? null : error })))
    return () => {
      current = false
    }
  }, [reloadKey])
  const reload = () => setReloadKey((key) => key + 1)
  const categories = state.data
  const patch = (change) => setState((previous) => ({ ...previous, data: change(previous.data ?? []) }))
  const replace = (saved) => patch((list) => list.map((category) => (category.id === saved.id ? { ...category, ...saved } : category)))

  const setParams = (changes) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([name, value]) => (value ? next.set(name, value) : next.delete(name)))
    setSearchParams(next, { replace: true })
  }

  const needle = query.trim().toLowerCase()
  const shown = (categories ?? []).filter((category) => (!status || category.active === (status === 'active')) && (!needle || category.name.toLowerCase().includes(needle) || category.slug.includes(needle)))
  const counts = { '': categories?.length, active: categories?.filter((category) => category.active).length, inactive: categories?.filter((category) => !category.active).length }
  const tabs = ['', 'active', 'inactive'].map((value) => ({ value, label: t(`dashboard.categories.tabs.${value || 'all'}`), count: categories ? counts[value] : undefined }))

  const toggle = async (category) => {
    setBusyId(category.id)
    try {
      replace(await (category.active ? categoryService.deactivateCategory(category.id) : categoryService.activateCategory(category.id)))
      setToast({ variant: 'success', text: t(category.active ? 'dashboard.categories.hidden' : 'dashboard.categories.shown') })
    } catch (error) {
      setToast({ variant: 'danger', text: errorMessage(error) })
    } finally {
      setBusyId(null)
      setConfirm(null)
    }
  }
  const requestToggle = (category) => (category.active ? setConfirm({ type: 'hide', category }) : toggle(category))

  const remove = async () => {
    const { category } = confirm
    setDeleting(true)
    try {
      await categoryService.deleteCategory(category.id)
      patch((list) => list.filter((item) => item.id !== category.id))
      setToast({ variant: 'success', text: t('dashboard.categories.deleted') })
    } catch (error) {
      setToast({ variant: 'danger', text: errorMessage(error) })
      reload()
    } finally {
      setDeleting(false)
      setConfirm(null)
    }
  }

  // a new category is active; a switch that is off hides it right after it was created
  const submit = (category) => async (data, { active }) => {
    if (category) return categoryService.updateCategory(category.id, data)
    const created = await categoryService.createCategory(data)
    if (active) return created
    try {
      return await categoryService.deactivateCategory(created.id)
    } catch {
      return { ...created, notHidden: true }
    }
  }
  const saved = (category, wasEditing) => {
    setForm(null)
    if (wasEditing) replace(category)
    else patch((list) => [...list, category])
    setToast(
      category.notHidden
        ? { variant: 'danger', text: t('dashboard.categories.createdNotHidden') }
        : { variant: 'success', text: t(wasEditing ? 'dashboard.categories.updated' : 'dashboard.categories.created') },
    )
    reload()
  }

  const rows = shown.length > 0
  const noMatch = categories && categories.length > 0 && shown.length === 0

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h1 className="h4 mb-1">{t('dashboard.categories.title')}</h1>
          <p className="text-muted small mb-0">{t('dashboard.categories.intro')}</p>
        </div>
        <Button onClick={() => setForm({ category: null })}>{t('dashboard.categories.create')}</Button>
      </div>

      <StatusTabs tabs={tabs} active={status} label={t('dashboard.categories.status')} onChange={(value) => setParams({ status: value })} />

      <Card className="article-card">
        <div className="article-toolbar p-3">
          <SearchBox value={query} onChange={(value) => setParams({ q: value })} label={t('dashboard.categories.search')} placeholder={t('dashboard.categories.search')} />
        </div>

        {!categories && !state.error && <RowsSkeleton />}
        {!categories && state.error && <ErrorState error={state.error} onRetry={reload} />}
        {categories && categories.length === 0 && (
          <EmptyState icon={Folder} text={t('dashboard.categories.empty.none')}>
            <Button size="sm" onClick={() => setForm({ category: null })}>
              {t('dashboard.categories.create')}
            </Button>
          </EmptyState>
        )}
        {noMatch && (
          <EmptyState icon={Folder} text={t('dashboard.categories.empty.search')}>
            <Button size="sm" variant="outline-primary" onClick={() => setSearchParams({}, { replace: true })}>
              {t('news.list.toolbar.clear')}
            </Button>
          </EmptyState>
        )}

        {rows && (
          <>
            <div className="article-table-wrap d-none d-md-block">
              <Table hover className="article-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>{t('dashboard.categories.name')}</th>
                    <th>{t('dashboard.categories.description')}</th>
                    <th className="text-end">{t('dashboard.categories.news')}</th>
                    <th>{t('dashboard.categories.shownColumn')}</th>
                    <th className="text-end">{t('dashboard.categories.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((category) => (
                    <tr key={category.id} className={category.active ? undefined : 'is-inactive'}>
                      <td>
                        <NameCell category={category} />
                      </td>
                      <td className="taxonomy-description-cell">
                        <Description text={category.description} />
                      </td>
                      <td className="text-end">
                        <NewsCount category={category} />
                      </td>
                      <td>
                        <ShownSwitch category={category} busy={busyId === category.id} onToggle={requestToggle} />
                      </td>
                      <td className="text-end text-nowrap">
                        <CategoryActions category={category} onEdit={(item) => setForm({ category: item })} onDelete={(item) => setConfirm({ type: 'delete', category: item })} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <ul className="article-cards list-unstyled mb-0 d-md-none">
              {shown.map((category) => (
                <li key={category.id} className={category.active ? undefined : 'is-inactive'}>
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <NameCell category={category} />
                    <CategoryActions category={category} onEdit={(item) => setForm({ category: item })} onDelete={(item) => setConfirm({ type: 'delete', category: item })} />
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-2 small">
                    <span className="text-muted">
                      {t('dashboard.categories.news')}: <NewsCount category={category} />
                    </span>
                    <ShownSwitch category={category} busy={busyId === category.id} onToggle={requestToggle} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {form && <TaxonomyFormModal kind="categories" item={form.category} pathPrefix="/category/" withDescription withActive onSubmit={submit(form.category)} onSaved={saved} onClose={() => setForm(null)} />}

      <ConfirmDialog
        show={confirm?.type === 'hide'}
        title={t('dashboard.categories.hideTitle')}
        confirmLabel={t('dashboard.categories.hideConfirm')}
        confirmVariant="warning"
        busy={busyId !== null}
        onCancel={() => setConfirm(null)}
        onConfirm={() => toggle(confirm.category)}
      >
        {confirm?.type === 'hide' && t('dashboard.categories.hideText', { name: confirm.category.name, count: confirm.category.newsCount })}
      </ConfirmDialog>

      <ConfirmDialog show={confirm?.type === 'delete'} title={t('dashboard.categories.deleteTitle')} confirmLabel={t('common.actions.delete')} confirmVariant="danger" busy={deleting} onCancel={() => setConfirm(null)} onConfirm={remove}>
        {confirm?.type === 'delete' && <Trans i18nKey="dashboard.categories.deleteText" values={{ name: confirm.category.name }} components={{ 1: <strong /> }} />}
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
