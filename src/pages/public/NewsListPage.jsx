import { useSearchParams } from 'react-router-dom'
import NewsFilters from '../../components/news/NewsFilters'
import NewsResults from '../../components/news/NewsResults'
import { useActiveCategories } from '../../hooks/useActiveCategories'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useRemoteData } from '../../hooks/useRemoteData'
import * as publicNewsService from '../../services/publicNewsService'
import * as tagService from '../../services/tagService'

const PAGE_SIZE = 9
const FILTERS = ['keyword', 'category', 'tag', 'from', 'to']

// All published news with search and filters; every filter and the page live in the URL:
// /news?keyword=...&category=slug&tag=slug&from=yyyy-MM-dd&to=yyyy-MM-dd&page=2
export default function NewsListPage() {
  usePageMeta('News', 'Search and browse all published news.')
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1)
  const values = Object.fromEntries(FILTERS.map((name) => [name, searchParams.get(name) ?? '']))
  const filterKey = FILTERS.map((name) => values[name]).join('|')

  const { categories } = useActiveCategories()
  const tags = useRemoteData('tags', () => tagService.listTags())
  const news = useRemoteData(`${filterKey}|${page}`, () => publicNewsService.listPublicNews({ page, size: PAGE_SIZE, ...values }))

  const search = (next) => {
    const params = new URLSearchParams()
    FILTERS.forEach((name) => {
      if (next[name]) params.set(name, next[name])
    })
    setSearchParams(params) // a new search starts on page 1
  }

  const changePage = (number) => {
    const params = new URLSearchParams(searchParams)
    if (number > 1) {
      params.set('page', String(number))
    } else {
      params.delete('page')
    }
    setSearchParams(params)
  }

  return (
    <div>
      <h1 className="h3 mb-3">News</h1>
      <NewsFilters
        key={filterKey}
        values={values}
        categories={categories}
        tags={tags.data ?? []}
        onSubmit={search}
        onClear={() => setSearchParams(new URLSearchParams())}
      />
      <NewsResults state={news} onPage={changePage} emptyText="No news matches your search." />
    </div>
  )
}
