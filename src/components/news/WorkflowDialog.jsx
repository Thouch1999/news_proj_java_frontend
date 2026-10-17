import { useState } from 'react'
import { Form } from 'react-bootstrap'
import ConfirmDialog from '../common/ConfirmDialog'
import ErrorAlert from '../common/ErrorAlert'
import { WORKFLOW_ACTIONS } from '../../constants/newsStatus'

const REASON_MAX = 1000

function question(action, article) {
  const title = <strong>{article?.title}</strong>
  switch (action) {
    case 'submit':
      return <>Submit {title} for review? An editor will check it. While it is pending you cannot edit it.</>
    case 'publish':
      return article?.status === 'DRAFT' ? (
        <>Publish {title} now, without review? It becomes visible to readers.</>
      ) : (
        <>Publish {title}? It becomes visible to readers.</>
      )
    case 'archive':
      return <>Archive {title}? It is removed from the public site. Only an admin can restore it.</>
    case 'restore':
      return <>Restore {title}? It is published again.</>
    default:
      return null
  }
}

// Confirmation for one workflow action. "Reject" asks for the required reason, which the author will see.
// Mount it with a `key` that changes per action so the reason box starts empty.
export default function WorkflowDialog({ action, article, busy, error, onConfirm, onCancel }) {
  const [reason, setReason] = useState('')
  const info = action ? WORKFLOW_ACTIONS[action] : null
  const reject = action === 'reject'
  const label = action === 'publish' && article?.status === 'DRAFT' ? 'Publish now' : info?.label

  return (
    <ConfirmDialog
      show={Boolean(action)}
      title={reject ? 'Reject article' : label}
      confirmLabel={label}
      confirmVariant={info?.variant?.replace('outline-', '') ?? 'primary'}
      busy={busy}
      confirmDisabled={reject && !reason.trim()}
      onCancel={onCancel}
      onConfirm={() => onConfirm(reason.trim())}
    >
      <ErrorAlert error={error} />
      {reject ? (
        <>
          <p>
            Reject <strong>{article?.title}</strong>? The author sees your reason, fixes the article and submits it again.
          </p>
          <Form.Group controlId="reject-reason">
            <Form.Label>Reason (required)</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              maxLength={REASON_MAX}
              value={reason}
              isInvalid={reason.length > 0 && !reason.trim()}
              onChange={(event) => setReason(event.target.value)}
            />
            <div className="text-muted small text-end">
              {reason.length}/{REASON_MAX}
            </div>
          </Form.Group>
        </>
      ) : (
        question(action, article)
      )}
    </ConfirmDialog>
  )
}
