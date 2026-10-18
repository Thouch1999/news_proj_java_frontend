import { useRef, useState } from 'react'
import { Alert, Button, Card } from 'react-bootstrap'
import { Trash, Upload } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import ConfirmDialog from '../common/ConfirmDialog'
import ErrorAlert from '../common/ErrorAlert'
import * as settingsService from '../../services/settingsService'
import { mediaUrl } from '../../utils/mediaUrl'
import { validateSettingsImage } from '../../utils/settingsValidation'

// One site image (logo, dark logo, favicon or share image): a preview, "Upload" / "Replace" and "Remove". An upload or a
// removal is saved at once (it is not part of the "Save changes" of a tab). `path` is the saved value (/uploads/...) or
// '' for none; `onChanged({ [settingKey]: newPath })` tells the page. `darkPreview` shows the image on a dark background
// (the dark logo is made for it).
export default function ImageSettingCard({ type, settingKey, group, title, help, path, onChanged, darkPreview = false }) {
  const { t } = useTranslation()
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState('')
  const [apiError, setApiError] = useState(null)
  const [message, setMessage] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [brokenPath, setBrokenPath] = useState(null)
  const accept = type === 'favicon' ? 'image/png,image/jpeg,image/webp,image/x-icon,.ico' : 'image/png,image/jpeg,image/webp'
  const src = path && brokenPath !== path ? mediaUrl(path) : ''

  const upload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = '' // the same file can be chosen again
    if (!file) return
    setApiError(null)
    setMessage('')
    const found = validateSettingsImage(file, type)
    setProblem(found)
    if (found) return
    setBusy(true)
    try {
      const result = await settingsService.uploadSettingsImage(type, file)
      onChanged({ [settingKey]: result[settingKey] })
      setMessage('uploaded')
    } catch (error) {
      setApiError(error)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    setApiError(null)
    setMessage('')
    try {
      await settingsService.updateSettings(group, { [settingKey]: '' })
      onChanged({ [settingKey]: '' })
      setMessage('removed')
      setConfirmRemove(false)
    } catch (error) {
      setApiError(error)
      setConfirmRemove(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="h-100">
      <Card.Body className="d-flex flex-column">
        <Card.Title as="h3" className="h6">
          {title}
        </Card.Title>
        <div
          className={`settings-image-preview rounded border d-flex align-items-center justify-content-center mb-2 ${darkPreview ? 'is-dark' : ''}`}
          style={{ minHeight: 96 }}
        >
          {src ? (
            <img src={src} alt={t('dashboard.settings.images.preview', { name: title })} className="site-logo" style={{ maxHeight: 80 }} onError={() => setBrokenPath(path)} />
          ) : (
            <span className="small text-muted p-2 text-center">{path ? t('dashboard.settings.images.broken') : t('dashboard.settings.images.none')}</span>
          )}
        </div>
        <p className="small text-muted mb-2">{help}</p>
        <div className="mt-auto d-flex flex-wrap gap-2">
          <input ref={input} type="file" accept={accept} className="d-none" onChange={upload} aria-label={t('dashboard.settings.images.choose', { name: title })} />
          <Button variant="outline-primary" size="sm" disabled={busy} onClick={() => input.current?.click()}>
            <Upload className="me-1" aria-hidden="true" />
            {busy ? t('dashboard.settings.images.uploading') : path ? t('dashboard.settings.images.replace') : t('dashboard.settings.images.upload')}
          </Button>
          {path && (
            <Button variant="outline-secondary" size="sm" disabled={busy} onClick={() => setConfirmRemove(true)}>
              <Trash className="me-1" aria-hidden="true" />
              {t('dashboard.settings.images.remove')}
            </Button>
          )}
        </div>
        {problem && <div className="text-danger small mt-2">{problem}</div>}
        <div className="mt-2">
          <ErrorAlert error={apiError} />
        </div>
        {message && (
          <Alert variant="success" className="small py-2 mt-2 mb-0">
            {t(`dashboard.settings.images.${message}`)}
          </Alert>
        )}
      </Card.Body>
      <ConfirmDialog
        show={confirmRemove}
        title={t('dashboard.settings.images.removeTitle')}
        confirmLabel={t('dashboard.settings.images.remove')}
        confirmVariant="danger"
        busy={busy}
        onCancel={() => setConfirmRemove(false)}
        onConfirm={remove}
      >
        {t('dashboard.settings.images.removeBody', { name: title })}
      </ConfirmDialog>
    </Card>
  )
}
