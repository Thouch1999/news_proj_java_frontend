import { useRef, useState } from 'react'
import { Alert, Button, ButtonGroup, Card, Form, Spinner } from 'react-bootstrap'
import { ArrowLeft, ArrowRight, Check2, Trash, X } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import ConfirmDialog from '../common/ConfirmDialog'
import DropZone from '../common/DropZone'
import ErrorAlert from '../common/ErrorAlert'
import { MAX_IMAGES_PER_NEWS } from '../../constants/upload'
import { useFormat } from '../../hooks/useFormat'
import * as newsService from '../../services/newsService'
import { errorMessage } from '../../utils/errorMessage'
import { mediaUrl } from '../../utils/mediaUrl'
import { rules } from '../../utils/validators'

// The thumbnail card and the images card of the article page. Both work on a saved article (the files belong to its id);
// `editable` is false in the read-only view. A change is sent to the backend at once; the parent gets the new value
// through onThumbnailChange(path) / onImagesChange(images or a function of the current images).

// ---- thumbnail ----

export function ThumbnailCard({ newsId, thumbnail, editable, saved = true, onThumbnailChange }) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [fileError, setFileError] = useState('')
  const replaceInput = useRef(null)

  const upload = async (file) => {
    const problem = rules.imageFile(file)
    setFileError(problem)
    setError(null)
    if (problem) return
    setBusy(true)
    try {
      onThumbnailChange((await newsService.setNewsThumbnail(newsId, file)).thumbnail)
    } catch (caught) {
      setError(caught)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    setError(null)
    setFileError('')
    try {
      onThumbnailChange((await newsService.removeNewsThumbnail(newsId)).thumbnail)
    } catch (caught) {
      setError(caught)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <Card.Header className="bg-surface">
        <h2 className="h6 mb-0">{t('news.media.thumbnail')}</h2>
      </Card.Header>
      <Card.Body>
        <ErrorAlert error={error} />
        {fileError && <Alert variant="danger">{fileError}</Alert>}
        {!saved && <p className="text-muted small mb-0">{t('news.editor.saveFirst')}</p>}
        {saved && thumbnail && (
          <>
            <div className="thumb-preview mb-3">
              <img src={mediaUrl(thumbnail)} alt={t('news.media.thumbnail')} />
              {busy && (
                <span className="thumb-preview__busy">
                  <Spinner size="sm" animation="border" />
                </span>
              )}
            </div>
            {editable && (
              <div className="d-flex gap-2">
                <input ref={replaceInput} type="file" accept="image/jpeg,image/png,image/gif,image/webp" hidden onChange={(event) => {
                  const file = event.target.files[0]
                  event.target.value = ''
                  if (file) upload(file)
                }} />
                <Button size="sm" variant="outline-primary" disabled={busy} onClick={() => replaceInput.current.click()}>
                  {t('news.media.replace')}
                </Button>
                <Button size="sm" variant="outline-danger" disabled={busy} onClick={remove}>
                  {t('news.media.remove')}
                </Button>
              </div>
            )}
          </>
        )}
        {saved && !thumbnail && !editable && <p className="text-muted small mb-0">{t('news.media.noThumbnail')}</p>}
        {saved && !thumbnail && editable && (
          <>
            <DropZone disabled={busy} text={t('news.media.dropThumbnail')} hint={t('news.media.dropHint')} onFiles={([file]) => upload(file)} />
            {busy && (
              <div className="d-flex align-items-center gap-2 small text-muted mt-2">
                <Spinner size="sm" animation="border" /> {t('news.media.uploading')}
              </div>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  )
}

// ---- images ----

// One image of the grid: thumbnail, a caption (saved with Enter, when the field is left or with the check button), move
// up / down (earlier / later in the article) and delete
function ImageTile({ image, index, count, busy, onMove, onSaveCaption, onDelete }) {
  const { t } = useTranslation()
  const [caption, setCaption] = useState(image.caption ?? '')
  const changed = caption.trim() !== (image.caption ?? '')
  const save = () => {
    if (changed && !busy) onSaveCaption(image, caption.trim())
  }

  return (
    <div className="image-tile">
      <div className="image-tile__thumb">
        <img src={mediaUrl(image.url)} alt={image.caption ?? ''} loading="lazy" />
      </div>
      <div className="d-flex gap-1 mt-2">
        <Form.Control
          size="sm"
          maxLength={255}
          value={caption}
          placeholder={t('news.media.captionPlaceholder')}
          aria-label={t('news.media.caption')}
          onChange={(event) => setCaption(event.target.value)}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault() // not the article form
              save()
            }
          }}
        />
        {changed && (
          <Button size="sm" variant="outline-primary" className="flex-shrink-0" aria-label={t('news.media.saveCaption')} title={t('news.media.saveCaption')} disabled={busy} onClick={save}>
            <Check2 aria-hidden="true" />
          </Button>
        )}
      </div>
      <div className="d-flex justify-content-between mt-2">
        <ButtonGroup size="sm">
          <Button variant="outline-secondary" aria-label={t('news.media.moveUp')} title={t('news.media.moveUp')} disabled={busy || index === 0} onClick={() => onMove(index, -1)}>
            <ArrowLeft aria-hidden="true" />
          </Button>
          <Button variant="outline-secondary" aria-label={t('news.media.moveDown')} title={t('news.media.moveDown')} disabled={busy || index === count - 1} onClick={() => onMove(index, 1)}>
            <ArrowRight aria-hidden="true" />
          </Button>
        </ButtonGroup>
        <Button size="sm" variant="outline-danger" aria-label={t('news.media.deleteImage')} title={t('news.media.deleteImage')} disabled={busy} onClick={() => onDelete(image)}>
          <Trash aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

export function ImagesCard({ newsId, images, editable, saved = true, onImagesChange }) {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [uploads, setUploads] = useState([]) // [{ id, name, state: 'uploading' | 'failed', text }]
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const counter = useRef(0)

  const uploading = uploads.filter((item) => item.state === 'uploading').length
  const room = MAX_IMAGES_PER_NEWS - images.length - uploading

  const mutate = async (action) => {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (caught) {
      setError(caught)
    } finally {
      setBusy(false)
    }
  }

  // several files at once: each one is checked, then uploaded one after the other (the backend takes one per request)
  const upload = async (files) => {
    const failed = []
    const accepted = []
    files.forEach((file) => {
      const problem = rules.imageFile(file)
      if (problem) failed.push({ name: file.name, text: problem })
      else if (accepted.length < room) accepted.push(file)
      else failed.push({ name: file.name, text: t('news.media.limitReached', { max: MAX_IMAGES_PER_NEWS }) })
    })
    const queued = accepted.map((file) => {
      counter.current += 1
      return { id: counter.current, name: file.name, state: 'uploading', text: '' }
    })
    const rejected = failed.map((item) => {
      counter.current += 1
      return { id: counter.current, name: item.name, state: 'failed', text: item.text }
    })
    setUploads((current) => [...current, ...queued, ...rejected])
    for (let index = 0; index < accepted.length; index += 1) {
      const entry = queued[index]
      try {
        const added = await newsService.addNewsImage(newsId, accepted[index], null)
        onImagesChange((current) => [...current, added])
        setUploads((current) => current.filter((item) => item.id !== entry.id))
      } catch (caught) {
        setUploads((current) => current.map((item) => (item.id === entry.id ? { ...item, state: 'failed', text: errorMessage(caught) } : item)))
      }
    }
  }

  const saveCaption = (image, text) =>
    mutate(async () => {
      const updated = await newsService.updateNewsImage(newsId, image.id, { caption: text, sortOrder: null })
      onImagesChange((current) => current.map((item) => (item.id === image.id ? updated : item)))
    })

  // swaps two neighbours, then stores a sort order equal to the position for every image that moved
  const moveImage = (index, direction) =>
    mutate(async () => {
      const next = [...images]
      const target = index + direction
      ;[next[index], next[target]] = [next[target], next[index]]
      const savedImages = []
      for (let position = 0; position < next.length; position += 1) {
        const image = next[position]
        savedImages.push(image.sortOrder === position ? image : await newsService.updateNewsImage(newsId, image.id, { caption: null, sortOrder: position }))
      }
      onImagesChange(savedImages)
    })

  const confirmDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      await newsService.deleteNewsImage(newsId, toDelete.id)
      onImagesChange((current) => current.filter((item) => item.id !== toDelete.id))
    } catch (caught) {
      setError(caught)
    } finally {
      setDeleting(false)
      setToDelete(null)
    }
  }

  return (
    <Card>
      <Card.Header className="bg-surface d-flex justify-content-between align-items-center">
        <h2 className="h6 mb-0">{t('news.media.images')}</h2>
        <span className="text-muted small">
          {formatNumber(images.length)}/{formatNumber(MAX_IMAGES_PER_NEWS)}
        </span>
      </Card.Header>
      <Card.Body>
        <ErrorAlert error={error} />
        {!saved && <p className="text-muted small mb-0">{t('news.editor.saveFirst')}</p>}
        {saved && images.length === 0 && uploads.length === 0 && !editable && <p className="text-muted small mb-0">{t('news.media.noImages')}</p>}

        {saved && (images.length > 0 || (editable && uploads.length > 0)) && (
          <div className="image-grid mb-3">
            {editable
              ? images.map((image, index) => (
                  <ImageTile key={`${image.id}-${image.caption ?? ''}-${image.sortOrder}`} image={image} index={index} count={images.length} busy={busy} onMove={moveImage} onSaveCaption={saveCaption} onDelete={setToDelete} />
                ))
              : images.map((image) => (
                  <figure key={image.id} className="mb-0">
                    <div className="image-tile__thumb">
                      <img src={mediaUrl(image.url)} alt={image.caption ?? ''} loading="lazy" />
                    </div>
                    {image.caption && <figcaption className="small text-muted mt-1">{image.caption}</figcaption>}
                  </figure>
                ))}
          </div>
        )}

        {saved && editable && uploads.length > 0 && (
          <ul className="list-unstyled small mb-3">
            {uploads.map((item) => (
              <li key={item.id} className={`d-flex align-items-center gap-2 mb-1${item.state === 'failed' ? ' text-danger' : ''}`}>
                {item.state === 'uploading' ? <Spinner size="sm" animation="border" /> : <X aria-hidden="true" />}
                <span className="text-truncate">{item.state === 'uploading' ? t('news.media.uploadingFile', { name: item.name }) : t('news.media.failedFile', { name: item.name, error: item.text })}</span>
                {item.state === 'failed' && (
                  <Button variant="link" size="sm" className="p-0 ms-auto" onClick={() => setUploads((current) => current.filter((entry) => entry.id !== item.id))}>
                    {t('news.media.dismiss')}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {saved && editable && (room > 0 ? <DropZone multiple text={t('news.media.dropImages')} hint={t('news.media.dropHint')} onFiles={upload} /> : <p className="text-muted small mb-0">{t('news.media.limitReached', { max: MAX_IMAGES_PER_NEWS })}</p>)}
      </Card.Body>

      <ConfirmDialog show={Boolean(toDelete)} title={t('news.media.deleteTitle')} confirmLabel={t('common.actions.delete')} confirmVariant="danger" busy={deleting} onCancel={() => setToDelete(null)} onConfirm={confirmDelete}>
        {toDelete && (
          <div className="d-flex gap-3 align-items-center">
            <img src={mediaUrl(toDelete.url)} alt="" className="rounded" style={{ width: 96, aspectRatio: '16 / 9', objectFit: 'cover' }} />
            <span>{t('news.media.deleteBody')}</span>
          </div>
        )}
      </ConfirmDialog>
    </Card>
  )
}
