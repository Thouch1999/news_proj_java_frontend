import { Button } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

// "Resend code" button that is disabled while the countdown runs.
export default function ResendButton({ remaining, onClick, disabled = false }) {
  const { t } = useTranslation()
  const waiting = remaining > 0
  return (
    <Button variant="link" type="button" onClick={onClick} disabled={waiting || disabled}>
      {waiting ? t('auth.otp.resendIn', { seconds: remaining }) : t('auth.otp.resend')}
    </Button>
  )
}
