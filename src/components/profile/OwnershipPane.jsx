import { useEffect, useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import ConfirmDialog from '../common/ConfirmDialog'
import ErrorAlert from '../common/ErrorAlert'
import PasswordInput from '../form/PasswordInput'
import { ROLES } from '../../constants/roles'
import * as userService from '../../services/userService'
import { userName } from '../../utils/userName'
import { rules } from '../../utils/validators'

const MAX_ADMINS = 100

// The "Ownership" tab, for the super admin only: hands the super admin mark to another admin. The choice is limited to
// active admins with a verified email (the backend checks the same). It asks for the current password and, after a
// confirmation, moves the mark; then the session user is read again, so this account is a normal admin from now on.
//   user: the logged-in super admin   refreshUser(): reloads the session user   notify(variant, text): shows a toast
export default function OwnershipPane({ user, refreshUser, notify }) {
  const { t } = useTranslation()
  const [admins, setAdmins] = useState(null) // null while loading
  const [loadError, setLoadError] = useState(null)
  const [target, setTarget] = useState('')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [apiError, setApiError] = useState(null)

  useEffect(() => {
    let current = true
    userService
      .listUsers({ role: ROLES.ADMIN, active: 'true', emailVerified: 'true', size: MAX_ADMINS })
      .then((page) => {
        if (current) setAdmins(page.items.filter((admin) => admin.id !== user.id))
      })
      .catch((caught) => {
        if (current) {
          setAdmins([])
          setLoadError(caught)
        }
      })
    return () => {
      current = false
    }
  }, [user.id])

  const chosen = admins?.find((admin) => String(admin.id) === target)

  const ask = (event) => {
    event.preventDefault()
    setApiError(null)
    const missing = rules.required(t('users.superAdmin.transfer.password'))(password)
    if (missing) {
      setPasswordError(missing)
      return
    }
    setConfirming(true)
  }

  const transfer = async () => {
    setBusy(true)
    try {
      const updated = await userService.transferSuperAdmin({ userId: chosen.id, password })
      setConfirming(false)
      setPassword('')
      await refreshUser()
      notify('success', t('users.superAdmin.transfer.done', { name: userName(updated) }))
    } catch (caught) {
      setConfirming(false)
      setApiError(caught)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Form onSubmit={ask} noValidate>
      <h2 className="h6">{t('users.superAdmin.transfer.title')}</h2>
      <p className="text-muted small">{t('users.superAdmin.transfer.intro')}</p>
      <ErrorAlert error={apiError ?? loadError} />
      {admins !== null && admins.length === 0 && !loadError ? (
        <p className="mb-0" role="status">
          {t('users.superAdmin.transfer.none')}
        </p>
      ) : (
        <>
          <Form.Group className="mb-3" controlId="transfer-target">
            <Form.Label>{t('users.superAdmin.transfer.select')}</Form.Label>
            <Form.Select value={target} disabled={admins === null || busy} onChange={(event) => setTarget(event.target.value)}>
              <option value="">{admins === null ? t('users.superAdmin.transfer.loading') : t('users.superAdmin.transfer.placeholder')}</option>
              {(admins ?? []).map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {userName(admin)} ({admin.email})
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <PasswordInput
            id="transfer-password"
            label={t('users.superAdmin.transfer.password')}
            value={password}
            error={passwordError}
            onChange={(value) => {
              setPassword(value)
              setPasswordError('')
            }}
          />
          <div className="d-flex justify-content-end pt-3 border-top">
            <Button type="submit" variant="danger" disabled={!chosen || busy}>
              {t('users.superAdmin.transfer.button')}
            </Button>
          </div>
        </>
      )}

      <ConfirmDialog
        show={confirming}
        title={t('users.superAdmin.transfer.confirmTitle')}
        confirmLabel={t('users.superAdmin.transfer.confirmButton')}
        confirmVariant="danger"
        busy={busy}
        onCancel={() => setConfirming(false)}
        onConfirm={transfer}
      >
        {chosen && (
          <p className="mb-2">
            <strong>{t('users.superAdmin.transfer.confirmTo', { name: userName(chosen) })}</strong>
          </p>
        )}
        <p className="mb-0">{t('users.superAdmin.transfer.confirmText')}</p>
      </ConfirmDialog>
    </Form>
  )
}
