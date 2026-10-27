import { Fragment, useState } from 'react'
import { Button, Card, Col, Row, Spinner, Table, Toast, ToastContainer } from 'react-bootstrap'
import { Download } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { MEDIA_IMAGE } from '../../constants/promo'
import AreaChart from '../../components/common/AreaChart'
import ErrorAlert from '../../components/common/ErrorAlert'
import PageSpinner from '../../components/common/PageSpinner'
import StatCard from '../../components/common/StatCard'
import RangeControls from '../../components/partners/RangeControls'
import { adminPartnerPath, ROUTES } from '../../constants/routes'
import { useDashboardRange } from '../../hooks/useDashboardRange'
import { useFormat } from '../../hooks/useFormat'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useRemoteData } from '../../hooks/useRemoteData'
import * as partnerService from '../../services/partnerService'
import { downloadBlob } from '../../utils/activity'
import { errorMessage } from '../../utils/errorMessage'

// The statistics of one sponsor: the range, three cards (views, clicks, click rate), a chart of the views and the clicks of
// each day, the numbers by placement and the CSV export. When the sponsor uses a video (or has plays in the range) there are
// also the video plays and the completion rate (completions per 100 plays). The days are UTC days, as the backend counts them.
export default function PartnerStatsPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const range = useDashboardRange()
  const { formatNumber, formatPercent, formatDay, formatLongDate } = useFormat()
  const { data, error, loading } = useRemoteData(`${id}|${range.from}|${range.to}`, () => partnerService.getPartnerStats(id, { from: range.from, to: range.to }))
  // the sponsor itself tells whether it uses a video (a failure here only hides the video numbers of a sponsor without plays)
  const { data: partner } = useRemoteData(`partner|${id}`, () => partnerService.getPartner(id).catch(() => null))
  const usesVideo = (data?.totals.videoPlays ?? 0) > 0 || Boolean(partner?.creatives.some((creative) => (creative.mediaType ?? MEDIA_IMAGE) !== MEDIA_IMAGE))
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState(null)
  usePageMeta(t('dashboard.partners.stats.title', { name: data?.sponsorName ?? '' }))

  const exportCsv = async () => {
    setExporting(true)
    try {
      downloadBlob(await partnerService.exportPartnerStats({ id, from: range.from, to: range.to }), `promo-stats-${id}-${range.from}-${range.to}.csv`)
      setToast({ variant: 'success', text: t('dashboard.partners.stats.exported') })
    } catch (caught) {
      setToast({ variant: 'danger', text: errorMessage(caught) })
    } finally {
      setExporting(false)
    }
  }

  const points = (data?.byDay ?? []).map((day) => ({
    label: formatLongDate(`${day.date}T00:00:00`),
    short: formatDay(day.date),
    a: day.impressions,
    b: day.clicks,
  }))

  return (
    <div>
      <Link to={ROUTES.ADMIN_PARTNERS} className="small">
        &larr; {t('dashboard.partners.stats.back')}
      </Link>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mt-1 mb-3">
        <h1 className="h4 mb-0">{t('dashboard.partners.stats.title', { name: data?.sponsorName ?? '' })}</h1>
        <div className="d-flex flex-wrap align-items-start gap-2">
          <RangeControls range={range} />
          <Button variant="outline-primary" size="sm" disabled={exporting || Boolean(error)} onClick={exportCsv}>
            {exporting ? <Spinner size="sm" animation="border" className="me-1" /> : <Download className="me-1" aria-hidden="true" />}
            {t('dashboard.partners.stats.export')}
          </Button>
        </div>
      </div>

      {error && (
        <>
          <ErrorAlert error={error} message={error.code === 404 ? t('dashboard.partners.stats.notFound') : undefined} />
          <Link to={adminPartnerPath(id)}>{t('dashboard.partners.actions.edit')}</Link>
        </>
      )}
      {loading && <PageSpinner />}

      {data && (
        <>
          <Row className="g-3 mb-3">
            <Col sm={4}>
              <StatCard title={t('dashboard.partners.stats.views')} value={data.totals.impressions} />
            </Col>
            <Col sm={4}>
              <StatCard title={t('dashboard.partners.stats.clicks')} value={data.totals.clicks} />
            </Col>
            <Col sm={4}>
              <StatCard title={t('dashboard.partners.stats.rate')} value={formatPercent(data.totals.clickRate)} />
            </Col>
          </Row>
          {usesVideo && (
            <Row className="g-3 mb-3">
              <Col sm={6}>
                <StatCard title={t('dashboard.partners.stats.plays')} value={data.totals.videoPlays} />
              </Col>
              <Col sm={6}>
                <StatCard title={t('dashboard.partners.stats.completion')} value={formatPercent(data.totals.completionRate)}>
                  <div className="small text-muted">{t('dashboard.partners.stats.completions', { formatted: formatNumber(data.totals.videoCompletes) })}</div>
                </StatCard>
              </Col>
            </Row>
          )}

          <Card className="mb-3">
            <Card.Header className="bg-surface d-flex flex-wrap justify-content-between align-items-center gap-2">
              <h2 className="h6 mb-0">{t('dashboard.partners.stats.chart')}</h2>
              <span className="small d-inline-flex gap-3">
                <span>
                  <span className="legend-dot legend-dot--a" /> {t('dashboard.partners.stats.views')}
                </span>
                <span>
                  <span className="legend-dot legend-dot--b" /> {t('dashboard.partners.stats.clicks')}
                </span>
              </span>
            </Card.Header>
            <Card.Body>
              <AreaChart points={points} seriesA={{ name: t('dashboard.partners.stats.views') }} seriesB={{ name: t('dashboard.partners.stats.clicks') }} ariaLabel={t('dashboard.partners.stats.chartLabel')} />
              {data.totals.impressions === 0 && <p className="text-muted small text-center mt-2 mb-0">{t('dashboard.partners.stats.noData')}</p>}
              <p className="text-muted small mt-2 mb-0">{t('dashboard.partners.stats.timeNote')}</p>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header className="bg-surface">
              <h2 className="h6 mb-0">{t('dashboard.partners.stats.byPlacement')}</h2>
            </Card.Header>
            <div className="table-responsive">
              <Table className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>{t('dashboard.partners.stats.placement')}</th>
                    <th className="text-end">{t('dashboard.partners.stats.views')}</th>
                    <th className="text-end">{t('dashboard.partners.stats.clicks')}</th>
                    <th className="text-end">{t('dashboard.partners.stats.rate')}</th>
                    {usesVideo && <th className="text-end">{t('dashboard.partners.stats.plays')}</th>}
                    {usesVideo && <th className="text-end">{t('dashboard.partners.stats.completion')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.byPlacement.map((row) => (
                    <Fragment key={row.placement}>
                      <tr>
                        <th scope="row" className="fw-semibold">
                          {t(`dashboard.partners.placements.${row.placement}`)}
                        </th>
                        <td className="text-end">{formatNumber(row.impressions)}</td>
                        <td className="text-end">{formatNumber(row.clicks)}</td>
                        <td className="text-end">{formatPercent(row.clickRate)}</td>
                        {usesVideo && <td className="text-end">{formatNumber(row.videoPlays)}</td>}
                        {usesVideo && <td className="text-end">{formatPercent(row.completionRate)}</td>}
                      </tr>
                      {/* the popup is shown on computers and as the bar of a phone: compared here */}
                      {row.placement === 'ARTICLE_POPUP' &&
                        (data.byDevice ?? []).map((device) => (
                          <tr key={device.device} className="text-muted">
                            <td className="ps-4">{t(`dashboard.partners.stats.devices.${device.device}`)}</td>
                            <td className="text-end">{formatNumber(device.impressions)}</td>
                            <td className="text-end">{formatNumber(device.clicks)}</td>
                            <td className="text-end">{formatPercent(device.clickRate)}</td>
                            {usesVideo && <td className="text-end">{formatNumber(device.videoPlays)}</td>}
                            {usesVideo && <td className="text-end">{formatPercent(device.completionRate)}</td>}
                          </tr>
                        ))}
                    </Fragment>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        </>
      )}

      <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 2000 }}>
        <Toast bg={toast?.variant ?? 'success'} show={Boolean(toast)} onClose={() => setToast(null)} delay={5000} autohide>
          <Toast.Body className="text-white d-flex justify-content-between gap-3">
            <span>{toast?.text}</span>
            <button type="button" className="btn-close btn-close-white" aria-label={t('common.actions.close')} onClick={() => setToast(null)} />
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  )
}
