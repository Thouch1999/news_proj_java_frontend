import { useState } from 'react'
import { Alert, Form } from 'react-bootstrap'
import ConfirmDialog from '../common/ConfirmDialog'

// Delete confirmation. An author can only delete their own draft; an admin can delete any article, so for an
// admin the dialog says exactly what disappears and the delete button stays off until the box is ticked.
export default function DeleteArticleDialog({ article, admin, busy, onConfirm, onCancel }) {
  const [understood, setUnderstood] = useState(false)

  return (
    <ConfirmDialog
      show={Boolean(article)}
      title={admin ? 'Delete article permanently' : 'Delete draft'}
      confirmLabel={admin ? 'Delete permanently' : 'Delete'}
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
            <strong>{article?.title}</strong> will be removed for good, together with its <strong>comments</strong>, bookmarks, views,
            tags, <strong>images</strong> and status history. Readers will no longer find it. This cannot be undone.
          </Alert>
          <Form.Check
            id="understood"
            type="checkbox"
            label="I understand that this cannot be undone"
            checked={understood}
            onChange={(event) => setUnderstood(event.target.checked)}
          />
        </>
      ) : (
        <>
          Delete the draft <strong>{article?.title}</strong> with its images? This cannot be undone.
        </>
      )}
    </ConfirmDialog>
  )
}
