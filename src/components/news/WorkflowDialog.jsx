import { useState } from 'react'
import { Form } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import ConfirmDialog from '../common/ConfirmDialog'
import ErrorAlert from '../common/ErrorAlert'
import { WORKFLOW_ACTIONS } from '../../constants/newsStatus'
import ScheduleDialog from './ScheduleDialog'

const REASON_MAX = 1000

function question(action, article) {
  const values = { title: article?.title }
  const components = { strong: <strong /> }
  switch (action) {
    case 'submit':
      return <Trans i18nKey="news.workflow.dialog.submit" values={values} components={components} />
    case 'publish':
      return article?.status === 'DRAFT' ? (
        <Trans i18nKey="news.workflow.dialog.publishNow" values={values} components={components} />
      ) : (
        <Trans i18nKey="news.workflow.dialog.publish" values={values} components={components} />
      )
    case 'archive':
      return <Trans i18nKey="news.workflow.dialog.archive" values={values} components={components} />
    case 'restore':
      return <Trans i18nKey="news.workflow.dialog.restore" values={values} components={components} />
    case 'unschedule':
      return <Trans i18nKey="news.workflow.dialog.unschedule" values={values} components={components} />
    default:
      return null
  }
}

// Confirmation for one workflow action. "Reject" asks for the required reason, which the author will see; "Schedule" and
// "Change time" open the ScheduleDialog.
// Mount it with a `key` that changes per action so the reason box starts empty.
export default function WorkflowDialog({ action, article, busy, error, onConfirm, onCancel }) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const info = action ? WORKFLOW_ACTIONS[action] : null
  const reject = action === 'reject'
  const scheduling = action === 'schedule' || action === 'reschedule'
  const label = action === 'publish' && article?.status === 'DRAFT' ? t('news.workflow.dialog.publishNowLabel') : info ? t(info.labelKey) : undefined

  // the time of a schedule is chosen in its own dialog; its answer is the UTC time, passed where the rejection reason goes
  if (scheduling) {
    return <ScheduleDialog show change={action === 'reschedule'} article={article} busy={busy} error={error} onCancel={onCancel} onConfirm={onConfirm} />
  }

  return (
    <ConfirmDialog
      show={Boolean(action)}
      title={reject ? t('news.workflow.dialog.rejectTitle') : label}
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
            <Trans i18nKey="news.workflow.dialog.reject" values={{ title: article?.title }} components={{ strong: <strong /> }} />
          </p>
          <Form.Group controlId="reject-reason">
            <Form.Label>{t('news.workflow.dialog.reason')}</Form.Label>
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
