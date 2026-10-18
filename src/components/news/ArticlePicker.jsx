import { useEffect, useId, useState } from 'react'
import { Form, Spinner } from 'react-bootstrap'
import { Search } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import * as publicNewsService from '../../services/publicNewsService'

const DEBOUNCE = 300
const RESULTS = 8

// Pick an article by typing a part of its title: the results come from the public news search (title, summary and
// content, Khmer works), so only PUBLISHED articles are found. Arrow keys and Enter, or a click, choose one.
// `onPick({ id, title })`
export default function ArticlePicker({ onPick }) {
  const { t } = useTranslation()
  const listId = useId()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [state, setState] = useState({ keyword: null, items: [], failed: false })

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), DEBOUNCE)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!debounced) return undefined
    let current = true
    publicNewsService
      .listPublicNews({ keyword: debounced, size: RESULTS })
      .then((data) => current && setState({ keyword: debounced, items: data.items, failed: false }))
      .catch(() => current && setState({ keyword: debounced, items: [], failed: true }))
    return () => {
      current = false
    }
  }, [debounced])

  const typed = query.trim()
  const loading = Boolean(typed) && (debounced !== typed || state.keyword !== typed)
  const items = typed && state.keyword === typed ? state.items : []

  const choose = (article) => {
    onPick({ id: article.id, title: article.title })
    setQuery('')
    setOpen(false)
  }
  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((current) => Math.min(current + 1, Math.max(items.length - 1, 0)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (open && items[active]) choose(items[active])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="article-picker position-relative">
      <div className="position-relative">
        <Search aria-hidden="true" className="article-picker__icon" />
        <Form.Control
          type="search"
          size="sm"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={t('news.comments.moderation.picker.label')}
          autoComplete="off"
          className="article-picker__input"
          placeholder={t('news.comments.moderation.picker.placeholder')}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
      </div>
      {open && typed && (
        <ul id={listId} role="listbox" className="tag-picker__list list-unstyled mb-0 shadow-sm">
          {loading && (
            <li className="text-muted small px-3 py-2 d-flex align-items-center gap-2">
              <Spinner size="sm" animation="border" /> {t('common.loading')}
            </li>
          )}
          {!loading && items.length === 0 && <li className="text-muted small px-3 py-2">{state.failed ? t('errors.generic') : t('news.comments.moderation.picker.noResults')}</li>}
          {!loading &&
            items.map((article, index) => (
              <li
                key={article.id}
                role="option"
                aria-selected={index === active}
                className={`tag-picker__option px-3 py-2${index === active ? ' is-active' : ''}`}
                onMouseDown={(event) => {
                  event.preventDefault()
                  choose(article)
                }}
                onMouseEnter={() => setActive(index)}
              >
                <div className="news-title">{article.title}</div>
                {article.categoryName && <div className="small text-muted">{article.categoryName}</div>}
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
