import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Form, Modal, Table } from 'react-bootstrap'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import ErrorAlert from '../../components/common/ErrorAlert'
import PageSpinner from '../../components/common/PageSpinner'
import FormField from '../../components/form/FormField'
import SlugField from '../../components/form/SlugField'
import * as categoryService from '../../services/categoryService'
import { slugify } from '../../utils/slug'
import { blankToNull, hasErrors, rules } from '../../utils/validators'

// category === null creates a new category, otherwise the given one is edited
function CategoryFormModal({ category, onClose, onSaved }) {
  const editing = Boolean(category)
  const [form, setForm] = useState({
    name: category?.name ?? '',
    slug: category?.slug ?? '',
    description: category?.description ?? '',
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = {
      name: rules.name(form.name),
      slug: rules.slug(form.slug),
      description: rules.description(form.description),
    }
    if (!found.name && !found.slug && !form.slug && !slugify(form.name)) {
      found.slug = 'Slug is required for this name (letters a-z, digits and hyphens)'
    }
    setErrors(found)
    setApiError(null)
    if (hasErrors(found)) {
      return
    }
    setSubmitting(true)
    try {
      const data = { name: form.name.trim(), slug: blankToNull(form.slug), description: blankToNull(form.description) }
      const saved = editing ? await categoryService.updateCategory(category.id, data) : await categoryService.createCategory(data)
      onSaved(saved, editing)
    } catch (error) {
      setApiError(error)
      setSubmitting(false)
    }
  }

  return (
    <Modal show onHide={submitting ? undefined : onClose} centered>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton={!submitting}>
          <Modal.Title className="h5">{editing ? 'Edit category' : 'Create category'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ErrorAlert error={apiError} />
          <FormField id="category-name" label="Name" value={form.name} onChange={update('name')} error={errors.name} autoFocus />
          <SlugField id="category-slug" name={form.name} slug={form.slug} onChange={update('slug')} error={errors.slug} editing={editing} />
          <FormField id="category-description" label="Description (optional)" as="textarea" rows={3} value={form.description} onChange={update('description')} error={errors.description} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default function CategoriesPage() {
  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState({ key: null, data: null, error: null })
  const [message, setMessage] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [form, setForm] = useState(null) // { category } while the create/edit modal is open
  const [confirm, setConfirm] = useState(null) // { type: 'toggle' | 'delete', category }
  const [busy, setBusy] = useState(false)

  // the list is reloaded after every change; the old rows stay visible while it loads
  useEffect(() => {
    let current = true
    categoryService
      .listCategoriesForAdmin()
      .then((data) => {
        if (current) setState({ key: reloadKey, data, error: null })
      })
      .catch((error) => {
        if (current) setState({ key: reloadKey, data: null, error })
      })
    return () => {
      current = false
    }
  }, [reloadKey])
  const reload = () => setReloadKey((key) => key + 1)

  const handleSaved = (saved, wasEditing) => {
    setForm(null)
    setActionError(null)
    setMessage(`Category ${wasEditing ? 'updated' : 'created'}. Slug: ${saved.slug}`)
    reload()
  }

  const runAction = async (action, successMessage) => {
    setBusy(true)
    setActionError(null)
    setMessage(null)
    try {
      await action()
      setMessage(successMessage)
      reload()
    } catch (error) {
      setActionError(error)
    } finally {
      setBusy(false)
      setConfirm(null)
    }
  }

  const categories = state.data
  const target = confirm?.category

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Categories</h1>
        <Button onClick={() => setForm({ category: null })}>Create category</Button>
      </div>
      <Alert variant="info" className="small">
        A category that has news cannot be deleted, only deactivated. A deactivated category is hidden from the public menu, and its news stay in the system.
      </Alert>
      {message && <Alert variant="success">{message}</Alert>}
      <ErrorAlert error={actionError} />
      <ErrorAlert error={state.error} />
      {state.key === null && !state.error && <PageSpinner />}
      {categories && (
        <Table responsive hover className="bg-white align-middle">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th className="text-end">News</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted py-4">
                  No categories yet.
                </td>
              </tr>
            )}
            {categories.map((category) => (
              <tr key={category.id}>
                <td>
                  {category.name}
                  {category.description && <div className="text-muted small">{category.description}</div>}
                </td>
                <td>
                  <code>{category.slug}</code>
                </td>
                <td className="text-end">{category.newsCount}</td>
                <td>{category.active ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>}</td>
                <td className="text-end text-nowrap">
                  <Button size="sm" variant="outline-primary" className="me-1" onClick={() => setForm({ category })}>
                    Edit
                  </Button>
                  <Button size="sm" variant={category.active ? 'outline-warning' : 'outline-success'} className="me-1" onClick={() => setConfirm({ type: 'toggle', category })}>
                    {category.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <span title={category.newsCount > 0 ? 'This category has news, so it can only be deactivated.' : undefined}>
                    <Button size="sm" variant="outline-danger" disabled={category.newsCount > 0} onClick={() => setConfirm({ type: 'delete', category })}>
                      Delete
                    </Button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {form && <CategoryFormModal category={form.category} onClose={() => setForm(null)} onSaved={handleSaved} />}

      <ConfirmDialog
        show={confirm?.type === 'toggle'}
        title={target?.active ? 'Deactivate category' : 'Activate category'}
        confirmLabel={target?.active ? 'Deactivate' : 'Activate'}
        confirmVariant={target?.active ? 'warning' : 'success'}
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() =>
          target.active
            ? runAction(() => categoryService.deactivateCategory(target.id), `Category "${target.name}" deactivated.`)
            : runAction(() => categoryService.activateCategory(target.id), `Category "${target.name}" activated.`)
        }
      >
        {target?.active
          ? `"${target?.name}" will disappear from the public menu. Its ${target?.newsCount} news stay in the system.`
          : `"${target?.name}" will show in the public menu again.`}
      </ConfirmDialog>

      <ConfirmDialog
        show={confirm?.type === 'delete'}
        title="Delete category"
        confirmLabel="Delete"
        confirmVariant="danger"
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => runAction(() => categoryService.deleteCategory(target.id), `Category "${target.name}" deleted.`)}
      >
        Delete <strong>{target?.name}</strong>? This cannot be undone.
      </ConfirmDialog>
    </div>
  )
}
