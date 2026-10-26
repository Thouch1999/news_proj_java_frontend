import { useEffect, useState } from 'react'
import { Button, Card, Dropdown, Table, Toast, ToastContainer } from 'react-bootstrap'
import { PencilSquare, Tag, ThreeDots } from 'react-bootstrap-icons'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { EmptyState, ErrorState, RowsSkeleton } from '../../components/common/ListStates'
import SearchBox from '../../components/common/SearchBox'
import TaxonomyFormModal from '../../components/form/TaxonomyFormModal'
import { tagPath } from '../../constants/routes'
import * as tagService from '../../services/tagService'
import { errorMessage } from '../../utils/errorMessage'

// Edit (an icon button) and the "..." menu: View on site (the public page of the tag, with its published articles) and
// Delete. The tag list does not say how many articles use a tag, so there is no count and no "View articles" in the
// admin list: the backend has no article filter by tag there.
// a stable object (not a new one on every render), so the menu is positioned on the first click
const MENU_POPPER = { strategy: 'fixed' }

function TagActions({ tag, onEdit, onDelete }) {
  const { t } = useTranslation()
  return (
    <div className="d-inline-flex align-items-center gap-1">
      <Button size="sm" variant="light" className="icon-btn" aria-label={t('common.actions.edit')} title={t('common.actions.edit')} onClick={() => onEdit(tag)}>
        <PencilSquare aria-hidden="true" />
      </Button>
      <Dropdown align="end">
        <Dropdown.Toggle size="sm" variant="light" className="icon-btn article-more" aria-label={t('news.list.actions.more')} title={t('news.list.actions.more')}>
          <ThreeDots aria-hidden="true" />
        </Dropdown.Toggle>
        <Dropdown.Menu popperConfig={MENU_POPPER}>
          <Dropdown.Item as={Link} to={tagPath(tag.slug)} target="_blank" rel="noopener noreferrer">
            {t('news.list.actions.viewOnSite')}
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item className="text-danger" onClick={() => onDelete(tag)}>
            {t('common.actions.delete')}
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  )
}

function NameCell({ tag }) {
  return (
    <div className="taxonomy-name min-w-0">
      <div className="news-title">{tag.name}</div>
      <div className="small text-muted">{tagPath(tag.slug)}</div>
    </div>
  )
}

export default function TagsPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''

  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState({ data: null, error: null })
  const [form, setForm] = useState(null) // { tag } while the create / edit modal is open
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  // every tag comes at once; after a change the rows are updated here and the list is loaded again quietly
  useEffect(() => {
    let current = true
    tagService
      .listTags()
      .then((data) => current && setState({ data: data ?? [], error: null }))
      .catch((error) => current && setState((previous) => ({ data: previous.data, error: previous.data ? null : error })))
    return () => {
      current = false
    }
  }, [reloadKey])
  const reload = () => setReloadKey((key) => key + 1)
  const tags = state.data
  const patch = (change) => setState((previous) => ({ ...previous, data: change(previous.data ?? []) }))

  const needle = query.trim().toLowerCase()
  const shown = (tags ?? []).filter((tag) => !needle || tag.name.toLowerCase().includes(needle) || tag.slug.includes(needle))
  const noMatch = tags && tags.length > 0 && shown.length === 0

  const remove = async () => {
    setDeleting(true)
    try {
      await tagService.deleteTag(toDelete.id)
      patch((list) => list.filter((tag) => tag.id !== toDelete.id))
      setToast({ variant: 'success', text: t('dashboard.tags.deleted') })
    } catch (error) {
      setToast({ variant: 'danger', text: errorMessage(error) })
      reload()
    } finally {
      setDeleting(false)
      setToDelete(null)
    }
  }

  const submit = (tag) => (data) => (tag ? tagService.updateTag(tag.id, data) : tagService.createTag(data))
  const saved = (tag, wasEditing) => {
    setForm(null)
    patch((list) => (wasEditing ? list.map((item) => (item.id === tag.id ? tag : item)) : [...list, tag]))
    setToast({ variant: 'success', text: t(wasEditing ? 'dashboard.tags.updated' : 'dashboard.tags.created') })
    reload()
  }
  const actions = (tag) => <TagActions tag={tag} onEdit={(item) => setForm({ tag: item })} onDelete={setToDelete} />

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h1 className="h4 mb-1">{t('dashboard.tags.title')}</h1>
          <p className="text-muted small mb-0">{t('dashboard.tags.intro')}</p>
        </div>
        <Button onClick={() => setForm({ tag: null })}>{t('dashboard.tags.create')}</Button>
      </div>

      <Card className="article-card">
        <div className="article-toolbar p-3">
          <SearchBox
            value={query}
            onChange={(value) => {
              const next = new URLSearchParams(searchParams)
              if (value) next.set('q', value)
              else next.delete('q')
              setSearchParams(next, { replace: true })
            }}
            label={t('dashboard.tags.search')}
            placeholder={t('dashboard.tags.search')}
          />
        </div>

        {!tags && !state.error && <RowsSkeleton />}
        {!tags && state.error && <ErrorState error={state.error} onRetry={reload} />}
        {tags && tags.length === 0 && (
          <EmptyState icon={Tag} text={t('dashboard.tags.empty.none')}>
            <Button size="sm" onClick={() => setForm({ tag: null })}>
              {t('dashboard.tags.create')}
            </Button>
          </EmptyState>
        )}
        {noMatch && (
          <EmptyState icon={Tag} text={t('dashboard.tags.empty.search')}>
            <Button size="sm" variant="outline-primary" onClick={() => setSearchParams({}, { replace: true })}>
              {t('news.list.toolbar.clear')}
            </Button>
          </EmptyState>
        )}

        {shown.length > 0 && (
          <>
            <div className="article-table-wrap d-none d-md-block">
              <Table hover className="article-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>{t('dashboard.tags.name')}</th>
                    <th className="text-end">{t('dashboard.tags.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((tag) => (
                    <tr key={tag.id}>
                      <td>
                        <NameCell tag={tag} />
                      </td>
                      <td className="text-end text-nowrap">{actions(tag)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <ul className="article-cards list-unstyled mb-0 d-md-none">
              {shown.map((tag) => (
                <li key={tag.id} className="d-flex justify-content-between align-items-start gap-2">
                  <NameCell tag={tag} />
                  {actions(tag)}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {form && <TaxonomyFormModal kind="tags" item={form.tag} pathPrefix="/tag/" onSubmit={submit(form.tag)} onSaved={saved} onClose={() => setForm(null)} />}

      <ConfirmDialog show={Boolean(toDelete)} title={t('dashboard.tags.deleteTitle')} confirmLabel={t('common.actions.delete')} confirmVariant="danger" busy={deleting} onCancel={() => setToDelete(null)} onConfirm={remove}>
        <Trans i18nKey="dashboard.tags.deleteText" values={{ name: toDelete?.name }} components={{ 1: <strong /> }} />
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
