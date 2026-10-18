import { createContext } from 'react'

// Shape: { loaded, isBookmarked(newsId), isPending(newsId), toggle(newsId, wanted?), setKnown(newsId, value) }
export const BookmarkContext = createContext(null)
