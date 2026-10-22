import { Badge, Dropdown, Form, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { CheckCircle, ExclamationTriangle, Person, ThreeDots } from 'react-bootstrap-icons'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ROLE_ICON, ROLES } from '../../constants/roles'
import { adminUserPath } from '../../constants/routes'
import { guardsFor } from '../../utils/userGuards'
import { userName } from '../../utils/userName'
import ConfirmDialog from './ConfirmDialog'
import UserAvatar from './UserAvatar'

// The parts the Users page and the user detail page share: avatar, role badge, status, the name and the action menu.

// A role as a soft tint with an icon (never red): Admin primary, Editor blue, Author teal, Reader grey
export function RoleBadge({ role }) {
  const { t } = useTranslation()
  const Icon = ROLE_ICON[role] ?? Person
  return (
    <span className={`role-badge role-badge--${role}`}>
      <Icon aria-hidden="true" />
      {t(`common.roles.${role}`, { defaultValue: role })}
    </span>
  )
}

// A crown (react-bootstrap-icons has none)
function CrownIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M1.5 4.2 4.6 7 8 2.5 11.4 7l3.1-2.8-1.2 7.1H2.7L1.5 4.2Zm1.6 8.6h9.8v1.2H3.1v-1.2Z" />
    </svg>
  )
}

// "Super admin": a crown on a soft gold tint, next to the name. `compact` is the crown alone (it keeps its text for screen readers).
export function SuperAdminBadge({ compact = false }) {
  const { t } = useTranslation()
  return (
    <span className={`super-admin-badge${compact ? ' super-admin-badge--compact' : ''}`} title={compact ? t('users.superAdmin.badge') : undefined}>
      <CrownIcon />
      <span className={compact ? 'visually-hidden' : undefined}>{t('users.superAdmin.badge')}</span>
    </span>
  )
}

// A disabled control keeps its reason in a tooltip (the wrapper can be focused, so a keyboard user reads it too)
export function ReasonTip({ reason, id, children }) {
  if (!reason) return children
  return (
    <OverlayTrigger placement="left" overlay={<Tooltip id={id}>{reason}</Tooltip>}>
      <span className="d-block" tabIndex={0}>
        {children}
      </span>
    </OverlayTrigger>
  )
}

// The photo, or the first letter of the name on a tint that is the same for the same user
export function UserPhoto({ user, size = 36 }) {
  return <UserAvatar src={user.avatar} name={userName(user)} size={size} fallback="initial" className={`user-avatar user-avatar--${user.id % 6}`} />
}

// Plain "Active" for a normal account; a warning badge when the email is not verified and a grey badge when the account is
// deactivated (both when both are true)
export function UserStatus({ user }) {
  const { t } = useTranslation()
  if (user.active && user.emailVerified) {
    return (
      <span className="d-inline-flex align-items-center gap-1">
        <CheckCircle aria-hidden="true" className="text-muted" /> {t('users.status.active')}
      </span>
    )
  }
  return (
    <span className="d-inline-flex flex-wrap gap-1">
      {!user.active && <Badge bg="secondary">{t('users.status.inactive')}</Badge>}
      {!user.emailVerified && (
        <Badge bg="warning" text="dark" className="d-inline-flex align-items-center gap-1">
          <ExclamationTriangle aria-hidden="true" />
          {t('users.status.notVerified')}
        </Badge>
      )}
    </span>
  )
}

// Photo, the name (the username when there is no full name), "You" for the logged-in admin and "@username · email" under
// it; a long email is cut and shown in full in a tooltip. `link` makes the name a link to the detail page.
export function UserCell({ user, isSelf, link = true }) {
  const { t } = useTranslation()
  const name = userName(user)
  return (
    <div className="d-flex align-items-center gap-3 min-w-0">
      <UserPhoto user={user} />
      <div className="min-w-0">
        <div className="d-flex align-items-center gap-2">
          {link ? (
            <Link to={adminUserPath(user.id)} className="user-name">
              {name}
            </Link>
          ) : (
            <span>{name}</span>
          )}
          {user.superAdmin && <SuperAdminBadge />}
          {isSelf && (
            <Badge bg="" className="you-badge">
              {t('users.detail.you')}
            </Badge>
          )}
        </div>
        <OverlayTrigger placement="bottom" overlay={<Tooltip id={`email-${user.id}`}>{user.email}</Tooltip>}>
          <div className="small text-muted text-truncate user-sub" tabIndex={0}>
            @{user.username} &middot; {user.email}
          </div>
        </OverlayTrigger>
      </div>
    </div>
  )
}

// The "..." menu: View profile, Edit role, Reset password, then Deactivate (red) or Activate. What an admin may not do to
// their own account is disabled and says why.
export function UserActions({ user, isSelf, viewer, onEditRole, onResetPassword, onToggleActive }) {
  const { t } = useTranslation()
  const guards = guardsFor(t, user, isSelf, viewer)
  const stop = (event) => event.stopPropagation()
  return (
    <span onClick={stop} onKeyDown={stop}>
      <Dropdown align="end">
        <Dropdown.Toggle size="sm" variant="light" className="icon-btn article-more" aria-label={t('news.list.actions.more')} title={t('news.list.actions.more')}>
          <ThreeDots aria-hidden="true" />
        </Dropdown.Toggle>
        <Dropdown.Menu popperConfig={{ strategy: 'fixed' }}>
          <Dropdown.Item as={Link} to={adminUserPath(user.id)}>
            {t('users.list.viewProfile')}
          </Dropdown.Item>
          <ReasonTip reason={guards.role} id={`role-reason-${user.id}`}>
            <Dropdown.Item disabled={Boolean(guards.role)} onClick={() => onEditRole(user)}>
              {t('users.list.editRole')}
            </Dropdown.Item>
          </ReasonTip>
          <ReasonTip reason={guards.password} id={`password-reason-${user.id}`}>
            <Dropdown.Item disabled={Boolean(guards.password)} onClick={() => onResetPassword(user)}>
              {t('users.detail.resetPassword')}
            </Dropdown.Item>
          </ReasonTip>
          <Dropdown.Divider />
          {user.active ? (
            <ReasonTip reason={guards.deactivate} id={`deactivate-reason-${user.id}`}>
              <Dropdown.Item className={guards.deactivate ? undefined : 'text-danger'} disabled={Boolean(guards.deactivate)} onClick={() => onToggleActive(user)}>
                {t('users.detail.deactivateShort')}
              </Dropdown.Item>
            </ReasonTip>
          ) : (
            <Dropdown.Item onClick={() => onToggleActive(user)}>{t('users.detail.activateShort')}</Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown>
    </span>
  )
}

// Edit the role: a user has exactly one role, so it is a choice of one (the backend replaces it). It says what will be
// saved. `selected` and `onSelect` are controlled by the page; the role of your own account cannot be changed.
export function RoleDialog({ user, isSelf, viewer, selected, busy, onSelect, onConfirm, onCancel }) {
  const { t } = useTranslation()
  const changed = selected !== user.role
  const blocked = guardsFor(t, user, isSelf, viewer).role
  const canGiveAdmin = Boolean(viewer?.superAdmin)
  return (
    <ConfirmDialog show title={t('users.list.editRole')} confirmLabel={t('users.detail.changeRole')} busy={busy} confirmDisabled={Boolean(blocked) || !changed} onCancel={onCancel} onConfirm={onConfirm}>
      <p className="mb-2">{userName(user)}</p>
      <fieldset disabled={Boolean(blocked) || busy}>
        <legend className="visually-hidden">{t('users.fields.role')}</legend>
        {Object.values(ROLES).map((role) => (
          <Form.Check
            key={role}
            type="radio"
            id={`role-${role}`}
            name="user-role"
            label={role === ROLES.ADMIN && !canGiveAdmin ? `${t(`common.roles.${role}`)} (${t('users.superAdmin.adminRoleHint')})` : t(`common.roles.${role}`)}
            checked={selected === role}
            disabled={role === ROLES.ADMIN && !canGiveAdmin && user.role !== ROLES.ADMIN}
            onChange={() => onSelect(role)}
          />
        ))}
      </fieldset>
      <p className="text-muted small mt-2 mb-2">{blocked ?? t('users.detail.oneRole')}</p>
      {changed && !blocked && (
        <p className="mb-0" role="status">
          <Trans i18nKey="users.list.roleChange" values={{ from: t(`common.roles.${user.role}`, { defaultValue: user.role }), to: t(`common.roles.${selected}`, { defaultValue: selected }) }} components={{ 1: <strong />, 2: <strong /> }} />
        </p>
      )}
    </ConfirmDialog>
  )
}
