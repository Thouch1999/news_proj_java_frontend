import { ROLES } from '../constants/roles'

// Why an action on `user` is not possible for the logged-in admin `me`, or null when it is. The backend refuses the same
// actions; this only says it before the click. Only the super admin touches admins; nobody touches the super admin.
export function guardsFor(t, user, isSelf, me) {
  const onlySuper = user.role === ROLES.ADMIN && !user.superAdmin && !me?.superAdmin ? t('users.superAdmin.onlySuperAdmin') : null
  return {
    role: user.superAdmin ? t('users.superAdmin.cannotChangeRole') : isSelf ? t('users.detail.cannotChangeSelf') : onlySuper,
    password: user.superAdmin ? t('users.superAdmin.cannotResetPassword') : onlySuper && !isSelf ? onlySuper : null,
    deactivate: user.superAdmin ? t('users.superAdmin.cannotDeactivate') : isSelf ? t('users.detail.cannotDeactivateSelf') : onlySuper,
  }
}
