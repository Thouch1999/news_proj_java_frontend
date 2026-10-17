import { Link } from 'react-router-dom'
import { HOME_BY_ROLE, ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'

export default function ForbiddenPage() {
  const { user } = useAuth()
  const backTo = user ? HOME_BY_ROLE[user.role] : ROUTES.HOME

  return (
    <div className="text-center py-5">
      <h1 className="display-4">403</h1>
      <p className="text-muted">You do not have permission to view this page.</p>
      <Link to={backTo}>{user ? 'Back to my area' : 'Back to home'}</Link>
    </div>
  )
}
