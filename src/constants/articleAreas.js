import { adminNewsPath, adminReviewPath, authorArticlePath, editorNewsPath, editorReviewPath, ROUTES } from './routes'
import { ROLES } from './roles'

// The article pages are shared. An "area" says where they are shown and what the role may do there:
//  - author: the author's own articles; may edit DRAFT/REJECTED only, submit them for review and delete an own DRAFT
//  - editor: every article (`staff`); reviews the queue, edits any article that is not ARCHIVED, archives PUBLISHED ones
//  - admin:  every article (`staff`); may edit any status, publish a draft directly, restore and delete any article
export const ARTICLE_AREAS = {
  author: {
    role: ROLES.AUTHOR,
    admin: false,
    staff: false,
    title: 'My articles',
    listPath: ROUTES.AUTHOR_ARTICLES,
    newPath: ROUTES.AUTHOR_ARTICLE_NEW,
    editPath: authorArticlePath,
    backLabel: 'Back to my articles',
  },
  editor: {
    role: ROLES.EDITOR,
    admin: false,
    staff: true,
    title: 'All articles',
    listPath: ROUTES.EDITOR_NEWS,
    newPath: null,
    editPath: editorNewsPath,
    queuePath: ROUTES.EDITOR_REVIEW,
    reviewPath: editorReviewPath,
    backLabel: 'Back to all articles',
  },
  admin: {
    role: ROLES.ADMIN,
    admin: true,
    staff: true,
    title: 'All articles',
    listPath: ROUTES.ADMIN_NEWS,
    newPath: ROUTES.ADMIN_NEWS_NEW,
    editPath: adminNewsPath,
    queuePath: ROUTES.ADMIN_REVIEW,
    reviewPath: adminReviewPath,
    backLabel: 'Back to all articles',
  },
}
