import { useState } from 'react'
import { Card, Form } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import ErrorAlert from '../common/ErrorAlert'
import * as newsService from '../../services/newsService'

// Editor/admin: switch the comments of this article on or off (it takes effect at once, in any article status;
// the existing comments stay). `onChange(updatedArticle, message)` gets the article back from the backend.
export default function CommentsToggleCard({ area, article, onChange }) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const toggle = async (enabled) => {
    setBusy(true)
    setError(null)
    try {
      const updated = await (enabled ? newsService.enableComments(article.id) : newsService.disableComments(article.id))
      onChange(updated, enabled ? 'news.comments.toggle.enabledDone' : 'news.comments.toggle.disabledDone')
    } catch (caught) {
      setError(caught)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card body className="mb-3">
      <div className="fw-semibold mb-2">{t('news.comments.toggle.title')}</div>
      <ErrorAlert error={error} />
      <Form.Check
        id="comments-enabled"
        type="switch"
        label={article.commentsEnabled ? t('news.comments.toggle.enabled') : t('news.comments.toggle.disabled')}
        checked={article.commentsEnabled}
        disabled={busy}
        onChange={(event) => toggle(event.target.checked)}
      />
      <p className="text-muted small mt-2 mb-2">{t('news.comments.toggle.hint')}</p>
      <Link to={`${area.commentsPath}?newsId=${article.id}`} className="small">
        {t('news.comments.toggle.moderate')}
      </Link>
    </Card>
  )
}
