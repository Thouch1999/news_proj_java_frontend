import { useState } from 'react'
import { Alert, Form } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import ConfirmDialog from '../common/ConfirmDialog'

// Delete confirmation. An author can only delete their own draft; an admin can delete any article, so for an
// admin the dialog says exactly what disappears and the delete button stays off until the box is ticked.
export default function DeleteArticleDialog({ article, admin, busy, onConfirm, onCancel }) {
  const { t } = useTranslation()
  const [understood, setUnderstood] = useState(false)
  const components = { strong: <strong /> }
  const values = { title: article?.title }

  return (
    <ConfirmDialog
      show={Boolean(article)}
      title={admin ? t('news.delete.titleAdmin') : t('news.delete.titleDraft')}
      confirmLabel={admin ? t('news.delete.confirmAdmin') : t('common.actions.delete')}
      confirmVariant="danger"
      busy={busy}
      confirmDisabled={admin && !understood}
      onCancel={() => {
        setUnderstood(false)
        onCancel()
      }}
      onConfirm={onConfirm}
    >
      {admin ? (
        <>
          <Alert variant="danger">
            <Trans i18nKey="news.delete.bodyAdmin" values={values} components={components} />
          </Alert>
          <Form.Check
            id="understood"
            type="checkbox"
            label={t('news.delete.understood')}
            checked={understood}
            onChange={(event) => setUnderstood(event.target.checked)}
          />
        </>
      ) : (
        <Trans i18nKey="news.delete.bodyDraft" values={values} components={components} />
      )}
    </ConfirmDialog>
  )
}
