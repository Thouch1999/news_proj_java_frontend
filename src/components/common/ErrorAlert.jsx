import { Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useRetryAfter } from '../../hooks/useRetryAfter'
import { errorMessage } from '../../utils/errorMessage'
import { hasRetry } from '../../utils/retryAfter'

// Shows the backend message of a failed service call (an ApiError), or a plain text message.
// useTranslation makes the alert follow a language change.
// An error with a "try again" time (too many attempts, a locked account, an account that is too new) is a warning with a
// live countdown ("Try again in 12:30"); it goes away when the countdown ends. A screen reader reads the sentence once
// (with the whole time), not every second.
export default function ErrorAlert({ error, message, variant = 'danger' }) {
  useTranslation()
  const remaining = useRetryAfter(error)
  if (!message && hasRetry(error)) {
    if (remaining === 0) {
      return null
    }
    return (
      <Alert variant="warning" role="status">
        <span aria-hidden="true">{errorMessage(error, remaining)}</span>
        <span className="visually-hidden">{errorMessage(error, error.retryAfterSeconds)}</span>
      </Alert>
    )
  }
  const text = message ?? (error ? errorMessage(error) : null)
  if (!text) {
    return null
  }
  return <Alert variant={variant}>{text}</Alert>
}
