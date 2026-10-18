import { Button, Modal } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

export default function ConfirmDialog({
  show,
  title,
  children,
  confirmLabel,
  confirmVariant = 'primary',
  busy = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation()
  return (
    <Modal show={show} onHide={busy ? undefined : onCancel} centered>
      <Modal.Header closeButton={!busy} closeLabel={t('common.actions.close')}>
        <Modal.Title className="h5">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCancel} disabled={busy}>
          {t('common.actions.cancel')}
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} disabled={busy || confirmDisabled}>
          {busy ? t('common.working') : (confirmLabel ?? t('common.actions.confirm'))}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
