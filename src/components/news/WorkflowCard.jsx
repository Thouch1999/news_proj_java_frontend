import { Button, Card } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { WORKFLOW_ACTIONS, workflowActions } from '../../constants/newsStatus'
import { useWorkflowAction } from '../../hooks/useWorkflowAction'
import ArticleHistory from './ArticleHistory'
import PublishSplitButton from './PublishSplitButton'
import StatusBadge from './StatusBadge'
import WorkflowDialog from './WorkflowDialog'

// Status, the workflow actions that are valid for this role and status, and the status history.
// `history` is what useNewsHistory returns. `onChange(updatedArticle, messageKey)` is called after an action succeeded;
// the message is a translation key.
// While `dirty` (unsaved form changes) the actions are off: the backend would act on the saved version.
export default function WorkflowCard({ area, article, history, onChange, dirty = false }) {
  const { t } = useTranslation()
  const { pending, busy, error, start, cancel, confirm } = useWorkflowAction((updated, action) => onChange(updated, WORKFLOW_ACTIONS[action].doneKey))
  const actions = workflowActions(area.role, article.status)
  const split = actions.some((action) => action.key === 'publish') && actions.some((action) => action.key === 'schedule')

  return (
    <Card body className="mb-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="fw-semibold">{t('news.workflow.title')}</span>
        <StatusBadge status={article.status} />
      </div>

      {actions.length > 0 ? (
        <div className="d-flex flex-wrap gap-2">
          {actions.map((action) => {
            // a PENDING article: "Publish now" with "Schedule…" behind its arrow, in one button
            if (action.key === 'schedule' && split) return null
            if (action.key === 'publish' && split) {
              return <PublishSplitButton key={action.key} disabled={dirty} onPublish={() => start('publish', article)} onSchedule={() => start('schedule', article)} />
            }
            return (
              <Button key={action.key} variant={action.variant} size="sm" disabled={dirty} onClick={() => start(action.key, article)}>
                {t(action.labelKey)}
              </Button>
            )
          })}
        </div>
      ) : (
        <p className="text-muted small mb-0">{t('news.workflow.none')}</p>
      )}
      {dirty && actions.length > 0 && <p className="text-warning small mt-2 mb-0">{t('news.workflow.saveFirst')}</p>}

      <hr />
      <div className="fw-semibold mb-2">{t('news.workflow.history')}</div>
      <ArticleHistory state={history} />

      <WorkflowDialog key={`${pending?.action}-${pending?.article.id}`} action={pending?.action} article={pending?.article} busy={busy} error={error} onCancel={cancel} onConfirm={confirm} />
    </Card>
  )
}
