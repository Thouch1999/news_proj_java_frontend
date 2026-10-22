import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Toast, ToastContainer } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { NEW_TOAST_GAP_MS, notificationsPath, POLL_INTERVAL_MS, UNDO_DELAY_MS } from '../constants/notifications'
import { useAuth } from '../hooks/useAuth'
import * as notificationService from '../services/notificationService'
import { errorMessage } from '../utils/errorMessage'
import { NotificationContext } from './NotificationContext'

// The unread count of the logged-in user, for the bell. It is loaded after login (and on app start with a valid
// session), asked again every 30 seconds while the tab is visible, and at once when the tab becomes visible again. It
// stops when the user logs out. A failed background call is silent: the bell keeps its last number.
//
// The pages that list notifications reload when `version` changes (a new one arrived, one was read or deleted).
// markRead / markAllRead / remove change the count at once and ask the backend; remove() waits UNDO_DELAY_MS before it
// really deletes, so "Undo" can bring the notification back (there is no endpoint to restore a deleted one).
// A rise of the count found by polling shows the toast "You have a new notification", at most once a minute.
export default function NotificationProvider({ children }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const userId = user?.id ?? null
  const role = user?.role ?? null

  // the count belongs to the user it was loaded for
  const [state, setState] = useState({ userId: null, count: null })
  const unreadCount = userId !== null && state.userId === userId ? state.count : null
  const [version, setVersion] = useState(0)
  const [hiddenIds, setHiddenIds] = useState(() => new Set())
  const [pendingIds, setPendingIds] = useState(() => new Set()) // hidden, still waiting for the undo time
  const [newToast, setNewToast] = useState(false)
  const [notice, setNotice] = useState(null) // { variant, text, undo }

  const countRef = useRef(null) // the count that is shown, readable inside timers
  const userIdRef = useRef(userId)
  const pathRef = useRef(pathname)
  const lastNewToast = useRef(0)
  const pending = useRef(new Map()) // id -> { timer, item }: deletes waiting for the undo time
  const lastRemoved = useRef(null)

  useEffect(() => {
    userIdRef.current = userId
    pathRef.current = pathname
  })

  const showCount = useCallback((count) => {
    countRef.current = count
    setState({ userId: userIdRef.current, count })
  }, [])

  const bump = useCallback(() => setVersion((value) => value + 1), [])

  // asks the backend for the count; `announce` (a poll) may show the toast when the count went up
  const fetchCount = useCallback(
    async (announce) => {
      const asked = userIdRef.current
      if (asked === null) return
      try {
        const count = await notificationService.getUnreadCount()
        if (userIdRef.current !== asked) return
        const before = countRef.current
        showCount(count)
        if (before !== null && count > before) {
          bump()
          const now = Date.now()
          if (announce && now - lastNewToast.current >= NEW_TOAST_GAP_MS && pathRef.current !== notificationsPath(role)) {
            lastNewToast.current = now
            setNewToast(true)
          }
        }
      } catch {
        // a background call: no toast, the bell keeps its number
      }
    },
    [showCount, bump, role],
  )

  // load after login, poll while the tab is visible, stop on logout
  useEffect(() => {
    if (userId === null) {
      countRef.current = null
      return undefined
    }
    let timer = null
    const stop = () => {
      clearInterval(timer)
      timer = null
    }
    const start = () => {
      stop()
      timer = setInterval(() => fetchCount(true), POLL_INTERVAL_MS)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchCount(true)
        start()
      } else {
        stop()
      }
    }
    const first = setTimeout(() => fetchCount(false), 0) // the first number (not announced)
    if (document.visibilityState === 'visible') start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearTimeout(first)
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [userId, fetchCount])

  const fail = useCallback((caught) => setNotice({ variant: 'danger', text: errorMessage(caught) }), [])

  const markRead = useCallback(
    async (item) => {
      if (item.read) return true
      if (countRef.current !== null) showCount(Math.max(countRef.current - 1, 0))
      try {
        await notificationService.markRead(item.id)
        return true
      } catch (caught) {
        fail(caught)
        return false
      } finally {
        fetchCount(false)
        bump()
      }
    },
    [showCount, fetchCount, bump, fail],
  )

  const markAllRead = useCallback(async () => {
    if (countRef.current !== null) showCount(0)
    try {
      await notificationService.markAllRead()
      return true
    } catch (caught) {
      fail(caught)
      return false
    } finally {
      fetchCount(false)
      bump()
    }
  }, [showCount, fetchCount, bump, fail])

  // the real delete, after the undo time (or at once when the user leaves)
  const commit = useCallback(
    async (item) => {
      pending.current.delete(item.id)
      setPendingIds((current) => {
        const next = new Set(current)
        next.delete(item.id)
        return next
      })
      try {
        await notificationService.deleteNotification(item.id)
      } catch (caught) {
        // it still exists: it comes back in the list and in the count
        setHiddenIds((current) => {
          const next = new Set(current)
          next.delete(item.id)
          return next
        })
        fail(caught)
      } finally {
        // a deleted id stays hidden (ids are never reused), so the row cannot flash back before the list is loaded again
        fetchCount(false)
        bump()
      }
    },
    [fetchCount, bump, fail],
  )

  const remove = useCallback(
    (item) => {
      setHiddenIds((current) => new Set(current).add(item.id))
      setPendingIds((current) => new Set(current).add(item.id))
      if (!item.read && countRef.current !== null) showCount(Math.max(countRef.current - 1, 0))
      const timer = setTimeout(() => commit(item), UNDO_DELAY_MS)
      pending.current.set(item.id, { timer, item })
      lastRemoved.current = item.id
      setNotice({ variant: 'success', text: t('notifications.deleted'), undo: true })
    },
    [showCount, commit, t],
  )

  const undoRemove = useCallback(() => {
    const entry = pending.current.get(lastRemoved.current)
    if (!entry) return
    clearTimeout(entry.timer)
    pending.current.delete(entry.item.id)
    lastRemoved.current = null
    setHiddenIds((current) => {
      const next = new Set(current)
      next.delete(entry.item.id)
      return next
    })
    setPendingIds((current) => {
      const next = new Set(current)
      next.delete(entry.item.id)
      return next
    })
    if (!entry.item.read && countRef.current !== null) showCount(countRef.current + 1)
    setNotice(null)
  }, [showCount])

  // leaving (logout, closing the app's tree): the deletes that wait are sent now
  useEffect(() => {
    const waiting = pending.current
    return () => {
      waiting.forEach(({ timer, item }) => {
        clearTimeout(timer)
        notificationService.deleteNotification(item.id).catch(() => {})
      })
      waiting.clear()
    }
  }, [userId])

  const value = useMemo(
    () => ({ unreadCount, version, hiddenIds, pendingCount: pendingIds.size, refreshCount: () => fetchCount(false), markRead, markAllRead, remove, undoRemove }),
    [unreadCount, version, hiddenIds, pendingIds, fetchCount, markRead, markAllRead, remove, undoRemove],
  )

  const viewNew = () => {
    setNewToast(false)
    navigate(notificationsPath(role))
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {userId !== null && (
        <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 2000 }}>
          <Toast className="notif-toast" show={newToast} onClose={() => setNewToast(false)} delay={8000} autohide>
            <Toast.Body className="d-flex align-items-center justify-content-between gap-3">
              <span role="status">{t('notifications.newToast')}</span>
              <span className="d-flex align-items-center gap-2">
                <Button size="sm" onClick={viewNew}>
                  {t('common.actions.view')}
                </Button>
                <button type="button" className="btn-close" aria-label={t('common.actions.close')} onClick={() => setNewToast(false)} />
              </span>
            </Toast.Body>
          </Toast>
          <Toast bg={notice?.variant ?? 'success'} show={Boolean(notice)} onClose={() => setNotice(null)} delay={UNDO_DELAY_MS} autohide>
            <Toast.Body className="text-white d-flex align-items-center justify-content-between gap-3">
              <span>{notice?.text}</span>
              <span className="d-flex align-items-center gap-2">
                {notice?.undo && (
                  <Button size="sm" variant="light" onClick={undoRemove}>
                    {t('notifications.undo')}
                  </Button>
                )}
                <button type="button" className="btn-close btn-close-white" aria-label={t('common.actions.close')} onClick={() => setNotice(null)} />
              </span>
            </Toast.Body>
          </Toast>
        </ToastContainer>
      )}
    </NotificationContext.Provider>
  )
}
