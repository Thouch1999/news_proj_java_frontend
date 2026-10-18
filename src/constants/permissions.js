// The permission names the backend seeds (DataSeeder), grouped by area for the Roles page. `id` is a translation key
// under dashboard.roles.groups; the label of a permission is dashboard.roles.permissions.<NAME>. A permission that is
// not listed here goes in the "other" group.
export const PERMISSION_GROUPS = [
  { id: 'articles', permissions: ['NEWS_CREATE', 'NEWS_SAVE_DRAFT', 'NEWS_EDIT_OWN', 'NEWS_SUBMIT', 'NEWS_STATUS_VIEW', 'NEWS_VIEW_OWN_PUBLISHED', 'NEWS_EDIT', 'NEWS_MANAGE'] },
  { id: 'review', permissions: ['NEWS_VIEW_SUBMITTED', 'NEWS_REVIEW', 'NEWS_APPROVE', 'NEWS_REJECT', 'NEWS_PUBLISH', 'NEWS_ARCHIVE'] },
  { id: 'comments', permissions: ['COMMENT_CREATE', 'COMMENT_MODERATE'] },
  { id: 'taxonomy', permissions: ['CATEGORY_MANAGE', 'TAG_MANAGE'] },
  { id: 'usersRoles', permissions: ['USER_MANAGE', 'ROLE_MANAGE'] },
  { id: 'reports', permissions: ['DASHBOARD_VIEW', 'REPORT_VIEW', 'STATISTICS_VIEW'] },
  { id: 'settings', permissions: ['SETTINGS_MANAGE'] },
  { id: 'reading', permissions: ['NEWS_READ', 'NEWS_SEARCH', 'NEWS_FILTER', 'BOOKMARK_MANAGE', 'PROFILE_MANAGE'] },
]

// Seeded but no code uses it any more: NEWS_APPROVE belonged to the APPROVED status, which was removed (an editor
// publishes a PENDING article directly).
export const UNUSED_PERMISSIONS = ['NEWS_APPROVE']

// Admin has full control: the backend lets ADMIN pass every role check, whatever permissions are listed for it
export const FULL_CONTROL_ROLE = 'ADMIN'
