import { useEffect, useState } from 'react'
import { Button, Col, Form, Row, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import ErrorAlert from '../common/ErrorAlert'
import FormField from '../form/FormField'
import * as userService from '../../services/userService'
import { fieldErrors } from '../../utils/errorMessage'
import { blankToNull, hasErrors, rules } from '../../utils/validators'

const FIELDS = ['username', 'fullName', 'phone', 'address']
const fromUser = (user) => ({ username: user.username ?? '', fullName: user.fullName ?? '', phone: user.phone ?? '', address: user.address ?? '' })

// The "Profile" tab: name, username, phone and address. The photo is changed on the profile card; it is sent back
// unchanged here. The form is "changed" when it differs from the saved user, so after a save it is clean again.
//   onSaved(user)  onDirtyChange(bool)  notify(variant, text)
export default function ProfileDetailsForm({ user, onSaved, onDirtyChange, notify }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(() => fromUser(user))
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const saved = fromUser(user)
  const dirty = FIELDS.some((field) => form[field].trim() !== saved[field].trim())
  useEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setJustSaved(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!dirty || submitting) return
    const found = { username: rules.username(form.username), fullName: rules.fullName(form.fullName), phone: rules.phone(form.phone) }
    setErrors(found)
    setApiError(null)
    if (hasErrors(found)) return
    setSubmitting(true)
    try {
      const updated = await userService.updateMe({
        username: form.username.trim(),
        fullName: blankToNull(form.fullName),
        address: blankToNull(form.address),
        phone: blankToNull(form.phone),
        avatar: user.avatar ?? null,
      })
      onSaved(updated)
      setForm(fromUser(updated))
      setJustSaved(true)
      notify('success', t('dashboard.profile.updated'))
    } catch (caught) {
      const underFields = fieldErrors(caught, FIELDS, { 'Username already taken': 'username' })
      setErrors(underFields)
      setApiError(Object.keys(underFields).length === 0 ? caught : null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <ErrorAlert error={apiError} />
      <Row>
        <Col md={6}>
          <FormField id="profile-fullName" label={t('auth.fields.fullName')} optional value={form.fullName} onChange={update('fullName')} error={errors.fullName} autoComplete="name" />
        </Col>
        <Col md={6}>
          <FormField id="profile-username" label={t('auth.fields.username')} value={form.username} onChange={update('username')} error={errors.username} help={t('dashboard.profile.usernameHelp')} autoComplete="username" />
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <FormField id="profile-phone" label={t('dashboard.profile.phone')} optional type="tel" value={form.phone} onChange={update('phone')} error={errors.phone} autoComplete="tel" />
        </Col>
        <Col md={6}>
          <FormField id="profile-address" label={t('dashboard.profile.address')} optional value={form.address} onChange={update('address')} error={errors.address} autoComplete="street-address" />
        </Col>
      </Row>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-3 border-top">
        <span className="small text-muted" role="status">
          {dirty ? t('dashboard.profile.unsaved') : justSaved ? t('dashboard.profile.allSaved') : ''}
        </span>
        <Button type="submit" disabled={!dirty || submitting}>
          {submitting && <Spinner size="sm" className="me-2" aria-hidden="true" />}
          {submitting ? t('common.actions.saving') : t('dashboard.profile.saveChanges')}
        </Button>
      </div>
    </Form>
  )
}
