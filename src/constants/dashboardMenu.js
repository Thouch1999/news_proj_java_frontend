import { ROLES } from './roles'
import { ROUTES } from './routes'

// Sidebar entries. An entry is shown only when the user's role is in `roles`.
// `end: true` highlights the entry only on its exact path (not on child pages).
export const DASHBOARD_MENU = [
  { label: 'Admin dashboard', to: ROUTES.ADMIN, roles: [ROLES.ADMIN], end: true },
  { label: 'Users', to: ROUTES.ADMIN_USERS, roles: [ROLES.ADMIN] },
  { label: 'News', to: ROUTES.ADMIN_NEWS, roles: [ROLES.ADMIN] },
  { label: 'Review queue', to: ROUTES.ADMIN_REVIEW, roles: [ROLES.ADMIN] },
  { label: 'Roles', to: ROUTES.ADMIN_ROLES, roles: [ROLES.ADMIN] },
  { label: 'Categories', to: ROUTES.ADMIN_CATEGORIES, roles: [ROLES.ADMIN] },
  { label: 'Tags', to: ROUTES.ADMIN_TAGS, roles: [ROLES.ADMIN] },
  { label: 'Editor dashboard', to: ROUTES.EDITOR, roles: [ROLES.EDITOR], end: true },
  { label: 'Review queue', to: ROUTES.EDITOR_REVIEW, roles: [ROLES.EDITOR] },
  { label: 'All articles', to: ROUTES.EDITOR_NEWS, roles: [ROLES.EDITOR] },
  { label: 'Author dashboard', to: ROUTES.AUTHOR, roles: [ROLES.AUTHOR], end: true },
  { label: 'My articles', to: ROUTES.AUTHOR_ARTICLES, roles: [ROLES.AUTHOR] },
  { label: 'Write an article', to: ROUTES.AUTHOR_ARTICLE_NEW, roles: [ROLES.AUTHOR], end: true },
  { label: 'My profile', to: ROUTES.PROFILE, roles: Object.values(ROLES), end: true },
  { label: 'Back to site', to: ROUTES.HOME, roles: Object.values(ROLES), end: true },
]
