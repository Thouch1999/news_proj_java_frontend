import { Button, Col, Collapse, Form, Offcanvas, Row } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useMediaQuery } from '../../hooks/useMediaQuery'

// The fields of "More filters": the tag (not on a tag page, which already is one) and a date range. Every change is
// applied at once: `onChange({ tag })`, `onChange({ from })`, `onChange({ to })`. `rangeError` says "From" is after "To".
function Fields({ tags, showTag, tag, from, to, rangeError, onChange }) {
  const { t } = useTranslation()
  return (
    <Row className="g-3">
      {showTag && (
        <Col xs={12} md={4}>
          <Form.Label htmlFor="filter-tag">{t('public.filters.tag')}</Form.Label>
          <Form.Select id="filter-tag" size="sm" value={tag} onChange={(event) => onChange({ tag: event.target.value })}>
            <option value="">{t('public.filters.all')}</option>
            {tags.map((item) => (
              <option key={item.id} value={item.slug}>
                #{item.name}
              </option>
            ))}
          </Form.Select>
        </Col>
      )}
      <Col xs={6} md={showTag ? 4 : 6}>
        <Form.Label htmlFor="filter-from">{t('public.filters.from')}</Form.Label>
        <Form.Control id="filter-from" type="date" size="sm" value={from} max={to || undefined} isInvalid={rangeError} onChange={(event) => onChange({ from: event.target.value })} />
      </Col>
      <Col xs={6} md={showTag ? 4 : 6}>
        <Form.Label htmlFor="filter-to">{t('public.filters.to')}</Form.Label>
        <Form.Control id="filter-to" type="date" size="sm" value={to} min={from || undefined} isInvalid={rangeError} onChange={(event) => onChange({ to: event.target.value })} />
      </Col>
      {rangeError && (
        <Col xs={12}>
          <div className="text-danger small" role="alert">
            {t('public.filters.rangeInvalid')}
          </div>
        </Col>
      )}
    </Row>
  )
}

// A small panel under the toolbar on a wide screen, an Offcanvas from the bottom on a phone.
export default function NewsFilterPanel({ open, onClose, ...fields }) {
  const { t } = useTranslation()
  const mobile = useMediaQuery('(max-width: 767.98px)')

  if (mobile) {
    return (
      <Offcanvas show={open} onHide={onClose} placement="bottom" aria-labelledby="more-filters-title">
        <Offcanvas.Header closeButton closeLabel={t('common.actions.close')}>
          <Offcanvas.Title id="more-filters-title" as="h2" className="h5">
            {t('public.filters.more')}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Fields {...fields} />
          <Button className="w-100 mt-4" onClick={onClose}>
            {t('public.filters.done')}
          </Button>
        </Offcanvas.Body>
      </Offcanvas>
    )
  }
  return (
    <Collapse in={open}>
      <div id="more-filters">
        <div className="news-filter-panel">
          <Fields {...fields} />
        </div>
      </div>
    </Collapse>
  )
}
