import { useContext } from 'react'
import { NotificationContext } from '../context/NotificationContext'

// { unreadCount, version, hiddenIds, pendingCount, refreshCount, markRead, markAllRead, remove, undoRemove } (see NotificationProvider)
export function useNotifications() {
  return useContext(NotificationContext)
}
