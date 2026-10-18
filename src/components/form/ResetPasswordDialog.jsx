import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import ConfirmDialog from '../common/ConfirmDialog'
import { hasErrors, rules } from '../../utils/validators'
import PasswordFields from './PasswordFields'

// Set a new password for a user (admin). Their refresh tokens are revoked, so they have to log in again. Mount it only
// while it is open, so the fields start empty. `onConfirm({ password, confirm })`.
export default function ResetPasswordDialog({ username, busy, onConfirm, onCancel }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState({})

  const submit = () => {
    const found = {
      password: rules.password(form.password),
      confirm: rules.confirm(form.password, form.confirm),
    }
    setErrors(found)
    if (!hasErrors(found)) {
      onConfirm(form)
    }
  }

  return (
    <ConfirmDialog show title={t('users.detail.resetPassword')} confirmLabel={t('users.detail.resetPassword')} confirmVariant="danger" busy={busy} onConfirm={submit} onCancel={onCancel}>
      <p>
        <Trans i18nKey="users.detail.resetText" values={{ username }} components={{ 1: <strong /> }} />
      </p>
      <PasswordFields
        idPrefix="reset"
        value={form}
        errors={errors}
        onChange={(value) => {
          setForm(value)
          setErrors({})
        }}
      />
    </ConfirmDialog>
  )
}
