import { createContext } from 'react'

// The number of articles waiting for review, for the badge in the sidebar. Without a provider (an author has none) the
// count is null and the functions do nothing.
export const ReviewCountContext = createContext({ count: null, refresh: () => {}, setCount: () => {} })
