import { useEffect, useState } from 'react'
import { Badge, Breadcrumb, Button, Col, Form, Row, Toast, ToastContainer } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useLocation, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import ActivityHistoryCard from '../../components/activity/ActivityHistoryCard'
import ErrorAlert from '../../components/common/ErrorAlert'
import PageSpinner from '../../components/common/PageSpinner'
import { ReasonTip, RoleBadge, SuperAdminBadge, UserPhoto, UserStatus } from '../../components/common/UserParts'
import FormCard from '../../components/form/FormCard'
import ResetPasswordDialog from '../../components/form/ResetPasswordDialog'
import { ROLES } from '../../constants/roles'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import * as userService from '../../services/userService'
import { userName } from '../../utils/userName'
import { guardsFor } from '../../utils/userGuards'

export default function UserDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { state } = useLocation()
  const { user: me } = useAuth()

  // `loaded` holds the result for one user id; the page is loading until it matches the id in the URL
  const [loaded, setLoaded] = useState({ id: null, user: null, error: null })
  const [role, setRole] = useState('')
  const loading = loaded.id !== id
  const user = loaded.user
  const loadError = loaded.error
  const [actionError, setActionError] = useState(null)
  const [message, setMessage] = useState(state?.messageKey ?? null)
  const [dialog, setDialog] = useState(null) // 'status' | 'role' | 'password' | null
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let current = true
    userService
      .getUser(id)
      .then((data) => {
        if (current) {
          setLoaded({ id, user: data, error: null })
          setRole(data.role)
        }
      })
      .catch((caught) => {
        if (current) setLoaded({ id, user: null, error: caught })
      })
    return () => {
      current = false
    }
  }, [id])

  // runs one admin action; backend errors (including the self-protection rules) are shown as they come
  const run = async (action, successKey) => {
    setBusy(true)
    setActionError(null)
    setMessage(null)
    try {
      const updated = await action()
      if (updated) {
        setLoaded((previous) => ({ ...previous, user: updated }))
        setRole(updated.role)
      }
      setMessage(successKey)
    } catch (error) {
      setActionError(error)
    } finally {
      setBusy(false)
      setDialog(null)
    }
  }

  if (loading) {
    return <PageSpinner />
  }
  if (loadError || !user) {
    return (
      <div>
        <ErrorAlert error={loadError} />
        <Link to={ROUTES.ADMIN_USERS}>{t('users.detail.backToUsers')}</Link>
      </div>
    )
  }

  const isSelf = me?.id === user.id
  const roleChanged = role !== user.role
  const guards = guardsFor(t, user, isSelf, me)

  return (
    <div>
      <Breadcrumb listProps={{ className: 'mb-2 small' }}>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: ROUTES.ADMIN_USERS }}>
          {t('users.list.title')}
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{userName(user)}</Breadcrumb.Item>
      </Breadcrumb>
      <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
        <UserPhoto user={user} size={56} />
        <div className="min-w-0">
          <h1 className="h4 mb-1 d-flex flex-wrap align-items-center gap-2">
            {userName(user)}
            {user.superAdmin && <SuperAdminBadge />}
            {isSelf && (
              <Badge bg="" className="you-badge">
                {t('users.detail.you')}
              </Badge>
            )}
          </h1>
          <div className="d-flex flex-wrap align-items-center gap-2 small">
            <RoleBadge role={user.role} />
            <UserStatus user={user} />
            <span className="text-muted">@{user.username}</span>
          </div>
        </div>
      </div>
      <ErrorAlert error={actionError} />

      <Row className="g-3">
        <Col md={6}>
          <FormCard title={t('users.detail.information')}>
            <dl className="row mb-0">
              <dt className="col-sm-4">ID</dt>
              <dd className="col-sm-8">{user.id}</dd>
              <dt className="col-sm-4">{t('users.fields.username')}</dt>
              <dd className="col-sm-8">{user.username}</dd>
              <dt className="col-sm-4">{t('users.fields.fullName')}</dt>
              <dd className="col-sm-8">{user.fullName || '-'}</dd>
              <dt className="col-sm-4">{t('users.fields.email')}</dt>
              <dd className="col-sm-8">{user.email}</dd>
              <dt className="col-sm-4">{t('users.fields.phone')}</dt>
              <dd className="col-sm-8">{user.phone || '-'}</dd>
              <dt className="col-sm-4">{t('users.fields.address')}</dt>
              <dd className="col-sm-8">{user.address || '-'}</dd>
              <dt className="col-sm-4">{t('users.fields.role')}</dt>
              <dd className="col-sm-8">
                <RoleBadge role={user.role} />
              </dd>
              <dt className="col-sm-4">{t('users.fields.status')}</dt>
              <dd className="col-sm-8">
                <UserStatus user={user} />
              </dd>
            </dl>
          </FormCard>
        </Col>

        <Col md={6}>
          <FormCard title={t('users.fields.status')} className="mb-3">
            {user.active ? (
              <>
                <ReasonTip reason={guards.deactivate} id="deactivate-reason">
                  <Button variant="outline-danger" disabled={Boolean(guards.deactivate) || busy} onClick={() => setDialog('status')}>
                    {t('users.detail.deactivate')}
                  </Button>
                </ReasonTip>
                {guards.deactivate && <div className="form-text">{guards.deactivate}</div>}
              </>
            ) : (
              <Button variant="outline-success" disabled={busy} onClick={() => setDialog('status')}>
                {t('users.detail.activate')}
              </Button>
            )}
          </FormCard>

          <FormCard title={t('users.fields.role')} className="mb-3">
            <Form.Select aria-label={t('users.fields.role')} value={role} onChange={(event) => setRole(event.target.value)} disabled={Boolean(guards.role) || busy}>
              {Object.values(ROLES).map((name) => (
                <option key={name} value={name} disabled={name === ROLES.ADMIN && !me?.superAdmin && user.role !== ROLES.ADMIN}>
                  {t(`common.roles.${name}`)}
                  {name === ROLES.ADMIN && !me?.superAdmin && user.role !== ROLES.ADMIN ? ` (${t('users.superAdmin.adminRoleHint')})` : ''}
                </option>
              ))}
            </Form.Select>
            <div className="form-text">{guards.role ?? t('users.detail.oneRole')}</div>
            <Button className="mt-2" disabled={Boolean(guards.role) || !roleChanged || busy} onClick={() => setDialog('role')}>
              {t('users.detail.changeRole')}
            </Button>
          </FormCard>

          <FormCard title={t('users.fields.password')}>
            <ReasonTip reason={guards.password} id="password-reason">
              <Button variant="outline-secondary" disabled={Boolean(guards.password) || busy} onClick={() => setDialog('password')}>
                {t('users.detail.resetPassword')}
              </Button>
            </ReasonTip>
            {guards.password && <div className="form-text">{guards.password}</div>}
          </FormCard>
        </Col>
      </Row>

      {/* what was done to this account (created, role, password reset ...) and its sign-ins */}
      <div className="mt-3">
        <ActivityHistoryCard types={['USER', 'AUTH']} id={user.id} refreshKey={`${user.role}|${user.active}`} />
      </div>

      <ConfirmDialog
        show={dialog === 'status'}
        title={user.active ? t('users.detail.deactivate') : t('users.detail.activate')}
        confirmLabel={user.active ? t('users.detail.deactivateShort') : t('users.detail.activateShort')}
        confirmVariant={user.active ? 'danger' : 'success'}
        busy={busy}
        onCancel={() => setDialog(null)}
        onConfirm={() =>
          user.active
            ? run(() => userService.deactivateUser(user.id), 'users.detail.deactivated')
            : run(() => userService.activateUser(user.id), 'users.detail.activated')
        }
      >
        {user.active ? t('users.detail.deactivateText', { username: user.username }) : t('users.detail.activateText', { username: user.username })}
      </ConfirmDialog>

      <ConfirmDialog
        show={dialog === 'role'}
        title={t('users.detail.changeRole')}
        confirmLabel={t('users.detail.changeRole')}
        busy={busy}
        onCancel={() => setDialog(null)}
        onConfirm={() => run(() => userService.changeUserRole(user.id, role), 'users.detail.roleChanged')}
      >
        <Trans
          i18nKey="users.detail.changeRoleText"
          values={{ username: user.username, from: t(`common.roles.${user.role}`, { defaultValue: user.role }), to: t(`common.roles.${role}`, { defaultValue: role }) }}
          components={{ 1: <strong />, 2: <strong />, 3: <strong /> }}
        />
      </ConfirmDialog>

      {dialog === 'password' && (
        <ResetPasswordDialog
          username={user.username}
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={(form) => run(() => userService.resetUserPassword(user.id, form), 'users.detail.passwordReset')}
        />
      )}
    
      <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 2000 }}>
        <Toast bg="success" show={Boolean(message)} onClose={() => setMessage(null)} delay={5000} autohide>
          <Toast.Body className="text-white d-flex justify-content-between gap-3">
            <span>{message ? t(message) : ''}</span>
            <button type="button" className="btn-close btn-close-white" aria-label={t('common.actions.close')} onClick={() => setMessage(null)} />
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  )
}
