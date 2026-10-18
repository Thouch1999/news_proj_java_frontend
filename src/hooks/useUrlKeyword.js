import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export const KEYWORD_DELAY = 400

// The search text of the news pages (?keyword=). Typing changes the box at once and the URL after a short pause, so
// the list searches while the user types. Everything that reads the URL (the toolbar and the header box) follows it.
// `commit()` writes the text now (Enter). A new search starts on page 1.
// Returns { value, setValue, commit }.
export function useUrlKeyword(delay = KEYWORD_DELAY) {
  const [params, setParams] = useSearchParams()
  const inUrl = params.get('keyword') ?? ''
  const [draft, setDraft] = useState(null) // null: show what the URL has

  const write = useCallback(
    (text) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          const trimmed = text.trim()
          if (trimmed) next.set('keyword', trimmed)
          else next.delete('keyword')
          next.delete('page')
          return next
        },
        { replace: true },
      )
      setDraft(null)
    },
    [setParams],
  )

  useEffect(() => {
    if (draft === null) return undefined
    if (draft.trim() === inUrl) {
      // nothing to change (the user typed the same text again)
      const same = setTimeout(() => setDraft(null), 0)
      return () => clearTimeout(same)
    }
    const timer = setTimeout(() => write(draft), delay)
    return () => clearTimeout(timer)
  }, [draft, inUrl, delay, write])

  return { value: draft ?? inUrl, setValue: setDraft, commit: () => write(draft ?? inUrl) }
}
