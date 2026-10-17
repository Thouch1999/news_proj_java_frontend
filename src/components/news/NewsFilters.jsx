import { useState } from 'react'
import { Button, Col, Form, Row } from 'react-bootstrap'
import { Search } from 'react-bootstrap-icons'

// The search form of the news list: keyword, category, tag and a date range. Nothing changes until the user
// presses Search (or Enter). `values` are the filters now in the URL; mount it with a `key` that changes with them
// so the boxes follow the URL (Clear, browser back). `onSubmit(values)` and `onClear()` are called by the form.
export default function NewsFilters({ values, categories, tags, onSubmit, onClear }) {
  const [draft, setDraft] = useState(values)
  const change = (field, value) => setDraft((current) => ({ ...current, [field]: value }))
  const rangeInvalid = Boolean(draft.from && draft.to && draft.from > draft.to)
  const hasFilters = Object.values(values).some(Boolean)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!rangeInvalid) {
      onSubmit({ ...draft, keyword: draft.keyword.trim() })
    }
  }

  return (
    <Form onSubmit={handleSubmit} className="bg-white border rounded p-3 mb-4" role="search" noValidate>
      <Row className="g-3 align-items-end">
        <Col xs={12} lg={4}>
          <Form.Label htmlFor="filter-keyword">Search</Form.Label>
          <Form.Control id="filter-keyword" type="search" maxLength={100} placeholder="Title, summary or content" value={draft.keyword} onChange={(event) => change('keyword', event.target.value)} />
        </Col>
        <Col xs={6} lg={2}>
          <Form.Label htmlFor="filter-category">Category</Form.Label>
          <Form.Select id="filter-category" value={draft.category} onChange={(event) => change('category', event.target.value)}>
            <option value="">All</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={6} lg={2}>
          <Form.Label htmlFor="filter-tag">Tag</Form.Label>
          <Form.Select id="filter-tag" value={draft.tag} onChange={(event) => change('tag', event.target.value)}>
            <option value="">All</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.slug}>
                {tag.name}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={6} lg={2}>
          <Form.Label htmlFor="filter-from">From</Form.Label>
          <Form.Control id="filter-from" type="date" value={draft.from} max={draft.to || undefined} isInvalid={rangeInvalid} onChange={(event) => change('from', event.target.value)} />
        </Col>
        <Col xs={6} lg={2}>
          <Form.Label htmlFor="filter-to">To</Form.Label>
          <Form.Control id="filter-to" type="date" value={draft.to} min={draft.from || undefined} isInvalid={rangeInvalid} onChange={(event) => change('to', event.target.value)} />
        </Col>
      </Row>
      {rangeInvalid && <div className="text-danger small mt-2">The "From" date must not be after the "To" date.</div>}
      <div className="d-flex gap-2 mt-3">
        <Button type="submit" disabled={rangeInvalid}>
          <Search className="me-1" />
          Search
        </Button>
        {hasFilters && (
          <Button type="button" variant="outline-secondary" onClick={onClear}>
            Clear
          </Button>
        )}
      </div>
    </Form>
  )
}
