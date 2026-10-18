import { Badge, Dropdown, Form, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { CheckCircle, ExclamationTriangle, Person, ThreeDots } from 'react-bootstrap-icons'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ROLE_ICON, ROLES } from '../../constants/roles'
import { adminUserPath } from '../../constants/routes'
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
export function UserActions({ user, isSelf, onEditRole, onResetPassword, onToggleActive }) {
  const { t } = useTranslation()
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
          <Dropdown.Item disabled={isSelf} onClick={() => onEditRole(user)}>
            {t('users.list.editRole')}
          </Dropdown.Item>
          {isSelf && <Dropdown.ItemText className="small text-muted category-delete-reason">{t('users.detail.cannotChangeSelf')}</Dropdown.ItemText>}
          <Dropdown.Item onClick={() => onResetPassword(user)}>{t('users.detail.resetPassword')}</Dropdown.Item>
          <Dropdown.Divider />
          {user.active ? (
            <>
              <Dropdown.Item className={isSelf ? undefined : 'text-danger'} disabled={isSelf} onClick={() => onToggleActive(user)}>
                {t('users.detail.deactivateShort')}
              </Dropdown.Item>
              {isSelf && <Dropdown.ItemText className="small text-muted category-delete-reason">{t('users.detail.cannotDeactivateSelf')}</Dropdown.ItemText>}
            </>
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
export function RoleDialog({ user, isSelf, selected, busy, onSelect, onConfirm, onCancel }) {
  const { t } = useTranslation()
  const changed = selected !== user.role
  return (
    <ConfirmDialog show title={t('users.list.editRole')} confirmLabel={t('users.detail.changeRole')} busy={busy} confirmDisabled={isSelf || !changed} onCancel={onCancel} onConfirm={onConfirm}>
      <p className="mb-2">{userName(user)}</p>
      <fieldset disabled={isSelf || busy}>
        <legend className="visually-hidden">{t('users.fields.role')}</legend>
        {Object.values(ROLES).map((role) => (
          <Form.Check key={role} type="radio" id={`role-${role}`} name="user-role" label={t(`common.roles.${role}`)} checked={selected === role} onChange={() => onSelect(role)} />
        ))}
      </fieldset>
      <p className="text-muted small mt-2 mb-2">{isSelf ? t('users.detail.cannotChangeSelf') : t('users.detail.oneRole')}</p>
      {changed && !isSelf && (
        <p className="mb-0" role="status">
          <Trans i18nKey="users.list.roleChange" values={{ from: t(`common.roles.${user.role}`, { defaultValue: user.role }), to: t(`common.roles.${selected}`, { defaultValue: selected }) }} components={{ 1: <strong />, 2: <strong /> }} />
        </p>
      )}
    </ConfirmDialog>
  )
}
