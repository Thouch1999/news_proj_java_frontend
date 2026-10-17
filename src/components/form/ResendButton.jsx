import { Button } from 'react-bootstrap'

// "Resend code" button that is disabled while the countdown runs.
export default function ResendButton({ remaining, onClick, disabled = false }) {
  const waiting = remaining > 0
  return (
    <Button variant="link" type="button" onClick={onClick} disabled={waiting || disabled}>
      {waiting ? `Resend code in ${remaining}s` : 'Resend code'}
    </Button>
  )
}
