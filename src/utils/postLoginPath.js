import { HOME_BY_ROLE, ROUTES } from '../constants/routes'
import { ROLES } from '../constants/roles'

// ADMIN/EDITOR/AUTHOR go to their dashboard. A READER goes back to the page they came from, or home.
export function postLoginPath(user, from) {
  if (user.role === ROLES.READER) {
    return from?.pathname ?? ROUTES.HOME
  }
  return HOME_BY_ROLE[user.role] ?? ROUTES.HOME
}
