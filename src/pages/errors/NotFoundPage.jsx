import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

export default function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className="text-center py-5">
      <h1 className="display-4">404</h1>
      <p className="text-muted">{t('errors.notFound.message')}</p>
      <Link to={ROUTES.HOME}>{t('errors.backHome')}</Link>
    </div>
  )
}
