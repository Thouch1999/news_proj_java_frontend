import { useRef, useState } from 'react'
import { Breadcrumb, Button, Col, Row } from 'react-bootstrap'
import { Funnel, GridFill, ListUl, Newspaper, X } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorState } from '../common/ListStates'
import Pagination from '../common/Pagination'
import SearchBox from '../common/SearchBox'
import { categoryPath, ROUTES, tagPath } from '../../constants/routes'
import { useActiveCategories } from '../../hooks/useActiveCategories'
import { useFormat } from '../../hooks/useFormat'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useRemoteData } from '../../hooks/useRemoteData'
import { useUrlKeyword } from '../../hooks/useUrlKeyword'
import * as publicNewsService from '../../services/publicNewsService'
import * as tagService from '../../services/tagService'
import NewsCard from './NewsCard'
import NewsFilterPanel from './NewsFilterPanel'
import NewsListItem, { NewsRowsSkeleton } from './NewsListItem'
import NewsListSidebar from './NewsListSidebar'

const VIEW_KEY = 'news-list-view'
const readView = () => {
  try {
    return localStorage.getItem(VIEW_KEY) === 'grid' ? 'grid' : 'list'
  } catch {
    return 'list'
  }
}

// The news list page, also the category page, the tag page and the search results (one layout for all of them).
//   scope: { kind: 'all' } | { kind: 'category' | 'tag', slug, term }   `term` is the loaded category / tag ({ name, description })
// Everything lives in the URL and applies at once: ?keyword=&category=&tag=&from=&to=&page= (on a category page the
// category is the path, on a tag page the tag is). The sort is not offered: the backend always sorts newest first.
export default function NewsBrowser({ scope }) {
  const { t } = useTranslation()
  const { formatDate, formatNumber } = useFormat()
  const [params, setParams] = useSearchParams()
  const page = Math.max(parseInt(params.get('page') ?? '1', 10) || 1, 1)
  const category = scope.kind === 'category' ? scope.slug : (params.get('category') ?? '')
  const tag = scope.kind === 'tag' ? scope.slug : (params.get('tag') ?? '')
  const keyword = params.get('keyword') ?? ''
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''

  const { categories } = useActiveCategories()
  const tags = useRemoteData('tags', () => tagService.listTags().catch(() => []))
  const [tick, setTick] = useState(0)
  const news = useRemoteData(`${category}|${tag}|${keyword}|${from}|${to}|${page}|${tick}`, () => publicNewsService.listPublicNews({ page, keyword, category, tag, from, to }))

  const search = useUrlKeyword()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [rangeError, setRangeError] = useState(false)
  const [view, setView] = useState(readView)
  const top = useRef(null)

  // ---- the URL ----
  const change = (changes) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([name, value]) => (value ? next.set(name, value) : next.delete(name)))
    if (!('page' in changes)) next.delete('page')
    setParams(next)
  }
  const changeFilter = (changes) => {
    const range = { from, to, ...changes }
    if (range.from && range.to && range.from > range.to) {
      setRangeError(true) // a range the backend would refuse is not applied
      return
    }
    setRangeError(false)
    change(changes)
  }
  const changePage = (number) => {
    change({ page: number > 1 ? String(number) : '' })
    top.current?.scrollIntoView({ block: 'start' })
  }
  const clearAll = () => {
    search.setValue(null)
    setRangeError(false)
    change({ keyword: '', from: '', to: '', ...(scope.kind !== 'category' && { category: '' }), ...(scope.kind !== 'tag' && { tag: '' }) })
  }
  // the search of the URL without page, for the links of the chips
  const carry = new URLSearchParams(params)
  carry.delete('page')
  const link = (pathname, extra = {}) => {
    const next = new URLSearchParams(carry)
    Object.entries(extra).forEach(([name, value]) => (value ? next.set(name, value) : next.delete(name)))
    const text = next.toString()
    return { pathname, search: text ? `?${text}` : '' }
  }
  // a category chip: another category page on a category page, otherwise the same page with ?category=
  const chipTarget = (slug) => (scope.kind === 'category' ? link(slug ? categoryPath(slug) : ROUTES.NEWS) : link(scope.kind === 'tag' ? tagPath(scope.slug) : ROUTES.NEWS, { category: slug }))

  const chooseView = (value) => {
    setView(value)
    try {
      localStorage.setItem(VIEW_KEY, value)
    } catch {
      // blocked storage: the choice lasts until the page is closed
    }
  }

  // ---- what the page says about itself ----
  const termName = scope.term?.name
  const title = scope.kind === 'tag' ? `#${termName}` : scope.kind === 'category' ? termName : keyword ? t('public.list.resultsFor', { keyword }) : t('public.list.allNews')
  usePageMeta(scope.kind === 'all' ? t('public.list.title') : title, scope.term?.description || (termName ? t('public.term.description', { name: termName }) : t('public.list.description')))

  const nameOf = (list, slug) => list.find((item) => item.slug === slug)?.name ?? slug
  const chips = [
    keyword && { id: 'keyword', label: t('public.active.keyword', { keyword }), remove: () => { search.setValue(null); change({ keyword: '' }) } },
    scope.kind !== 'category' && category && { id: 'category', label: nameOf(categories, category), remove: () => change({ category: '' }) },
    scope.kind !== 'tag' && tag && { id: 'tag', label: `#${nameOf(tags.data ?? [], tag)}`, remove: () => change({ tag: '' }) },
    from && { id: 'from', label: t('public.active.from', { date: formatDate(`${from}T00:00:00`) }), remove: () => changeFilter({ from: '' }) },
    to && { id: 'to', label: t('public.active.to', { date: formatDate(`${to}T00:00:00`) }), remove: () => changeFilter({ to: '' }) },
  ].filter(Boolean)
  const moreCount = [scope.kind !== 'tag' && tag, from, to].filter(Boolean).length
  const { data, error, loading } = news

  const empty = () => {
    if (chips.length > 0) {
      return (
        <EmptyState icon={Newspaper} text={t('public.list.emptyFiltered')}>
          <Button variant="outline-primary" size="sm" onClick={clearAll}>
            {t('public.active.clearAll')}
          </Button>
        </EmptyState>
      )
    }
    if (scope.kind === 'all') return <EmptyState icon={Newspaper} text={t('public.home.empty')} />
    return (
      <EmptyState icon={Newspaper} text={t(scope.kind === 'tag' ? 'public.term.emptyTag' : 'public.term.emptyCategory')}>
        <Button as={Link} to={ROUTES.NEWS} variant="outline-primary" size="sm">
          {t('public.home.allNews')}
        </Button>
      </EmptyState>
    )
  }

  return (
    <div>
      <Breadcrumb listProps={{ className: 'small mb-3' }} aria-label={t('public.breadcrumb.label')}>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: ROUTES.HOME }}>
          {t('public.breadcrumb.home')}
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{scope.kind === 'all' ? t('public.breadcrumb.news') : scope.kind === 'tag' ? `#${termName}` : termName}</Breadcrumb.Item>
      </Breadcrumb>

      <div ref={top} className="news-page-title">
        <h1 className="news-title">{title}</h1>
        {data && (
          <span className="news-page-title__count" aria-live="polite">
            {t('public.list.count', { count: data.totalElements, formatted: formatNumber(data.totalElements) })}
          </span>
        )}
      </div>
      {scope.term?.description && <p className="text-muted">{scope.term.description}</p>}

      {categories.length > 0 && (
        <nav className="chip-row mb-3" aria-label={t('public.filters.category')}>
          <Link to={chipTarget('')} className="filter-chip" aria-current={!category ? 'true' : undefined}>
            {t('public.filters.all')}
          </Link>
          {categories.map((item) => (
            <Link key={item.id} to={chipTarget(item.slug)} className="filter-chip" aria-current={item.slug === category ? 'true' : undefined}>
              {item.name}
            </Link>
          ))}
        </nav>
      )}

      <div className="news-toolbar d-flex flex-wrap align-items-center gap-2 mb-3">
        <form
          role="search"
          className="flex-grow-1"
          onSubmit={(event) => {
            event.preventDefault()
            search.commit()
          }}
        >
          <SearchBox value={search.value} onChange={search.setValue} label={t('common.actions.search')} placeholder={t('public.filters.searchPlaceholder')} />
        </form>
        <Button variant="outline-secondary" size="sm" className="d-inline-flex align-items-center gap-1" aria-expanded={filtersOpen} aria-controls="more-filters" onClick={() => setFiltersOpen((value) => !value)}>
          <Funnel aria-hidden="true" />
          {t('public.filters.more')}
          {moreCount > 0 && <span className="news-count-badge">{formatNumber(moreCount)}</span>}
        </Button>
        <div className="btn-group" role="group" aria-label={t('public.view.label')}>
          <Button variant="outline-secondary" size="sm" active={view === 'list'} aria-pressed={view === 'list'} aria-label={t('public.view.list')} title={t('public.view.list')} onClick={() => chooseView('list')}>
            <ListUl aria-hidden="true" />
          </Button>
          <Button variant="outline-secondary" size="sm" active={view === 'grid'} aria-pressed={view === 'grid'} aria-label={t('public.view.grid')} title={t('public.view.grid')} onClick={() => chooseView('grid')}>
            <GridFill aria-hidden="true" />
          </Button>
        </div>
      </div>
      <NewsFilterPanel open={filtersOpen} onClose={() => setFiltersOpen(false)} tags={tags.data ?? []} showTag={scope.kind !== 'tag'} tag={tag} from={from} to={to} rangeError={rangeError} onChange={changeFilter} />

      {chips.length > 0 && (
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3" role="group" aria-label={t('public.active.label')}>
          {chips.map((chip) => (
            <button key={chip.id} type="button" className="filter-chip filter-chip--active-filter" aria-label={t('public.active.remove', { label: chip.label })} onClick={chip.remove}>
              {chip.label}
              <X aria-hidden="true" size={18} />
            </button>
          ))}
          <Button variant="link" size="sm" className="p-0 ms-1" onClick={clearAll}>
            {t('public.active.clearAll')}
          </Button>
        </div>
      )}

      <Row className="g-4">
        <Col lg={8}>
          {loading && <NewsRowsSkeleton />}
          {error && <ErrorState error={error} onRetry={() => setTick((value) => value + 1)} />}
          {data && data.items.length === 0 && empty()}
          {data && data.items.length > 0 && (
            <>
              {view === 'grid' ? (
                <Row xs={1} sm={2} className="g-4">
                  {data.items.map((item) => (
                    <Col key={item.id}>
                      <NewsCard news={item} showTags={false} />
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="news-rows">
                  {data.items.map((item) => (
                    <NewsListItem key={item.id} news={item} />
                  ))}
                </div>
              )}
              <div className="d-flex justify-content-center mt-4">
                <Pagination page={data.page} totalPages={data.totalPages} onChange={changePage} />
              </div>
            </>
          )}
        </Col>
        <Col lg={4}>
          <NewsListSidebar categories={categories} tags={tags.data ?? []} activeCategory={category} />
        </Col>
      </Row>
    </div>
  )
}
