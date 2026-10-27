import { Form } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { RANGE_PRESETS } from '../../utils/dashboardRange'

const PRESET_LABEL = { '7d': 'last7', '30d': 'last30', month: 'thisMonth', year: 'thisYear', custom: 'custom' }

// The date range of a statistics page: a preset (last 7 days, last 30 days, this month, this year) or custom days. It is
// the range of useDashboardRange (kept in the URL), with the same texts as the dashboards. `range` is what the hook returns.
export default function RangeControls({ range }) {
  const { t } = useTranslation()
  return (
    <div>
      <div className="d-flex flex-wrap align-items-center gap-2">
        <Form.Select size="sm" className="w-auto" aria-label={t('dashboard.overview.range.label')} value={range.preset} onChange={(event) => range.setPreset(event.target.value)}>
          {RANGE_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {t(`dashboard.overview.range.${PRESET_LABEL[preset]}`)}
            </option>
          ))}
        </Form.Select>
        {range.preset === 'custom' && (
          <>
            <Form.Label htmlFor="range-from" className="small mb-0">
              {t('dashboard.overview.range.from')}
            </Form.Label>
            <Form.Control id="range-from" type="date" size="sm" className="w-auto" value={range.customFrom} max={range.customTo || undefined} onChange={(event) => range.setCustom({ from: event.target.value, to: range.customTo })} />
            <Form.Label htmlFor="range-to" className="small mb-0">
              {t('dashboard.overview.range.to')}
            </Form.Label>
            <Form.Control id="range-to" type="date" size="sm" className="w-auto" value={range.customTo} min={range.customFrom || undefined} onChange={(event) => range.setCustom({ from: range.customFrom, to: event.target.value })} />
          </>
        )}
      </div>
      {range.problem && (
        <div className="text-danger small mt-2" role="alert">
          {t(`dashboard.overview.range.problem.${range.problem}`)}
        </div>
      )}
    </div>
  )
}
