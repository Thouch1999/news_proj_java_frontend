import { useContext } from 'react'
import { BookmarkContext } from '../context/BookmarkContext'

export function useBookmarks() {
  const context = useContext(BookmarkContext)
  if (!context) {
    throw new Error('useBookmarks must be used inside BookmarkProvider')
  }
  return context
}
