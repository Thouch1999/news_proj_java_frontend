import { useEffect, useState } from 'react'
import { Button, Form, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import ErrorAlert from '../common/ErrorAlert'
import PasswordFields from '../form/PasswordFields'
import PasswordInput from '../form/PasswordInput'
import * as authService from '../../services/authService'
import { fieldErrors } from '../../utils/errorMessage'
import { hasErrors, rules } from '../../utils/validators'

const EMPTY = { currentPassword: '', password: '', confirm: '' }
const BY_MESSAGE = { 'Current password is incorrect': 'currentPassword', 'Confirm password not match': 'confirm' }

// The "Password" tab: the current password, then the new one with the rules checklist and the strength meter
// (PasswordFields, as on the Add user page). Success clears the fields and shows a toast.
//   onDirtyChange(bool)  notify(variant, text)
export default function PasswordChangeForm({ onDirtyChange, notify }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const dirty = Object.values(form).some(Boolean)
  useEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])

  const change = (patch) => {
    setForm((current) => ({ ...current, ...patch }))
    setErrors((current) => ({ ...current, ...Object.fromEntries(Object.keys(patch).map((field) => [field, ''])) }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return
    const found = {
      currentPassword: rules.required(t('auth.fields.currentPassword'))(form.currentPassword),
      password: rules.password(form.password),
      confirm: rules.confirm(form.password, form.confirm),
    }
    setErrors(found)
    setApiError(null)
    if (hasErrors(found)) return
    setSubmitting(true)
    try {
      await authService.changePassword(form)
      setForm(EMPTY)
      notify('success', t('dashboard.profile.passwordChanged'))
    } catch (caught) {
      const underFields = fieldErrors(caught, Object.keys(EMPTY), BY_MESSAGE)
      setErrors(underFields)
      setApiError(Object.keys(underFields).length === 0 ? caught : null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <ErrorAlert error={apiError} />
      <PasswordInput id="current-password" label={t('auth.fields.currentPassword')} value={form.currentPassword} error={errors.currentPassword} onChange={(value) => change({ currentPassword: value })} />
      <PasswordFields
        idPrefix="new"
        generator={false}
        labels={{ password: t('auth.fields.newPassword'), confirm: t('auth.fields.confirmNewPassword') }}
        value={{ password: form.password, confirm: form.confirm }}
        errors={errors}
        onChange={(value) => change(value)}
      />
      <div className="d-flex justify-content-end pt-3 border-top">
        <Button type="submit" disabled={submitting}>
          {submitting && <Spinner size="sm" className="me-2" aria-hidden="true" />}
          {submitting ? t('dashboard.profile.changing') : t('dashboard.profile.changePassword')}
        </Button>
      </div>
    </Form>
  )
}
