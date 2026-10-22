import { Chat, ClockHistory, FileText, Gear, Grid, ListCheck, People, Pencil, Folder, Tag, Shield } from 'react-bootstrap-icons'
import { ROLES } from './roles'
import { ROUTES } from './routes'

// Sidebar entries (`labelKey` and the group ids are translation keys under dashboard.menu), shown in the order of GROUPS. An entry is shown only when the user's role is in `roles`.
// `badge: 'review'` shows the number of articles waiting for review next to the entry.
// `end: true` highlights the entry only on its exact path (not on child pages). `icon` is a react-bootstrap-icons component.
export const MENU_GROUPS = ['overview', 'content', 'users', 'system']

export const DASHBOARD_MENU = [
  { labelKey: 'dashboard.menu.items.dashboard', to: ROUTES.ADMIN, roles: [ROLES.ADMIN], end: true, icon: Grid, group: 'overview' },
  { labelKey: 'dashboard.menu.items.news', to: ROUTES.ADMIN_NEWS, roles: [ROLES.ADMIN], icon: FileText, group: 'content' },
  { labelKey: 'dashboard.menu.items.reviewQueue', to: ROUTES.ADMIN_REVIEW, roles: [ROLES.ADMIN], icon: ListCheck, group: 'content', badge: 'review' },
  { labelKey: 'dashboard.menu.items.comments', to: ROUTES.ADMIN_COMMENTS, roles: [ROLES.ADMIN], icon: Chat, group: 'content' },
  { labelKey: 'dashboard.menu.items.categories', to: ROUTES.ADMIN_CATEGORIES, roles: [ROLES.ADMIN], icon: Folder, group: 'content' },
  { labelKey: 'dashboard.menu.items.tags', to: ROUTES.ADMIN_TAGS, roles: [ROLES.ADMIN], icon: Tag, group: 'content' },
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
