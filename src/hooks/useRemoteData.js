import { useEffect, useState } from 'react'

// Loads data for a page. `key` identifies the request (for example the URL filters): when it changes the data is
// loaded again and `loading` is true until the new answer is there. `load` returns a promise.
// Returns { data, error, loading }.
export function useRemoteData(key, load) {
  const [state, setState] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    let current = true
    load()
      .then((data) => {
        if (current) setState({ key, data, error: null })
      })
      .catch((error) => {
        if (current) setState({ key, data: null, error })
      })
    return () => {
      current = false
    }
    // `load` is a new function on every render; `key` says when the request really changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const loading = state.key !== key
  return { data: loading ? null : state.data, error: loading ? null : state.error, loading }
}
