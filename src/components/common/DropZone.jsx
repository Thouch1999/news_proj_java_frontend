import { useRef, useState } from 'react'
import { Upload } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { IMAGE_TYPES } from '../../constants/upload'

// A drag-and-drop area for files (native HTML5 drag events); a click or Enter / Space opens the file chooser instead.
// `onFiles(files)` gets the dropped or chosen files (one file when `multiple` is false); checking them is up to the caller.
export default function DropZone({ onFiles, multiple = false, disabled = false, text, hint }) {
  const { t } = useTranslation()
  const [over, setOver] = useState(false)
  const input = useRef(null)
  const depth = useRef(0) // dragenter and dragleave also fire for the children

  const open = () => {
    if (!disabled) input.current.click()
  }
  const send = (list) => {
    const files = Array.from(list ?? [])
    if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1))
  }

  return (
    <>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        className={`drop-zone text-center${over ? ' is-over' : ''}${disabled ? ' is-disabled' : ''}`}
        onClick={open}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            open()
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault()
          depth.current += 1
          if (!disabled) setOver(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => {
          depth.current = Math.max(0, depth.current - 1)
          if (depth.current === 0) setOver(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          depth.current = 0
          setOver(false)
          if (!disabled) send(event.dataTransfer.files)
        }}
      >
        <Upload aria-hidden="true" className="drop-zone__icon" />
        <div>
          {text} <span className="drop-zone__browse">{t('news.media.browse')}</span>
        </div>
        {hint && <div className="small text-muted">{hint}</div>}
      </div>
      <input
        ref={input}
        type="file"
        hidden
        multiple={multiple}
        accept={IMAGE_TYPES.join(',')}
        onChange={(event) => {
          send(event.target.files)
          event.target.value = ''
        }}
      />
    </>
  )
}
