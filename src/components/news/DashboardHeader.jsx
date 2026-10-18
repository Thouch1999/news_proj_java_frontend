import { useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import { FileEarmarkPlus, PersonPlus } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import { useFormat } from '../../hooks/useFormat'
import { RANGE_PRESETS } from '../../utils/dashboardRange'

const PRESET_LABEL = { '7d': 'last7', '30d': 'last30', month: 'thisMonth', year: 'thisYear', custom: 'custom' }

// The top of a dashboard: a greeting by the time of day with today's date, the date range that every card below
// follows (it lives in the URL, see useDashboardRange) and the shortcuts. `area` says what the role may create.
export default function DashboardHeader({ area, range }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { formatLongDate } = useFormat()
  const [now] = useState(() => new Date())
  const hour = now.getHours()
  const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
  const name = user?.fullName || user?.username || ''

  return (
    <div className="mb-3">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
        <div>
          <h1 className="h4 mb-1">{t(`dashboard.overview.greeting.${part}`, { name })}</h1>
          <div className="text-muted small">{formatLongDate(now)}</div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <Form.Select size="sm" className="w-auto" aria-label={t('dashboard.overview.range.label')} value={range.preset} onChange={(event) => range.setPreset(event.target.value)}>
            {RANGE_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {t(`dashboard.overview.range.${PRESET_LABEL[preset]}`)}
              </option>
            ))}
          </Form.Select>
          {area.newPath && (
            <Button as={Link} to={area.newPath} size="sm">
              <FileEarmarkPlus className="me-1" aria-hidden="true" />
              {t('dashboard.overview.actions.createArticle')}
            </Button>
          )}
          {area.admin && (
            <Button as={Link} to={ROUTES.ADMIN_USER_NEW} size="sm" variant="outline-primary">
              <PersonPlus className="me-1" aria-hidden="true" />
              {t('dashboard.overview.actions.addUser')}
            </Button>
          )}
        </div>
      </div>
      {range.preset === 'custom' && (
        <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
          <Form.Label htmlFor="range-from" className="small mb-0">
            {t('dashboard.overview.range.from')}
          </Form.Label>
          <Form.Control id="range-from" type="date" size="sm" className="w-auto" value={range.customFrom} max={range.customTo || undefined} onChange={(event) => range.setCustom({ from: event.target.value, to: range.customTo })} />
          <Form.Label htmlFor="range-to" className="small mb-0">
            {t('dashboard.overview.range.to')}
          </Form.Label>
          <Form.Control id="range-to" type="date" size="sm" className="w-auto" value={range.customTo} min={range.customFrom || undefined} onChange={(event) => range.setCustom({ from: range.customFrom, to: event.target.value })} />
        </div>
      )}
      {range.problem && (
        <div className="text-danger small mt-2" role="alert">
          {t(`dashboard.overview.range.problem.${range.problem}`)}
        </div>
      )}
    </div>
  )
}
