import { useState } from 'react'
import { Badge, Button, ButtonGroup, Form } from 'react-bootstrap'
import { Funnel, X } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import SearchBox from '../common/SearchBox'
import { ACTIVITY_GROUPS, RANGE_PRESETS, actionsOfGroup } from '../../constants/activity'
import { useFormat } from '../../hooks/useFormat'

// The filters of the activity log, in one row: search (the title of an article, the name of a user), the person, the kind of
// action (grouped), the date range with its presets, and "Clear filters". Below 768px everything but the search is behind a
// "Filters" button. Nothing is kept here: the page owns the values (they live in the URL) and `onChange({ name: value })`
// changes one or more of them.
//   values: { keyword, actorId, action, range, from, to }   people: [{ id, name, role }]
export default function ActivityToolbar({ values, keyword, people, rangeError, active, chip, onChange, onClear }) {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  const [open, setOpen] = useState(false)
  const { actorId, action, range, from, to } = values

  // a person who is in the URL but not in the loaded list (more than 100 users, or a reader) still shows in the select
  const known = people.some((person) => String(person.id) === actorId)

  return (
    <div className="article-toolbar activity-toolbar p-3">
      <div className="d-flex flex-wrap align-items-center gap-2">
        <SearchBox value={keyword.value} onChange={keyword.setValue} label={t('activity.toolbar.searchLabel')} placeholder={t('activity.toolbar.search')} />
        <Button variant="outline-secondary" size="sm" className="d-md-none" aria-expanded={open} aria-controls="activity-filters" onClick={() => setOpen((value) => !value)}>
          <Funnel className="me-1" aria-hidden="true" />
          {t('news.list.toolbar.filters')}
          {active > 0 && (
            <Badge pill bg="primary" className="ms-2">
              {formatNumber(active)}
            </Badge>
          )}
        </Button>
        <div id="activity-filters" className={`${open ? 'd-flex' : 'd-none'} d-md-flex flex-column flex-md-row flex-wrap flex-grow-1 align-items-md-center gap-2`}>
          <Form.Select size="sm" className="w-auto-md" aria-label={t('activity.toolbar.person')} value={actorId} onChange={(event) => onChange({ actorId: event.target.value })}>
            <option value="">{t('activity.toolbar.allPeople')}</option>
            {actorId && !known && <option value={actorId}>{t('activity.toolbar.personFallback', { id: actorId })}</option>}
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.role ? `${person.name} (${t(`common.roles.${person.role}`, { defaultValue: person.role })})` : person.name}
              </option>
            ))}
          </Form.Select>
          <Form.Select size="sm" className="w-auto-md" aria-label={t('activity.toolbar.action')} value={action} onChange={(event) => onChange({ action: event.target.value })}>
            <option value="">{t('activity.toolbar.allActions')}</option>
            {ACTIVITY_GROUPS.map((group) => (
              <optgroup key={group} label={t(`activity.groups.${group}`)}>
                <option value={`group:${group}`}>{t('activity.toolbar.allOfGroup', { group: t(`activity.groups.${group}`) })}</option>
                {actionsOfGroup(group).map((name) => (
                  <option key={name} value={name}>
                    {t(`activity.actions.${name}`)}
                  </option>
                ))}
              </optgroup>
            ))}
          </Form.Select>
          <ButtonGroup size="sm" role="group" aria-label={t('activity.toolbar.range')} className="flex-wrap">
            {RANGE_PRESETS.map((preset) => (
              <Button key={preset.value || 'all'} variant={range === preset.value ? 'primary' : 'outline-secondary'} aria-pressed={range === preset.value} onClick={() => onChange(preset.value === 'custom' ? { range: 'custom' } : { range: preset.value, from: '', to: '' })}>
                {t(preset.labelKey)}
              </Button>
            ))}
          </ButtonGroup>
        </div>
        {active > 0 && (
          <Button variant="link" size="sm" className="p-0 ms-md-1" onClick={onClear}>
            {t('news.list.toolbar.clear')}
          </Button>
        )}
      </div>

      {(range === 'custom' || chip) && (
        <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
          {range === 'custom' && (
            <>
              <Form.Label htmlFor="activity-from" className="small text-muted mb-0">
                {t('public.filters.from')}
              </Form.Label>
              <Form.Control id="activity-from" type="date" size="sm" className="w-auto" value={from} max={to || undefined} isInvalid={rangeError} onChange={(event) => onChange({ from: event.target.value })} />
              <Form.Label htmlFor="activity-to" className="small text-muted mb-0">
                {t('public.filters.to')}
              </Form.Label>
              <Form.Control id="activity-to" type="date" size="sm" className="w-auto" value={to} min={from || undefined} isInvalid={rangeError} onChange={(event) => onChange({ to: event.target.value })} />
              {rangeError && (
                <span className="text-danger small" role="alert">
                  {t('public.filters.rangeInvalid')}
                </span>
              )}
            </>
          )}
          {chip && (
            <Badge bg="" className="filter-chip d-inline-flex align-items-center gap-2">
              <span>{chip.text}</span>
              <button type="button" className="tag-chip__remove" aria-label={t('activity.toolbar.removeTarget')} onClick={chip.onRemove}>
                <X aria-hidden="true" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
