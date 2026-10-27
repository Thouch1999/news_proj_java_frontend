import { Route, Routes } from 'react-router-dom'
import { ROLES } from '../constants/roles'
import { ROUTES } from '../constants/routes'
import AuthLayout from '../layouts/AuthLayout'
import DashboardLayout from '../layouts/DashboardLayout'
import PublicLayout from '../layouts/PublicLayout'
import BookmarksPage from '../pages/account/BookmarksPage'
import DashboardNotificationsPage from '../pages/account/DashboardNotificationsPage'
import DashboardProfilePage from '../pages/account/DashboardProfilePage'
import NotificationsPage from '../pages/account/NotificationsPage'
import ProfilePage from '../pages/account/ProfilePage'
import ActivityLogPage from '../pages/admin/ActivityLogPage'
import AdminHomePage from '../pages/admin/AdminHomePage'
import CategoriesPage from '../pages/admin/CategoriesPage'
import TagsPage from '../pages/admin/TagsPage'
import NewsEditorPage from '../pages/admin/NewsEditorPage'
import AdminNewsListPage from '../pages/admin/NewsListPage'
import AdminReviewPage from '../pages/admin/ReviewPage'
import AdminReviewQueuePage from '../pages/admin/ReviewQueuePage'
import PartnerEditorPage from '../pages/admin/PartnerEditorPage'
import PartnersPage from '../pages/admin/PartnersPage'
import PartnerStatsPage from '../pages/admin/PartnerStatsPage'
import RolesPage from '../pages/admin/RolesPage'
import SettingsPage from '../pages/admin/SettingsPage'
import UserCreatePage from '../pages/admin/UserCreatePage'
import UserDetailPage from '../pages/admin/UserDetailPage'
import UsersPage from '../pages/admin/UsersPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'
import VerifyEmailPage from '../pages/auth/VerifyEmailPage'
import ArticleEditorPage from '../pages/author/ArticleEditorPage'
import AuthorHomePage from '../pages/author/AuthorHomePage'
import MyArticlesPage from '../pages/author/MyArticlesPage'
import AdminCommentsPage from '../pages/admin/CommentsPage'
import EditorCommentsPage from '../pages/editor/CommentsPage'
import EditorAllArticlesPage from '../pages/editor/AllArticlesPage'
import EditorArticleEditorPage from '../pages/editor/ArticleEditorPage'
import EditorHomePage from '../pages/editor/EditorHomePage'
import EditorReviewPage from '../pages/editor/ReviewPage'
import EditorReviewQueuePage from '../pages/editor/ReviewQueuePage'
import ForbiddenPage from '../pages/errors/ForbiddenPage'
import NotFoundPage from '../pages/errors/NotFoundPage'
import CategoryPage from '../pages/public/CategoryPage'
import HomePage from '../pages/public/HomePage'
import NewsDetailPage from '../pages/public/NewsDetailPage'
import NewsListPage from '../pages/public/NewsListPage'
import TagPage from '../pages/public/TagPage'
import RequireAuth from './RequireAuth'

export default function AppRoutes() {
  return (
    <Routes>
      {/* public */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.NEWS} element={<NewsListPage />} />
        <Route path="/news/:slug" element={<NewsDetailPage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/tag/:slug" element={<TagPage />} />
        <Route path={ROUTES.FORBIDDEN} element={<ForbiddenPage />} />
        {/* logged-in, any role */}
        <Route element={<RequireAuth />}>
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.BOOKMARKS} element={<BookmarksPage />} />
          <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
      </Route>

      {/* role routes: not logged in -> login, wrong role -> 403 */}
      {/* the profile of the staff roles, inside the dashboard layout */}
      <Route element={<RequireAuth roles={[ROLES.ADMIN, ROLES.EDITOR, ROLES.AUTHOR]} />}>
        <Route element={<DashboardLayout />}>
          <Route path={ROUTES.DASHBOARD_PROFILE} element={<DashboardProfilePage />} />
          <Route path={ROUTES.DASHBOARD_NOTIFICATIONS} element={<DashboardNotificationsPage />} />
        </Route>
      </Route>
      <Route element={<RequireAuth roles={[ROLES.AUTHOR]} />}>
        <Route path={ROUTES.AUTHOR} element={<DashboardLayout />}>
          <Route index element={<AuthorHomePage />} />
          <Route path="articles" element={<MyArticlesPage />} />
          <Route path="articles/new" element={<ArticleEditorPage />} />
          <Route path="articles/:id" element={<ArticleEditorPage />} />
        </Route>
      </Route>
      <Route element={<RequireAuth roles={[ROLES.EDITOR]} />}>
        <Route path={ROUTES.EDITOR} element={<DashboardLayout />}>
          <Route index element={<EditorHomePage />} />
          <Route path="review" element={<EditorReviewQueuePage />} />
          <Route path="review/:id" element={<EditorReviewPage />} />
          <Route path="news" element={<EditorAllArticlesPage />} />
          <Route path="news/:id" element={<EditorArticleEditorPage />} />
          <Route path="comments" element={<EditorCommentsPage />} />
        </Route>
      </Route>
      <Route element={<RequireAuth roles={[ROLES.ADMIN]} />}>
        <Route path={ROUTES.ADMIN} element={<DashboardLayout />}>
          <Route index element={<AdminHomePage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/new" element={<UserCreatePage />} />
          <Route path="users/:id" element={<UserDetailPage />} />
          <Route path="news" element={<AdminNewsListPage />} />
          <Route path="news/new" element={<NewsEditorPage />} />
          <Route path="news/:id" element={<NewsEditorPage />} />
          <Route path="review" element={<AdminReviewQueuePage />} />
          <Route path="review/:id" element={<AdminReviewPage />} />
          <Route path="comments" element={<AdminCommentsPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="tags" element={<TagsPage />} />
          <Route path="partners" element={<PartnersPage />} />
          <Route path="partners/new" element={<PartnerEditorPage />} />
          <Route path="partners/:id" element={<PartnerEditorPage />} />
          <Route path="partners/:id/stats" element={<PartnerStatsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="activity-log" element={<ActivityLogPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
