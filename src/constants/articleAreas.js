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
    titleKey: 'news.areas.myArticles',
    descriptionKey: 'news.areas.myArticlesText',
    listPath: ROUTES.AUTHOR_ARTICLES,
    newPath: ROUTES.AUTHOR_ARTICLE_NEW,
    editPath: authorArticlePath,
    backLabelKey: 'news.areas.backToMyArticles',
  },
  editor: {
    role: ROLES.EDITOR,
    admin: false,
    staff: true,
    titleKey: 'news.areas.allArticles',
    descriptionKey: 'news.areas.allArticlesText',
    listPath: ROUTES.EDITOR_NEWS,
    newPath: null,
    editPath: editorNewsPath,
    queuePath: ROUTES.EDITOR_REVIEW,
    commentsPath: ROUTES.EDITOR_COMMENTS,
    reviewPath: editorReviewPath,
    backLabelKey: 'news.areas.backToAllArticles',
  },
  admin: {
    role: ROLES.ADMIN,
    admin: true,
    staff: true,
    titleKey: 'news.areas.allArticles',
    descriptionKey: 'news.areas.allArticlesText',
    listPath: ROUTES.ADMIN_NEWS,
    newPath: ROUTES.ADMIN_NEWS_NEW,
    editPath: adminNewsPath,
    queuePath: ROUTES.ADMIN_REVIEW,
    commentsPath: ROUTES.ADMIN_COMMENTS,
    reviewPath: adminReviewPath,
    backLabelKey: 'news.areas.backToAllArticles',
  },
}
