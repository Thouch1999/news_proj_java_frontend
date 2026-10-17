export const ROLES = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  AUTHOR: 'AUTHOR',
  READER: 'READER',
}

// Bootstrap badge color per role
export const ROLE_VARIANT = {
  ADMIN: 'danger',
  EDITOR: 'primary',
  AUTHOR: 'info',
  READER: 'secondary',
}

// Roles an admin may give when creating an account (the backend only accepts these two)
export const CREATABLE_ROLES = [ROLES.AUTHOR, ROLES.EDITOR]
