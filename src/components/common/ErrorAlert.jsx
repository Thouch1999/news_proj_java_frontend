import { Alert } from 'react-bootstrap'
import { errorMessage } from '../../utils/errorMessage'

// Shows the backend message of a failed service call (an ApiError), or a plain text message.
export default function ErrorAlert({ error, message, variant = 'danger' }) {
  const text = message ?? (error ? errorMessage(error) : null)
  if (!text) {
    return null
  }
  return <Alert variant={variant}>{text}</Alert>
}
