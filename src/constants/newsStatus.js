import { ROLES } from './roles'

// Values match the backend NewsStatus enum. `variant` is the Bootstrap color used for the badge.
export const NEWS_STATUS = {
  DRAFT: { value: 'DRAFT', label: 'Draft', variant: 'secondary' },
  PENDING: { value: 'PENDING', label: 'Pending review', variant: 'warning' },
  PUBLISHED: { value: 'PUBLISHED', label: 'Published', variant: 'success' },
  REJECTED: { value: 'REJECTED', label: 'Rejected', variant: 'danger' },
  ARCHIVED: { value: 'ARCHIVED', label: 'Archived', variant: 'dark' },
}

// The editorial workflow actions (keys match newsService.runWorkflowAction).
export const WORKFLOW_ACTIONS = {
  submit: { label: 'Submit for review', variant: 'primary', done: 'Submitted for review.' },
  publish: { label: 'Publish', variant: 'success', done: 'Article published.' },
  reject: { label: 'Reject', variant: 'danger', done: 'Article rejected.' },
  archive: { label: 'Archive', variant: 'outline-dark', done: 'Article archived.' },
  restore: { label: 'Restore', variant: 'outline-success', done: 'Article restored and published again.' },
}

// The actions that are valid for a role on an article in `status` (mirrors the backend rules, which still decide):
//  - AUTHOR: submit an own DRAFT or REJECTED article
//  - EDITOR: publish or reject a PENDING article, archive a PUBLISHED one
//  - ADMIN: the same, plus "publish now" for a DRAFT and restore for an ARCHIVED article
// Returns [{ key, label, variant }].
export function workflowActions(role, status) {
  const keys = []
  if (role === ROLES.AUTHOR) {
    if (status === 'DRAFT' || status === 'REJECTED') keys.push('submit')
  } else if (role === ROLES.EDITOR || role === ROLES.ADMIN) {
    if (status === 'PENDING') keys.push('publish', 'reject')
    if (status === 'DRAFT' && role === ROLES.ADMIN) keys.push('publish')
    if (status === 'PUBLISHED') keys.push('archive')
    if (status === 'ARCHIVED' && role === ROLES.ADMIN) keys.push('restore')
  }
  return keys.map((key) => ({
    key,
    label: key === 'publish' && status === 'DRAFT' ? 'Publish now' : WORKFLOW_ACTIONS[key].label,
    variant: WORKFLOW_ACTIONS[key].variant,
  }))
}
