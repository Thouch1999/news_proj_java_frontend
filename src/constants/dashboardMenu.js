import { Chat, ClockHistory, FileText, Gear, Grid, ListCheck, Newspaper, People, Pencil, Folder, Tag, Shield, Megaphone } from 'react-bootstrap-icons'
import { ROLES } from './roles'
import { ROUTES } from './routes'

// The whole sidebar is defined here: GROUPS (in the order shown) and DASHBOARD_MENU (the entries). `labelKey` is a translation key
// under dashboard.menu; an entry is shown only when the user's role is in `roles`; `group` is the id of its GROUP.
// `badge: 'review'` shows the number of articles waiting for review. `end: true` highlights the entry only on its exact path.
// `icon` is a react-bootstrap-icons component. A group's `icon` is used by its header (the entries of a group have no icon in
// the open menu). buildMenu() turns this into what the sidebar draws: a group with one visible entry becomes that entry alone.
export const MENU_GROUPS = [
  { id: 'overview', labelKey: 'dashboard.menu.groups.overview', icon: Grid },
  { id: 'content', labelKey: 'dashboard.menu.groups.content', icon: Newspaper },
  { id: 'revenue', labelKey: 'dashboard.menu.groups.revenue', icon: Megaphone },
  { id: 'users', labelKey: 'dashboard.menu.groups.users', icon: People },
  { id: 'system', labelKey: 'dashboard.menu.groups.system', icon: Gear },
]

export const DASHBOARD_MENU = [
  { labelKey: 'dashboard.menu.items.dashboard', to: ROUTES.ADMIN, roles: [ROLES.ADMIN], end: true, icon: Grid, group: 'overview' },
  { labelKey: 'dashboard.menu.items.news', to: ROUTES.ADMIN_NEWS, roles: [ROLES.ADMIN], icon: FileText, group: 'content' },
  { labelKey: 'dashboard.menu.items.reviewQueue', to: ROUTES.ADMIN_REVIEW, roles: [ROLES.ADMIN], icon: ListCheck, group: 'content', badge: 'review' },
  { labelKey: 'dashboard.menu.items.comments', to: ROUTES.ADMIN_COMMENTS, roles: [ROLES.ADMIN], icon: Chat, group: 'content' },
  { labelKey: 'dashboard.menu.items.categories', to: ROUTES.ADMIN_CATEGORIES, roles: [ROLES.ADMIN], icon: Folder, group: 'content' },
  { labelKey: 'dashboard.menu.items.tags', to: ROUTES.ADMIN_TAGS, roles: [ROLES.ADMIN], icon: Tag, group: 'content' },
  { labelKey: 'dashboard.menu.items.partners', to: ROUTES.ADMIN_PARTNERS, roles: [ROLES.ADMIN], icon: Megaphone, group: 'revenue' },
  { labelKey: 'dashboard.menu.items.users', to: ROUTES.ADMIN_USERS, roles: [ROLES.ADMIN], icon: People, group: 'users' },
  { labelKey: 'dashboard.menu.items.roles', to: ROUTES.ADMIN_ROLES, roles: [ROLES.ADMIN], icon: Shield, group: 'users' },
  { labelKey: 'dashboard.menu.items.settings', to: ROUTES.ADMIN_SETTINGS, roles: [ROLES.ADMIN], icon: Gear, group: 'system' },
  { labelKey: 'dashboard.menu.items.activityLog', to: ROUTES.ADMIN_ACTIVITY_LOG, roles: [ROLES.ADMIN], icon: ClockHistory, group: 'system' },
  { labelKey: 'dashboard.menu.items.dashboard', to: ROUTES.EDITOR, roles: [ROLES.EDITOR], end: true, icon: Grid, group: 'overview' },
  { labelKey: 'dashboard.menu.items.reviewQueue', to: ROUTES.EDITOR_REVIEW, roles: [ROLES.EDITOR], icon: ListCheck, group: 'content', badge: 'review' },
  { labelKey: 'dashboard.menu.items.allArticles', to: ROUTES.EDITOR_NEWS, roles: [ROLES.EDITOR], icon: FileText, group: 'content' },
  { labelKey: 'dashboard.menu.items.comments', to: ROUTES.EDITOR_COMMENTS, roles: [ROLES.EDITOR], icon: Chat, group: 'content' },
  { labelKey: 'dashboard.menu.items.dashboard', to: ROUTES.AUTHOR, roles: [ROLES.AUTHOR], end: true, icon: Grid, group: 'overview' },
  { labelKey: 'dashboard.menu.items.myArticles', to: ROUTES.AUTHOR_ARTICLES, roles: [ROLES.AUTHOR], icon: FileText, group: 'content' },
  { labelKey: 'dashboard.menu.items.writeArticle', to: ROUTES.AUTHOR_ARTICLE_NEW, roles: [ROLES.AUTHOR], end: true, icon: Pencil, group: 'content' },
]

// The nodes of the sidebar for a user: [{ type: 'item', ...entry } | { type: 'group', id, labelKey, icon, items }]. Entries are
// filtered by role (`allowed(roles)`); a group with no visible entry is left out and a group with exactly ONE is shown as that entry
// (its own icon and label, no header).
export function buildMenu(allowed) {
  const visible = DASHBOARD_MENU.filter((entry) => allowed(entry.roles))
  return MENU_GROUPS.flatMap((group) => {
    const items = visible.filter((entry) => entry.group === group.id)
    if (items.length === 0) return []
    if (items.length === 1) return [{ type: 'item', ...items[0] }]
    return [{ type: 'group', id: group.id, labelKey: group.labelKey, icon: group.icon, items }]
  })
}
