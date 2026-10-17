import { ROLES } from './roles'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  PROFILE: '/profile',
  FORBIDDEN: '/403',
  AUTHOR: '/author',
  AUTHOR_ARTICLES: '/author/articles',
  AUTHOR_ARTICLE_NEW: '/author/articles/new',
  EDITOR: '/editor',
  EDITOR_REVIEW: '/editor/review',
  EDITOR_NEWS: '/editor/news',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_NEW: '/admin/users/new',
  ADMIN_ROLES: '/admin/roles',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_TAGS: '/admin/tags',
  ADMIN_NEWS: '/admin/news',
  ADMIN_REVIEW: '/admin/review',
  ADMIN_NEWS_NEW: '/admin/news/new',
}

export const authorArticlePath = (id) => `/author/articles/${id}`

export const editorReviewPath = (id) => `/editor/review/${id}`

export const editorNewsPath = (id) => `/editor/news/${id}`

export const adminReviewPath = (id) => `/admin/review/${id}`

export const adminNewsPath = (id) => `/admin/news/${id}`

export const adminUserPath = (id) => `/admin/users/${id}`

// Where each role lands after login.
export const HOME_BY_ROLE = {
  [ROLES.ADMIN]: ROUTES.ADMIN,
  [ROLES.EDITOR]: ROUTES.EDITOR,
  [ROLES.AUTHOR]: ROUTES.AUTHOR,
  [ROLES.READER]: ROUTES.HOME,
}
