import { useId, useMemo, useState } from 'react'
import { Badge, Form } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

// Tags as chips with a search field: type to filter the existing tags, Enter or a click adds one, the x (or Backspace in
// the empty field) removes one. Built with React-Bootstrap only.
//   tags: [{ id, name }] every tag that exists   value: the selected ids   onChange(ids)
export default function TagPicker({ id, tags, value, onChange, invalid = false }) {
  const { t } = useTranslation()
  const listId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const selected = value.map((tagId) => tags.find((tag) => tag.id === tagId)).filter(Boolean)
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return tags.filter((tag) => !value.includes(tag.id) && tag.name.toLowerCase().includes(needle))
  }, [tags, value, query])

  const add = (tag) => {
    onChange([...value, tag.id])
    setQuery('')
    setActive(0)
  }
  const remove = (tagId) => onChange(value.filter((item) => item !== tagId))

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((current) => Math.min(current + 1, Math.max(matches.length - 1, 0)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault() // never submit the article form from here
      if (open && matches[active]) add(matches[active])
    } else if (event.key === 'Escape') {
      setOpen(false)
    } else if (event.key === 'Backspace' && query === '' && value.length > 0) {
      remove(value[value.length - 1])
    }
  }

  return (
    <div className="tag-picker position-relative">
      <div className={`tag-picker__box form-control d-flex flex-wrap align-items-center gap-1${invalid ? ' is-invalid' : ''}`}>
        {selected.map((tag) => (
          <Badge key={tag.id} bg="" className="tag-chip d-inline-flex align-items-center gap-1">
            {tag.name}
            <button type="button" className="tag-chip__remove" aria-label={t('news.editor.tagRemove', { name: tag.name })} onClick={() => remove(tag.id)}>
              &times;
            </button>
          </Badge>
        ))}
        <Form.Control
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={t('news.editor.fields.tags')}
          autoComplete="off"
          className="tag-picker__input border-0 shadow-none p-0 flex-grow-1"
          placeholder={selected.length === 0 ? t('news.editor.tagsPlaceholder') : ''}
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
      {open && (
        <ul id={listId} role="listbox" className="tag-picker__list list-unstyled mb-0 shadow-sm">
          {matches.length === 0 && <li className="text-muted small px-3 py-2">{tags.length === 0 ? t('news.editor.noTags') : t('news.editor.tagsNoMatch')}</li>}
          {matches.map((tag, index) => (
            <li
              key={tag.id}
              role="option"
              aria-selected={index === active}
              className={`tag-picker__option px-3 py-2${index === active ? ' is-active' : ''}`}
              onMouseDown={(event) => {
                event.preventDefault() // keep the focus in the field
                add(tag)
              }}
              onMouseEnter={() => setActive(index)}
            >
              {tag.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
