import { useEffect, useState } from 'react'
import * as categoryService from '../services/categoryService'

// Active categories for the public menu. On failure the list stays empty and the menu is just disabled.
export function useActiveCategories() {
  const [state, setState] = useState({ categories: [], loaded: false })

  useEffect(() => {
    let current = true
    categoryService
      .listActiveCategories()
      .then((categories) => {
        if (current) setState({ categories: categories ?? [], loaded: true })
      })
      .catch(() => {
        if (current) setState({ categories: [], loaded: true })
      })
    return () => {
      current = false
    }
  }, [])

  return state
}
