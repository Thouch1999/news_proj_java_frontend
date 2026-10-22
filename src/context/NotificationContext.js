import { createContext } from 'react'

// Shape: { unreadCount (null until known), version, hiddenIds, pendingCount, refreshCount, markRead, markAllRead, remove, undoRemove }
// Without a provider (a logged-out visitor) there is nothing to show: the count is null and the functions do nothing.
export const NotificationContext = createContext({
  unreadCount: null,
  version: 0,
  hiddenIds: new Set(),
  pendingCount: 0,
  refreshCount: async () => {},
  markRead: async () => false,
  markAllRead: async () => false,
  remove: () => {},
  undoRemove: () => {},
})
