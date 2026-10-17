import { useRef, useState } from 'react'
import { Alert, Button, Card, Form } from 'react-bootstrap'
import { ArrowDown, ArrowUp, Trash } from 'react-bootstrap-icons'
import ErrorAlert from '../common/ErrorAlert'
import { MAX_IMAGES_PER_NEWS } from '../../constants/upload'
import * as newsService from '../../services/newsService'
import { mediaUrl } from '../../utils/mediaUrl'
import { rules } from '../../utils/validators'

function ImageRow({ image, index, count, busy, onMove, onSaveCaption, onDelete }) {
  const [caption, setCaption] = useState(image.caption ?? '')
  const changed = caption.trim() !== (image.caption ?? '')

  return (
    <div className="d-flex gap-3 align-items-start border rounded p-2 mb-2 bg-white">
      <img src={mediaUrl(image.url)} alt={image.caption ?? ''} width="96" height="72" className="object-fit-cover rounded" />
      <div className="flex-grow-1">
        <Form.Control
          size="sm"
          maxLength={255}
          value={caption}
          placeholder="Caption (optional)"
          aria-label="Caption"
          onChange={(event) => setCaption(event.target.value)}
        />
        {changed && (
          <Button size="sm" variant="link" className="px-0" disabled={busy} onClick={() => onSaveCaption(image, caption.trim())}>
            Save caption
          </Button>
        )}
      </div>
      <div className="d-flex flex-column gap-1">
        <Button size="sm" variant="outline-secondary" aria-label="Move up" disabled={busy || index === 0} onClick={() => onMove(index, -1)}>
          <ArrowUp />
        </Button>
        <Button size="sm" variant="outline-secondary" aria-label="Move down" disabled={busy || index === count - 1} onClick={() => onMove(index, 1)}>
          <ArrowDown />
        </Button>
      </div>
      <Button size="sm" variant="outline-danger" aria-label="Delete image" disabled={busy} onClick={() => onDelete(image)}>
        <Trash />
      </Button>
    </div>
  )
}

// Thumbnail and image gallery of a saved article. `editable` is false in the read-only view.
export default function ArticleMedia({ newsId, thumbnail, images, editable, onThumbnailChange, onImagesChange }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [fileError, setFileError] = useState('')
  const [caption, setCaption] = useState('')
  const thumbInput = useRef(null)
  const imageInput = useRef(null)

  const run = async (action) => {
    setBusy(true)
    setError(null)
    setFileError('')
    try {
      await action()
    } catch (caught) {
      setError(caught)
    } finally {
      setBusy(false)
    }
  }

  const chooseThumbnail = (event) => {
    const file = event.target.files[0]
    event.target.value = ''
    const problem = file ? rules.imageFile(file) : ''
    if (problem) {
      setFileError(problem)
      return
    }
    if (file) {
      run(async () => onThumbnailChange((await newsService.setNewsThumbnail(newsId, file)).thumbnail))
    }
  }

  const removeThumbnail = () => run(async () => onThumbnailChange((await newsService.removeNewsThumbnail(newsId)).thumbnail))

  const addImage = () => {
    const file = imageInput.current.files[0]
    const problem = rules.imageFile(file)
    if (problem) {
      setFileError(problem)
      return
    }
    run(async () => {
      const added = await newsService.addNewsImage(newsId, file, caption.trim() || null)
      onImagesChange([...images, added])
      imageInput.current.value = ''
      setCaption('')
    })
  }

  const saveCaption = (image, text) =>
    run(async () => {
      const updated = await newsService.updateNewsImage(newsId, image.id, { caption: text, sortOrder: null })
      onImagesChange(images.map((item) => (item.id === image.id ? updated : item)))
    })

  const deleteImage = (image) =>
    run(async () => {
      await newsService.deleteNewsImage(newsId, image.id)
      onImagesChange(images.filter((item) => item.id !== image.id))
    })

  // swaps two neighbours, then stores a sort order equal to the position for every image that moved
  const moveImage = (index, direction) =>
    run(async () => {
      const next = [...images]
      const target = index + direction
      ;[next[index], next[target]] = [next[target], next[index]]
      const saved = []
      for (let position = 0; position < next.length; position += 1) {
        const image = next[position]
        saved.push(image.sortOrder === position ? image : await newsService.updateNewsImage(newsId, image.id, { caption: null, sortOrder: position }))
      }
      onImagesChange(saved)
    })

  return (
    <div>
      <ErrorAlert error={error} />
      {fileError && <Alert variant="danger">{fileError}</Alert>}

      <Card body className="mb-3">
        <h2 className="h6">Thumbnail</h2>
        {thumbnail ? (
          <img src={mediaUrl(thumbnail)} alt="Thumbnail" className="img-fluid rounded mb-2" style={{ maxHeight: 180 }} />
        ) : (
          <p className="text-muted small">No thumbnail yet.</p>
        )}
        {editable && (
          <div className="d-flex gap-2">
            <input ref={thumbInput} type="file" accept="image/jpeg,image/png,image/gif,image/webp" hidden onChange={chooseThumbnail} />
            <Button size="sm" variant="outline-primary" disabled={busy} onClick={() => thumbInput.current.click()}>
              {thumbnail ? 'Replace' : 'Upload'}
            </Button>
            {thumbnail && (
              <Button size="sm" variant="outline-danger" disabled={busy} onClick={removeThumbnail}>
                Remove
              </Button>
            )}
          </div>
        )}
      </Card>

      <Card body>
        <h2 className="h6">
          Images <span className="text-muted fw-normal">({images.length}/{MAX_IMAGES_PER_NEWS})</span>
        </h2>
        {images.length === 0 && <p className="text-muted small">No images yet.</p>}
        {editable
          ? images.map((image, index) => (
              <ImageRow key={`${image.id}-${image.caption ?? ''}-${image.sortOrder}`} image={image} index={index} count={images.length} busy={busy} onMove={moveImage} onSaveCaption={saveCaption} onDelete={deleteImage} />
            ))
          : images.map((image) => (
              <figure key={image.id} className="mb-2">
                <img src={mediaUrl(image.url)} alt={image.caption ?? ''} className="img-fluid rounded" />
                {image.caption && <figcaption className="small text-muted">{image.caption}</figcaption>}
              </figure>
            ))}
        {editable && images.length < MAX_IMAGES_PER_NEWS && (
          <div className="border-top pt-3">
            <Form.Control ref={imageInput} type="file" size="sm" accept="image/jpeg,image/png,image/gif,image/webp" className="mb-2" aria-label="Image file" />
            <Form.Control size="sm" maxLength={255} value={caption} placeholder="Caption (optional)" aria-label="New image caption" className="mb-2" onChange={(event) => setCaption(event.target.value)} />
            <Button size="sm" disabled={busy} onClick={addImage}>
              {busy ? 'Uploading...' : 'Upload image'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
