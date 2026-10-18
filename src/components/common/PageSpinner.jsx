import { Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

export default function PageSpinner() {
  const { t } = useTranslation()
  return (
    <div className="d-flex justify-content-center align-items-center py-5">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">{t('common.loading')}</span>
      </Spinner>
    </div>
  )
}
