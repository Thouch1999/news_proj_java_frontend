import { ClipboardCheck, Pencil, Person, ShieldCheck } from 'react-bootstrap-icons'

export const ROLES = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  AUTHOR: 'AUTHOR',
  READER: 'READER',
}

// Roles an admin may give when creating an account (the backend only accepts these two)
export const CREATABLE_ROLES = [ROLES.AUTHOR, ROLES.EDITOR]

export const ROLE_ICON = { ADMIN: ShieldCheck, EDITOR: ClipboardCheck, AUTHOR: Pencil, READER: Person }
