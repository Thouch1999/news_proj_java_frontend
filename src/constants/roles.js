import { ClipboardCheck, Pencil, Person, ShieldCheck } from 'react-bootstrap-icons'

export const ROLES = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  AUTHOR: 'AUTHOR',
  READER: 'READER',
}

// The roles in the order they are offered (Add user page): an admin may create an account with any of the four. The page
// asks the roles endpoint which exist and falls back to this list when the request fails.
export const ROLE_ORDER = [ROLES.ADMIN, ROLES.EDITOR, ROLES.AUTHOR, ROLES.READER]

export const ROLE_ICON = { ADMIN: ShieldCheck, EDITOR: ClipboardCheck, AUTHOR: Pencil, READER: Person }
