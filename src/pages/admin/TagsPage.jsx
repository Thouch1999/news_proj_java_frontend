import { useEffect, useState } from 'react'
import { Alert, Button, Form, Modal, Table } from 'react-bootstrap'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import ErrorAlert from '../../components/common/ErrorAlert'
import PageSpinner from '../../components/common/PageSpinner'
import FormField from '../../components/form/FormField'
import SlugField from '../../components/form/SlugField'
import * as tagService from '../../services/tagService'
import { slugify } from '../../utils/slug'
import { blankToNull, hasErrors, rules } from '../../utils/validators'

// tag === null creates a new tag, otherwise the given one is edited
function TagFormModal({ tag, onClose, onSaved }) {
  const editing = Boolean(tag)
  const [form, setForm] = useState({ name: tag?.name ?? '', slug: tag?.slug ?? '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = { name: rules.name(form.name), slug: rules.slug(form.slug) }
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
      const data = { name: form.name.trim(), slug: blankToNull(form.slug) }
      const saved = editing ? await tagService.updateTag(tag.id, data) : await tagService.createTag(data)
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
          <Modal.Title className="h5">{editing ? 'Edit tag' : 'Create tag'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ErrorAlert error={apiError} />
          <FormField id="tag-name" label="Name" value={form.name} onChange={update('name')} error={errors.name} autoFocus />
          <SlugField id="tag-slug" name={form.name} slug={form.slug} onChange={update('slug')} error={errors.slug} editing={editing} />
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

export default function TagsPage() {
  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState({ key: null, data: null, error: null })
  const [message, setMessage] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [form, setForm] = useState(null) // { tag } while the create/edit modal is open
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let current = true
    tagService
      .listTags()
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
    setMessage(`Tag ${wasEditing ? 'updated' : 'created'}. Slug: ${saved.slug}`)
    reload()
  }

  const handleDelete = async () => {
    setBusy(true)
    setActionError(null)
    setMessage(null)
    try {
      await tagService.deleteTag(toDelete.id)
      setMessage(`Tag "${toDelete.name}" deleted.`)
      reload()
    } catch (error) {
      setActionError(error)
    } finally {
      setBusy(false)
      setToDelete(null)
    }
  }

  const tags = state.data

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Tags</h1>
        <Button onClick={() => setForm({ tag: null })}>Create tag</Button>
      </div>
      {message && <Alert variant="success">{message}</Alert>}
      <ErrorAlert error={actionError} />
      <ErrorAlert error={state.error} />
      {state.key === null && !state.error && <PageSpinner />}
      {tags && (
        <Table responsive hover className="bg-white align-middle">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tags.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-muted py-4">
                  No tags yet.
                </td>
              </tr>
            )}
            {tags.map((tag) => (
              <tr key={tag.id}>
                <td>{tag.name}</td>
                <td>
                  <code>{tag.slug}</code>
                </td>
                <td className="text-end text-nowrap">
                  <Button size="sm" variant="outline-primary" className="me-1" onClick={() => setForm({ tag })}>
                    Edit
                  </Button>
                  <Button size="sm" variant="outline-danger" onClick={() => setToDelete(tag)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {form && <TagFormModal tag={form.tag} onClose={() => setForm(null)} onSaved={handleSaved} />}

      <ConfirmDialog show={Boolean(toDelete)} title="Delete tag" confirmLabel="Delete" confirmVariant="danger" busy={busy} onCancel={() => setToDelete(null)} onConfirm={handleDelete}>
        Delete <strong>{toDelete?.name}</strong>? It is also removed from every news article that uses it. This cannot be undone.
      </ConfirmDialog>
    </div>
  )
}
