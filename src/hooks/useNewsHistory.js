import { useEffect, useState } from 'react'
import * as newsService from '../services/newsService'

// The status history of a saved article; it is loaded again whenever the article's status changes.
// `article` is null while a new article is being written.
export function useNewsHistory(article) {
  const id = article?.id
  const key = id ? `${id}|${article.status}` : null
  const [state, setState] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    if (!key) {
      return undefined
    }
    let current = true
    newsService
      .getNewsHistory(id)
      .then((data) => {
        if (current) setState({ key, data: data ?? [], error: null })
      })
      .catch((error) => {
        if (current) setState({ key, data: null, error })
      })
    return () => {
      current = false
    }
  }, [key, id])

  const ready = Boolean(key) && state.key === key
  return { history: ready ? state.data : null, error: ready ? state.error : null, loading: Boolean(key) && !ready }
}
