import { useState } from 'react'
import { Alert, Button, Form, InputGroup, Modal } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useFormat } from '../../hooks/useFormat'
import { errorMessage } from '../../utils/errorMessage'
import { slugify } from '../../utils/slug'
import { blankToNull, hasErrors, rules } from '../../utils/validators'

const NAME_MAX = 100
const DESCRIPTION_MAX = 500
const FIELDS = ['name', 'slug', 'description']

// Create / edit a category or a tag in a modal (the same form for both).
//   kind: 'categories' | 'tags' (the translation group)   item: null to create, else the one to edit
//   pathPrefix: '/category/' or '/tag/'   withDescription / withActive: the category's extras (active is for create only)
//   onSubmit(data, { active }) calls the service and returns what it saved; onSaved(saved, wasEditing) is called after
// The public path is previewed while typing. Errors of the backend show under their field (a name that exists is a 409
// and belongs to the name).
export default function TaxonomyFormModal({ kind, item, pathPrefix, withDescription = false, withActive = false, onSubmit, onSaved, onClose }) {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  const editing = Boolean(item)
  const [form, setForm] = useState({ name: item?.name ?? '', slug: item?.slug ?? '', description: item?.description ?? '', active: true })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }
  const generated = slugify(form.name)
  const shownPath = `${pathPrefix}${form.slug || generated || '…'}`
  let pathHelp
  if (form.slug) pathHelp = t('common.slugField.asIs')
  else if (generated) pathHelp = t('common.slugField.generated', { slug: generated })
  else if (form.name.trim()) pathHelp = t('common.slugField.noLatin')
  else pathHelp = t('common.slugField.empty')
  if (editing) pathHelp += ` ${t('common.slugField.editingWarning')}`

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return
    const found = { name: rules.name(form.name), slug: rules.slug(form.slug), description: withDescription ? rules.description(form.description) : '' }
    if (!found.name && !found.slug && !form.slug && !generated) found.slug = t('dashboard.slugRequired')
    setErrors(found)
    setApiError(null)
    if (hasErrors(found)) return
    setSubmitting(true)
    try {
      const data = { name: form.name.trim(), slug: blankToNull(form.slug) }
      if (withDescription) data.description = blankToNull(form.description)
      const saved = await onSubmit(data, { active: form.active })
      onSaved(saved, editing)
    } catch (error) {
      const details = Object.fromEntries(Object.entries(error?.details ?? {}).filter(([field]) => FIELDS.includes(field)))
      if (Object.keys(details).length > 0) setErrors(details)
      else if (error?.code === 409) setErrors({ name: errorMessage(error) })
      else setApiError(error)
      setSubmitting(false)
    }
  }

  return (
    <Modal show onHide={submitting ? undefined : onClose} centered>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton={!submitting} closeLabel={t('common.actions.close')}>
          <Modal.Title className="h5">{editing ? t(`dashboard.${kind}.edit`) : t(`dashboard.${kind}.create`)}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {apiError && <Alert variant="danger">{errorMessage(apiError)}</Alert>}

          <Form.Group className="mb-3" controlId={`${kind}-name`}>
            <Form.Label>{t(`dashboard.${kind}.name`)}</Form.Label>
            <Form.Control value={form.name} isInvalid={Boolean(errors.name)} autoFocus onChange={update('name')} />
            <div className="d-flex justify-content-between gap-2 mt-1">
              <Form.Control.Feedback type="invalid" className="d-block w-auto">
                {errors.name}
              </Form.Control.Feedback>
              <span className={`small ms-auto ${form.name.length > NAME_MAX ? 'text-danger' : 'text-muted'}`}>
                {formatNumber(form.name.length)} / {formatNumber(NAME_MAX)}
              </span>
            </div>
          </Form.Group>

          {withDescription && (
            <Form.Group className="mb-3" controlId={`${kind}-description`}>
              <Form.Label>{t('dashboard.categories.descriptionOptional')}</Form.Label>
              <Form.Control as="textarea" rows={3} value={form.description} isInvalid={Boolean(errors.description)} onChange={update('description')} />
              <div className="d-flex justify-content-between gap-2 mt-1">
                <Form.Control.Feedback type="invalid" className="d-block w-auto">
                  {errors.description}
                </Form.Control.Feedback>
                <span className={`small ms-auto ${form.description.length > DESCRIPTION_MAX ? 'text-danger' : 'text-muted'}`}>
                  {formatNumber(form.description.length)} / {formatNumber(DESCRIPTION_MAX)}
                </span>
              </div>
            </Form.Group>
          )}

          <Form.Group className="mb-3" controlId={`${kind}-slug`}>
            <Form.Label>{editing ? t('dashboard.form.path') : t('dashboard.form.pathOptional')}</Form.Label>
            <InputGroup>
              <InputGroup.Text className="path-prefix">{pathPrefix}</InputGroup.Text>
              <Form.Control value={form.slug} isInvalid={Boolean(errors.slug)} placeholder={generated} onChange={update('slug')} />
              <Form.Control.Feedback type="invalid">{errors.slug}</Form.Control.Feedback>
            </InputGroup>
            <Form.Text className="d-block text-muted">
              {t('dashboard.form.preview')} <span className="fw-semibold text-body">{shownPath}</span>
            </Form.Text>
            <Form.Text className="d-block text-muted">{pathHelp}</Form.Text>
          </Form.Group>

          {withActive && !editing && (
            <Form.Check
              id={`${kind}-active`}
              type="switch"
              label={form.active ? t('dashboard.categories.activeOn') : t('dashboard.categories.activeOff')}
              checked={form.active}
              onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose} disabled={submitting}>
            {t('common.actions.cancel')}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? t('common.actions.saving') : editing ? t('news.editor.saveChanges') : t(`dashboard.${kind}.create`)}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
