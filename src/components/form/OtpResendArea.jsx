import { Alert, Button } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import ResendButton from './ResendButton'

// Under the code boxes: the "Resend code" link with its countdown, or, once the code has expired, the message and the
// primary "Send a new code" button.
export default function OtpResendArea({ expired, remaining, onResend, disabled = false }) {
  const { t } = useTranslation()
  if (expired) {
    return (
      <div className="mt-3">
        <Alert variant="warning" className="mb-2">
          {t('auth.pending.expired')}
        </Alert>
        <Button type="button" className="w-100" onClick={onResend} disabled={disabled || remaining > 0}>
          {remaining > 0 ? t('auth.otp.resendIn', { seconds: remaining }) : t('auth.pending.sendNew')}
        </Button>
      </div>
    )
  }
  return (
    <div className="text-center mt-2">
      <ResendButton remaining={remaining} onClick={onResend} disabled={disabled} />
    </div>
  )
}
