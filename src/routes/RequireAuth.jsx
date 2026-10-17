import { Navigate, Outlet, useLocation } from 'react-router-dom'
import PageSpinner from '../components/common/PageSpinner'
import { ROUTES } from '../constants/routes'
import { useAuth } from '../hooks/useAuth'

// Logged-in route: not logged in -> login. With `roles`, a logged-in user of another role -> 403.
export default function RequireAuth({ roles }) {
  const { isAuthenticated, isLoading, hasAnyRole } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <PageSpinner />
  }
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />
  }
  if (roles && !hasAnyRole(roles)) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />
  }
  return <Outlet />
}
