import { useEffect, useState } from 'react'
import * as categoryService from '../services/categoryService'
import * as newsService from '../services/newsService'
import * as userService from '../services/userService'

// The choices of the author and category filters of the article list, for an editor or an admin (`area.staff`).
//  - admin: everybody who can write articles, and all categories (also inactive ones)
//  - editor: the users endpoint is admin only, so the authors are the ones found on the first 50 articles;
//    the categories are the active ones
// Returns { authors: [{ id, name, role }], categories }. The list still works when the choices cannot be loaded.
export function useArticleFilterChoices(area) {
  const { staff, admin } = area
  const [choices, setChoices] = useState({ authors: [], categories: [] })

  useEffect(() => {
    if (!staff) {
      return undefined
    }
    let current = true
    const load = admin
      ? Promise.all([
          userService.listUsers({ role: 'AUTHOR', size: 100 }),
          userService.listUsers({ role: 'ADMIN', size: 100 }),
          categoryService.listCategoriesForAdmin(),
        ]).then(([authors, admins, categories]) => ({
          authors: [...authors.items, ...admins.items].map((user) => ({ id: user.id, name: user.fullName || user.username, role: user.role })),
          categories: categories ?? [],
        }))
      : Promise.all([newsService.listManagedNews({ size: 50 }), categoryService.listActiveCategories()]).then(([articles, categories]) => {
          const seen = new Map()
          articles.items.forEach((article) => seen.set(article.authorId, article.authorName))
          return { authors: [...seen].map(([id, label]) => ({ id, name: label, role: null })), categories: categories ?? [] }
        })
    load
      .then((loaded) => {
        if (current) setChoices(loaded)
      })
      .catch(() => {
        // the list still works without the filter choices
      })
    return () => {
      current = false
    }
  }, [staff, admin])

  return choices
}
