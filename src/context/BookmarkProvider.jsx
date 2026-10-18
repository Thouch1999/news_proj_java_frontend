import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Toast, ToastContainer } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import * as bookmarkService from '../services/bookmarkService'
import { errorMessage } from '../utils/errorMessage'
import { BookmarkContext } from './BookmarkContext'

const LOAD_SIZE = 50 // the largest page the backend gives
const MAX_PAGES = 20 // at most 1000 saved articles are known to the cards
const NOBODY = new Set()

// Which articles the logged-in user saved. The backend puts the "bookmarked" flag on the article page only, not on the
// cards of the lists, so the saved ids are loaded once after login and kept here. Every bookmark button reads this,
// so a card, the article page and the "My bookmarks" page always agree.
//
// toggle() changes the state at once and rolls it back when the backend refuses; it never throws, it returns
// true / false and shows an error toast.
export default function BookmarkProvider({ children }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const userId = user?.id ?? null
  // the saved ids belong to the user they were loaded for: for anybody else (or a logged-out visitor) they are ignored
  const [saved, setSaved] = useState({ userId: null, ids: NOBODY })
  const [pending, setPending] = useState(() => new Set())
  // the toast: { kind: 'load' | 'save' | 'remove', error } (the error object, so the text follows the language)
  const [failure, setFailure] = useState(null)
  const pendingRef = useRef(new Set()) // answers "is a request running?" at once, before React re-renders
  const idsRef = useRef(NOBODY) // the same ids, readable at once inside click handlers

  const loaded = userId !== null && saved.userId === userId
  const ids = loaded ? saved.ids : NOBODY

  // load everything the user saved after login
  useEffect(() => {
    if (!userId) {
      idsRef.current = NOBODY
      return undefined
    }
    let current = true
    ;(async () => {
      const found = new Set()
      try {
        for (let page = 1; page <= MAX_PAGES; page += 1) {
          const result = await bookmarkService.listBookmarks({ page, size: LOAD_SIZE })
          result.items.forEach((item) => found.add(item.news.id))
          if (result.last || result.items.length === 0) break
        }
      } catch (caught) {
        if (current) setFailure({ kind: 'load', error: caught })
      }
      if (current) {
        idsRef.current = found
        setSaved({ userId, ids: found })
      }
    })()
    return () => {
      current = false
    }
  }, [userId])

  const change = useCallback(
    (newsId, isSaved) => {
      const next = new Set(idsRef.current)
      if (isSaved) next.add(newsId)
      else next.delete(newsId)
      idsRef.current = next
      setSaved({ userId, ids: next })
    },
    [userId],
  )

  const markPending = useCallback((newsId, running) => {
    if (running) pendingRef.current.add(newsId)
    else pendingRef.current.delete(newsId)
    setPending(new Set(pendingRef.current))
  }, [])

  // `wanted` (true = save, false = remove) defaults to the opposite of what is shown now
  const toggle = useCallback(
    async (newsId, wanted) => {
      if (pendingRef.current.has(newsId)) {
        return false // a request for this article is already running
      }
      const before = idsRef.current.has(newsId)
      const target = wanted ?? !before
      markPending(newsId, true)
      change(newsId, target) // the UI changes now ...
      try {
        await (target ? bookmarkService.addBookmark(newsId) : bookmarkService.removeBookmark(newsId))
        return true
      } catch (caught) {
        change(newsId, before) // ... and goes back when the backend refuses
        setFailure({ kind: target ? 'save' : 'remove', error: caught })
        return false
      } finally {
        markPending(newsId, false)
      }
    },
    [change, markPending],
  )

  // the article page knows for sure (its "bookmarked" flag): bring the shared state in line with it
  const setKnown = useCallback(
    (newsId, isSaved) => {
      if (userId && idsRef.current.has(newsId) !== isSaved && !pendingRef.current.has(newsId)) {
        change(newsId, isSaved)
      }
    },
    [userId, change],
  )

  const value = useMemo(
    () => ({
      loaded,
      isBookmarked: (newsId) => ids.has(newsId),
      isPending: (newsId) => pending.has(newsId),
      toggle,
      setKnown,
    }),
    [loaded, ids, pending, toggle, setKnown],
  )

  return (
    <BookmarkContext.Provider value={value}>
      {children}
      <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 2000 }}>
        <Toast bg="danger" show={Boolean(failure)} onClose={() => setFailure(null)} delay={5000} autohide>
          <Toast.Body className="text-white d-flex justify-content-between gap-3">
            <span>{failure ? t(`news.bookmarks.${failure.kind}Failed`, { error: errorMessage(failure.error) }) : ''}</span>
            <button type="button" className="btn-close btn-close-white" aria-label={t('common.actions.close')} onClick={() => setFailure(null)} />
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </BookmarkContext.Provider>
  )
}
