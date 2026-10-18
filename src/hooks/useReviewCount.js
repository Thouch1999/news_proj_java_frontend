import { useContext } from 'react'
import { ReviewCountContext } from '../context/ReviewCountContext'

// { count, refresh, setCount }: the number of articles waiting for review (see ReviewCountProvider)
export function useReviewCount() {
  return useContext(ReviewCountContext)
}
