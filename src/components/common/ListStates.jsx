import { Alert, Button, Placeholder } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { errorMessage } from '../../utils/errorMessage'

// The three states every list page has besides its rows, in the same look: empty (an icon, a message and an optional
// button), failed (the message and "Try again") and loading (grey rows).

export function EmptyState({ icon: Icon, text, children }) {
  return (
    <div className="d-flex flex-column align-items-center text-center text-muted py-5 px-3">
      <Icon size={36} aria-hidden="true" className="mb-2" />
      <p className="mb-3">{text}</p>
      {children}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  const { t } = useTranslation()
  return (
    <div className="p-4 text-center">
      <Alert variant="danger" className="d-inline-block mb-3">
        {errorMessage(error)}
      </Alert>
      <div>
        <Button variant="outline-primary" size="sm" onClick={onRetry}>
          {t('common.actions.retry')}
        </Button>
      </div>
    </div>
  )
}

export function RowsSkeleton({ rows = 5 }) {
  const { t } = useTranslation()
  return (
    <div role="status">
      <span className="visually-hidden">{t('common.loading')}</span>
      <Placeholder as="div" animation="glow" aria-hidden="true">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="d-flex align-items-center gap-3 px-3 py-3 comment-skeleton-row">
            <div className="flex-grow-1">
              <Placeholder xs={6} md={3} className="d-block mb-1" />
              <Placeholder xs={4} md={2} size="sm" className="d-block" />
            </div>
            <Placeholder xs={2} className="d-none d-md-block" />
            <Placeholder xs={1} />
          </div>
        ))}
      </Placeholder>
    </div>
  )
}
