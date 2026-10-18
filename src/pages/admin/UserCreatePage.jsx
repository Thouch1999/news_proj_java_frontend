import { useEffect, useState } from 'react'
import { Alert, Breadcrumb, Button, Col, Form, Row, Spinner, Toast, ToastContainer } from 'react-bootstrap'
import { InfoCircle } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import FormCard from '../../components/form/FormCard'
import FormField from '../../components/form/FormField'
import PasswordFields from '../../components/form/PasswordFields'
import RoleCards from '../../components/form/RoleCards'
import { CREATABLE_ROLES } from '../../constants/roles'
import { adminUserPath, ROUTES } from '../../constants/routes'
import * as userService from '../../services/userService'
import { errorMessage } from '../../utils/errorMessage'
import { blankToNull, hasErrors, rules } from '../../utils/validators'

// The fields a message can belong to, in the order of the page (the page scrolls to the first one with an error)
const FIELD_ORDER = ['username', 'email', 'fullName', 'phone', 'address', 'password', 'confirm']
const EMPTY = { username: '', email: '', fullName: '', phone: '', address: '', role: CREATABLE_ROLES[0], password: '', confirm: '' }

// The checks of the backend (AppUserAddRequest), one per field
function check(form) {
  return {
    username: rules.username(form.username),
    email: rules.email(form.email),
    fullName: rules.fullName(form.fullName),
    phone: rules.phone(form.phone),
    password: rules.password(form.password),
    confirm: rules.confirm(form.password, form.confirm),
  }
}

export default function UserCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [touched, setTouched] = useState({}) // fields that were left
  const [submitted, setSubmitted] = useState(false)
  const [apiFields, setApiFields] = useState({}) // errors of the backend, per field
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [focusField, setFocusField] = useState(null)

  const found = check(form)
  // an error shows after the field was left or after "Add user" was pressed; the backend's answer shows at once
  const shown = (field) => apiFields[field] || (touched[field] || submitted ? found[field] : '')
  const typed = JSON.stringify(form) !== JSON.stringify(EMPTY)

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setApiFields((current) => ({ ...current, [field]: '' }))
  }
  const leave = (field) => () => setTouched((current) => ({ ...current, [field]: true }))
  const setPassword = (value) => {
    setForm((current) => ({ ...current, ...value }))
    setApiFields((current) => ({ ...current, password: '', confirm: '' }))
  }

  // the first field with an error scrolls into view and takes the focus
  useEffect(() => {
    if (!focusField) return
    const element = document.getElementById(`user-${focusField.name}`)
    element?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    element?.focus({ preventScroll: true })
  }, [focusField])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return
    setSubmitted(true)
    setApiError(null)
    const first = FIELD_ORDER.find((field) => found[field])
    if (hasErrors(found)) {
      setFocusField((current) => ({ name: first, nonce: (current?.nonce ?? 0) + 1 }))
      return
    }
    setSubmitting(true)
    try {
      const created = await userService.createUser({
        username: form.username.trim(),
        fullName: blankToNull(form.fullName),
        email: form.email.trim().toLowerCase(),
        phone: blankToNull(form.phone),
        address: blankToNull(form.address),
        role: form.role,
        password: form.password,
        confirm: form.confirm,
      })
      navigate(created?.id ? adminUserPath(created.id) : ROUTES.ADMIN_USERS, { state: { messageKey: 'users.create.created' } })
    } catch (error) {
      // field errors go under their fields; "email already registered" belongs to the email; the rest stays in the alert
      let fields = Object.fromEntries(Object.entries(error?.details ?? {}).filter(([field]) => FIELD_ORDER.includes(field)))
      if (Object.keys(fields).length === 0 && error?.code === 409) {
        const field = /email/i.test(error.message) ? 'email' : /user/i.test(error.message) ? 'username' : null
        if (field) fields = { [field]: errorMessage(error) }
      }
      setApiFields(fields)
      setApiError(Object.keys(fields).length > 0 ? null : error)
      const target = FIELD_ORDER.find((field) => fields[field])
      if (target) setFocusField((current) => ({ name: target, nonce: (current?.nonce ?? 0) + 1 }))
      else window.scrollTo({ top: 0, behavior: 'smooth' })
      setSubmitting(false)
    }
  }

  const cancel = () => (typed ? setLeaving(true) : navigate(ROUTES.ADMIN_USERS))
  const slot = (order, node) => <div style={{ order }}>{node}</div>

  return (
    <div>
      <Breadcrumb listProps={{ className: 'mb-2 small' }}>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: ROUTES.ADMIN_USERS }}>
          {t('users.list.title')}
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{t('users.create.title')}</Breadcrumb.Item>
      </Breadcrumb>
      <div className="mb-3">
        <h1 className="h4 mb-1">{t('users.create.title')}</h1>
        <p className="text-muted small mb-0">{t('users.create.intro')}</p>
      </div>

      {apiError && <Alert variant="danger">{errorMessage(apiError)}</Alert>}

      <Form onSubmit={handleSubmit} noValidate>
        <div className="editor-layout">
          <div className="editor-col editor-col--main">
            {slot(
              1,
              <FormCard title={t('users.create.account')}>
                <Row className="g-3">
                  <Col md={6}>
                    <FormField id="user-username" label={t('users.fields.username')} value={form.username} error={shown('username')} onChange={update('username')} onBlur={leave('username')} autoComplete="off" />
                  </Col>
                  <Col md={6}>
                    <FormField id="user-email" label={t('users.fields.email')} type="email" value={form.email} error={shown('email')} onChange={update('email')} onBlur={leave('email')} autoComplete="off" />
                  </Col>
                </Row>
              </FormCard>,
            )}
            {slot(
              3,
              <FormCard title={t('users.create.profile')}>
                <Row className="g-3">
                  <Col md={6}>
                    <FormField id="user-fullName" label={t('users.fields.fullName')} optional value={form.fullName} error={shown('fullName')} onChange={update('fullName')} onBlur={leave('fullName')} />
                  </Col>
                  <Col md={6}>
                    <FormField id="user-phone" label={t('users.fields.phone')} optional value={form.phone} error={shown('phone')} onChange={update('phone')} onBlur={leave('phone')} inputMode="tel" />
                  </Col>
                  <Col xs={12}>
                    <FormField id="user-address" label={t('users.fields.address')} optional value={form.address} error={shown('address')} onChange={update('address')} />
                  </Col>
                </Row>
              </FormCard>,
            )}
            {slot(
              4,
              <FormCard title={t('users.fields.password')}>
                <PasswordFields
                  idPrefix="user"
                  value={{ password: form.password, confirm: form.confirm }}
                  errors={{ password: shown('password'), confirm: shown('confirm') }}
                  onChange={setPassword}
                  onBlur={(field) => setTouched((current) => ({ ...current, [field]: true }))}
                  onCopied={() => setToast({ variant: 'success', text: t('users.password.copiedToast') })}
                />
              </FormCard>,
            )}
          </div>

          <div className="editor-col editor-col--side">
            {slot(
              2,
              <FormCard title={t('users.fields.role')}>
                <RoleCards roles={CREATABLE_ROLES} value={form.role} onChange={(role) => setForm((current) => ({ ...current, role }))} />
              </FormCard>,
            )}
            {slot(
              5,
              <Alert variant="info" className="d-flex align-items-start gap-2 mb-0">
                <InfoCircle aria-hidden="true" className="flex-shrink-0 mt-1" />
                <div className="small">{t('users.create.info')}</div>
              </Alert>,
            )}
          </div>
        </div>

        <div className="form-footer-bar">
          <Button type="button" variant="outline-secondary" disabled={submitting} onClick={cancel}>
            {t('common.actions.cancel')}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Spinner size="sm" animation="border" className="me-2" />}
            {submitting ? t('users.create.creating') : t('users.create.submit')}
          </Button>
        </div>
      </Form>

      <ConfirmDialog show={leaving} title={t('users.create.discardTitle')} confirmLabel={t('users.create.discard')} confirmVariant="danger" onCancel={() => setLeaving(false)} onConfirm={() => navigate(ROUTES.ADMIN_USERS)}>
        {t('users.create.discardText')}
      </ConfirmDialog>

      <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 2000 }}>
        <Toast bg={toast?.variant ?? 'success'} show={Boolean(toast)} onClose={() => setToast(null)} delay={3000} autohide>
          <Toast.Body className="text-white">{toast?.text}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  )
}
