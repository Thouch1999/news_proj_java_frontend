import { useState } from 'react'
import * as newsService from '../services/newsService'

// Runs an editorial workflow action after the user confirmed it in a WorkflowDialog.
// start(action, article) opens the dialog, confirm(reason) calls the backend and then onDone(updatedArticle, action).
// An error (for example 409 when somebody else changed the article first) stays in the dialog.
export function useWorkflowAction(onDone) {
  const [pending, setPending] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const start = (action, article) => {
    setError(null)
    setPending({ action, article })
  }

  const cancel = () => {
    setPending(null)
    setError(null)
  }

  const confirm = async (reason) => {
    setBusy(true)
    setError(null)
    try {
      const updated = await newsService.runWorkflowAction(pending.action, pending.article.id, reason)
      const { action } = pending
      setPending(null)
      onDone(updated, action)
    } catch (caught) {
      setError(caught)
    } finally {
      setBusy(false)
    }
  }

  return { pending, busy, error, start, cancel, confirm }
}
