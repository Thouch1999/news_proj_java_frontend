import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

export default function NotFoundPage() {
  return (
    <div className="text-center py-5">
      <h1 className="display-4">404</h1>
      <p className="text-muted">Page not found.</p>
      <Link to={ROUTES.HOME}>Back to home</Link>
    </div>
  )
}
