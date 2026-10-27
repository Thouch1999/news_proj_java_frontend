import { ROLES } from './roles'

// Values match the backend NewsStatus enum. `variant` is the Bootstrap color used for the badge.
export const NEWS_STATUS = {
  DRAFT: { value: 'DRAFT', labelKey: 'news.status.DRAFT', variant: 'secondary' },
  PENDING: { value: 'PENDING', labelKey: 'news.status.PENDING', variant: 'warning' },
  SCHEDULED: { value: 'SCHEDULED', labelKey: 'news.status.SCHEDULED', variant: 'info' },
  PUBLISHED: { value: 'PUBLISHED', labelKey: 'news.status.PUBLISHED', variant: 'success' },
  REJECTED: { value: 'REJECTED', labelKey: 'news.status.REJECTED', variant: 'danger' },
  ARCHIVED: { value: 'ARCHIVED', labelKey: 'news.status.ARCHIVED', variant: 'dark' },
}

// The page sizes of the article list (the backend allows 1-50)
export const ARTICLE_PAGE_SIZES = [10, 20, 50]

// The editorial workflow actions (keys match newsService.runWorkflowAction).
export const WORKFLOW_ACTIONS = {
  submit: { labelKey: 'news.workflow.actions.submit', variant: 'primary', doneKey: 'news.workflow.done.submit' },
  publish: { labelKey: 'news.workflow.actions.publish', variant: 'success', doneKey: 'news.workflow.done.publish' },
  schedule: { labelKey: 'news.workflow.actions.schedule', variant: 'outline-primary', doneKey: 'news.workflow.done.schedule' },
  reschedule: { labelKey: 'news.workflow.actions.reschedule', variant: 'outline-primary', doneKey: 'news.workflow.done.reschedule' },
  unschedule: { labelKey: 'news.workflow.actions.unschedule', variant: 'outline-danger', doneKey: 'news.workflow.done.unschedule' },
  reject: { labelKey: 'news.workflow.actions.reject', variant: 'danger', doneKey: 'news.workflow.done.reject' },
  archive: { labelKey: 'news.workflow.actions.archive', variant: 'outline-dark', doneKey: 'news.workflow.done.archive' },
  restore: { labelKey: 'news.workflow.actions.restore', variant: 'outline-success', doneKey: 'news.workflow.done.restore' },
}

// The actions that are valid for a role on an article in `status` (mirrors the backend rules, which still decide):
//  - AUTHOR: submit an own DRAFT or REJECTED article
//  - EDITOR: publish or reject a PENDING article, archive a PUBLISHED one
//  - ADMIN: the same, plus "publish now" for a DRAFT and restore for an ARCHIVED article
//  - EDITOR and ADMIN: schedule a PENDING article (an ADMIN also a DRAFT); for a SCHEDULED one change the time, publish now
//    or cancel the schedule (back to PENDING)
// Returns [{ key, labelKey, variant }] (labelKey is a translation key: t(labelKey)).
export function workflowActions(role, status) {
  const keys = []
  if (role === ROLES.AUTHOR) {
    if (status === 'DRAFT' || status === 'REJECTED') keys.push('submit')
  } else if (role === ROLES.EDITOR || role === ROLES.ADMIN) {
    if (status === 'PENDING') keys.push('publish', 'schedule', 'reject')
    if (status === 'DRAFT' && role === ROLES.ADMIN) keys.push('publish', 'schedule')
    if (status === 'SCHEDULED') keys.push('publish', 'reschedule', 'unschedule')
    if (status === 'PUBLISHED') keys.push('archive')
    if (status === 'ARCHIVED' && role === ROLES.ADMIN) keys.push('restore')
  }
  return keys.map((key) => ({
    key,
    labelKey: key === 'publish' && (status === 'DRAFT' || status === 'SCHEDULED') ? 'news.workflow.actions.publishNow' : WORKFLOW_ACTIONS[key].labelKey,
    variant: WORKFLOW_ACTIONS[key].variant,
  }))
}
