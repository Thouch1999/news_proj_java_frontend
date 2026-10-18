import { Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { errorMessage } from '../../utils/errorMessage'

// Shows the backend message of a failed service call (an ApiError), or a plain text message.
// useTranslation makes the alert follow a language change.
export default function ErrorAlert({ error, message, variant = 'danger' }) {
  useTranslation()
  const text = message ?? (error ? errorMessage(error) : null)
  if (!text) {
    return null
  }
  return <Alert variant={variant}>{text}</Alert>
}
