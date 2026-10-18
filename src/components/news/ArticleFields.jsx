import { Card, Form } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import RichTextEditor from '../form/RichTextEditor'
import { useFormat } from '../../hooks/useFormat'
import { readingStats } from '../../utils/readingStats'

// The three text fields of the article page: title, summary and content, each with its counter.

const TITLE_MAX = 255
const SUMMARY_HINT = 160 // a search result shows about this much of the summary: only a hint, not a limit

function Counter({ value, max, warnAbove }) {
  const { formatNumber } = useFormat()
  const warn = warnAbove !== undefined && value > warnAbove
  return (
    <span className={`char-counter small${warn ? ' char-counter--warn' : ''}`} aria-live="off">
      {formatNumber(value)} / {formatNumber(max)}
    </span>
  )
}

export function TitleField({ value, error, onChange }) {
  const { t } = useTranslation()
  return (
    <Card body className="editor-field">
      <Form.Group controlId="field-title">
        <Form.Label className="fw-semibold">{t('news.editor.fields.title')}</Form.Label>
        <Form.Control size="lg" className="fw-semibold" value={value} isInvalid={Boolean(error)} placeholder={t('news.editor.titlePlaceholder')} onChange={(event) => onChange(event.target.value)} />
        <div className="d-flex justify-content-between gap-2 mt-1">
          <Form.Control.Feedback type="invalid" className="d-block w-auto">
            {error}
          </Form.Control.Feedback>
          <span className="ms-auto">
            <Counter value={value.length} max={TITLE_MAX} warnAbove={TITLE_MAX} />
          </span>
        </div>
      </Form.Group>
    </Card>
  )
}

export function SummaryField({ value, error, onChange }) {
  const { t } = useTranslation()
  return (
    <Card body className="editor-field">
      <Form.Group controlId="field-summary">
        <Form.Label className="fw-semibold">{t('news.editor.fields.summary')}</Form.Label>
        <Form.Control as="textarea" rows={3} value={value} isInvalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} />
        <div className="d-flex justify-content-between gap-2 mt-1">
          <Form.Control.Feedback type="invalid" className="d-block w-auto">
            {error}
          </Form.Control.Feedback>
          <span className="small text-muted ms-auto text-end">
            {t('news.editor.summaryHint')} <Counter value={value.length} max={SUMMARY_HINT} warnAbove={SUMMARY_HINT} />
          </span>
        </div>
      </Form.Group>
    </Card>
  )
}

// The editor (its toolbar stays on screen while the page scrolls, see _theme.scss) and "245 words · 2 min read"
export function ContentField({ value, error, busy = false, onChange, onImage }) {
  const { t, i18n } = useTranslation()
  const { formatNumber } = useFormat()
  const { words, minutes } = readingStats(value, i18n.language)

  return (
    <Card className="editor-field editor-card" id="field-content">
      <Card.Body>
        <div className="fw-semibold mb-2">{t('news.editor.fields.content')}</div>
        <RichTextEditor value={value} onChange={onChange} onImage={onImage} invalid={Boolean(error)} />
        <div className="d-flex justify-content-between gap-2 mt-2">
          <span className={`small ${error ? 'text-danger' : 'text-muted'}`}>{error || (busy ? t('news.editor.imageUploading') : t('news.editor.imageHint'))}</span>
          <span className="text-muted small ms-auto">{t('news.editor.stats', { count: words, words: formatNumber(words), minutes: formatNumber(minutes) })}</span>
        </div>
      </Card.Body>
    </Card>
  )
}
