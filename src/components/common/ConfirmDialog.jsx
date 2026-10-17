import { Button, Modal } from 'react-bootstrap'

export default function ConfirmDialog({
  show,
  title,
  children,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  busy = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal show={show} onHide={busy ? undefined : onCancel} centered>
      <Modal.Header closeButton={!busy}>
        <Modal.Title className="h5">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} disabled={busy || confirmDisabled}>
          {busy ? 'Working...' : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
