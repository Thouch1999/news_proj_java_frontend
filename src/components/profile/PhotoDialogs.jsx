import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { UPLOAD_MAX_BYTES } from '../../constants/upload'
import { errorMessage } from '../../utils/errorMessage'
import { mediaUrl } from '../../utils/mediaUrl'
import { rules } from '../../utils/validators'

// A modal with a Cancel and an action button; the action shows a spinner while `busy`
function PhotoModal({ title, busy, actionLabel, actionDisabled, onAction, onCancel, children }) {
  const { t } = useTranslation()
  return (
    <Modal show onHide={busy ? undefined : onCancel} centered>
      <Form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (!actionDisabled && !busy) onAction()
        }}
      >
        <Modal.Header closeButton={!busy} closeLabel={t('common.actions.close')}>
          <Modal.Title className="h5">{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{children}</Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="outline-secondary" onClick={onCancel} disabled={busy}>
            {t('common.actions.cancel')}
          </Button>
          <Button type="submit" disabled={busy || actionDisabled}>
            {busy && <Spinner size="sm" className="me-2" aria-hidden="true" />}
            {actionLabel}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

function PhotoPreview({ src, alt, onError }) {
  return (
    <div className="d-flex justify-content-center mb-3">
      <img src={src} alt={alt} width="160" height="160" className="rounded-circle object-fit-cover profile-photo-preview" onError={onError} />
    </div>
  )
}

// The chosen file with a preview and the backend's limits; "Upload" sends it. `onUpload(file)` returns a promise.
export function UploadPhotoDialog({ file, onUpload, onCancel }) {
  const { t } = useTranslation()
  const problem = rules.imageFile(file)
  const preview = useMemo(() => (problem ? '' : URL.createObjectURL(file)), [file, problem])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  const upload = async () => {
    setBusy(true)
    setError(null)
    try {
      await onUpload(file)
    } catch (caught) {
      setError(caught)
      setBusy(false)
    }
  }

  return (
    <PhotoModal title={t('dashboard.profile.photo.uploadTitle')} busy={busy} actionLabel={busy ? t('dashboard.profile.uploading') : t('dashboard.profile.photo.uploadAction')} actionDisabled={Boolean(problem)} onAction={upload} onCancel={onCancel}>
      {preview && <PhotoPreview src={preview} alt={t('dashboard.profile.photo.previewAlt')} />}
      <p className="text-center text-muted small mb-2">{file.name}</p>
      {problem ? <Alert variant="danger" className="mb-0">{problem}</Alert> : <p className="text-center text-muted small mb-0">{t('dashboard.profile.photo.help', { max: UPLOAD_MAX_BYTES / 1024 / 1024 })}</p>}
      {error && <Alert variant="danger" className="mt-3 mb-0">{errorMessage(error)}</Alert>}
    </PhotoModal>
  )
}

// "Use an image link instead": the link with a preview. `onSave(url)` returns a promise.
export function AvatarUrlDialog({ initial, onSave, onCancel }) {
  const { t } = useTranslation()
  const [url, setUrl] = useState(initial)
  const [broken, setBroken] = useState(null) // the url that did not load
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const link = url.trim()
  const problem = rules.avatar(link)

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      await onSave(link)
    } catch (caught) {
      setError(caught)
      setBusy(false)
    }
  }

  return (
    <PhotoModal title={t('dashboard.profile.photo.linkTitle')} busy={busy} actionLabel={t('dashboard.profile.photo.linkSave')} actionDisabled={!link || Boolean(problem) || broken === link} onAction={save} onCancel={onCancel}>
      <Form.Group controlId="avatar-url">
        <Form.Label>{t('dashboard.profile.photo.linkLabel')}</Form.Label>
        <Form.Control type="url" value={url} isInvalid={Boolean(problem)} placeholder="https://" autoFocus onChange={(event) => setUrl(event.target.value)} />
        <Form.Control.Feedback type="invalid">{problem}</Form.Control.Feedback>
        <Form.Text className="text-muted">{t('dashboard.profile.photo.linkHelp')}</Form.Text>
      </Form.Group>
      {link && !problem && (
        <div className="mt-3" aria-live="polite">
          {broken === link ? (
            <Alert variant="warning" className="mb-0">{t('dashboard.profile.photo.linkFailed')}</Alert>
          ) : (
            <PhotoPreview key={link} src={mediaUrl(link)} alt={t('dashboard.profile.photo.previewAlt')} onError={() => setBroken(link)} />
          )}
        </div>
      )}
      {error && <Alert variant="danger" className="mt-3 mb-0">{errorMessage(error)}</Alert>}
    </PhotoModal>
  )
}
