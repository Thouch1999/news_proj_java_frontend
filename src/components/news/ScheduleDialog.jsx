import { useState } from 'react'
import { Button, Col, Form, Row } from 'react-bootstrap'
import { Clock } from 'react-bootstrap-icons'
import { Trans, useTranslation } from 'react-i18next'
import ConfirmDialog from '../common/ConfirmDialog'
import ErrorAlert from '../common/ErrorAlert'
import { useFormat } from '../../hooks/useFormat'
import { useNow } from '../../hooks/useNow'
import { SCHEDULE_MAX_DAYS, dateFromInputs, dateInputValue, quickChoices, scheduleProblem, timeInputValue, timeZoneLabel } from '../../utils/schedule'

// Chooses the time an article goes live. The fields are in the local time of the browser (native date and time inputs) with
// the time zone named under them; `onConfirm(isoString)` gets the chosen time as a UTC instant, which is what the backend
// takes. The rules (5 minutes to 1 year ahead) are the backend's; whatever it still refuses is shown in the dialog (`error`).
//   article: the article (its scheduledAt, when there is one, is the first value: "Change time")
// Mount it with a `key` that changes per article and action so the fields start from the right value.
export default function ScheduleDialog({ show, article, change = false, busy, error, onConfirm, onCancel }) {
  const { t, i18n } = useTranslation()
  const { formatSchedule, formatUntil } = useFormat()
  const now = useNow(15000)

  const [initial] = useState(() => {
    const current = article?.scheduledAt ? new Date(article.scheduledAt) : null
    if (current && !Number.isNaN(current.getTime())) return current
    const tomorrow = new Date()
    return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1, 7, 0)
  })
  const [day, setDay] = useState(dateInputValue(initial))
  const [time, setTime] = useState(timeInputValue(initial))

  const date = dateFromInputs(day, time)
  const problem = scheduleProblem(date, now)
  const zone = timeZoneLabel(i18n.language, date ?? new Date(now))
  const limit = new Date(now + SCHEDULE_MAX_DAYS * 86400000)
  const choices = quickChoices(now)
  const label = change ? t('news.schedule.changeTitle') : t('news.schedule.title')

  const pick = (choice) => {
    setDay(dateInputValue(choice))
    setTime(timeInputValue(choice))
  }
  // `now` is renewed every 15 seconds; a time that fell out of the window since is refused by the backend and shown in the dialog
  const confirm = () => {
    if (date && !problem) onConfirm(date.toISOString())
  }

  return (
    <ConfirmDialog show={show} title={label} confirmLabel={t('news.schedule.confirm')} busy={busy} confirmDisabled={Boolean(problem)} onCancel={onCancel} onConfirm={confirm}>
      <ErrorAlert error={error} />
      <p>
        <Trans i18nKey="news.schedule.intro" values={{ title: article?.title }} components={{ strong: <strong /> }} />
      </p>

      {choices.length > 0 && (
        <div className="mb-3">
          <div className="small text-muted mb-1" id="schedule-quick">
            {t('news.schedule.quick')}
          </div>
          <div className="d-flex flex-wrap gap-2" role="group" aria-labelledby="schedule-quick">
            {choices.map((choice) => (
              <Button key={choice.key} type="button" size="sm" variant="outline-primary" onClick={() => pick(choice.date)}>
                {t(`news.schedule.choices.${choice.key}`)}
              </Button>
            ))}
          </div>
        </div>
      )}

      <Row className="g-2">
        <Col sm={7}>
          <Form.Group controlId="schedule-date">
            <Form.Label>{t('news.schedule.date')}</Form.Label>
            <Form.Control type="date" value={day} min={dateInputValue(new Date(now))} max={dateInputValue(limit)} isInvalid={Boolean(problem) && !date} onChange={(event) => setDay(event.target.value)} />
          </Form.Group>
        </Col>
        <Col sm={5}>
          <Form.Group controlId="schedule-time">
            <Form.Label>{t('news.schedule.time')}</Form.Label>
            <Form.Control type="time" value={time} isInvalid={Boolean(problem) && !date} onChange={(event) => setTime(event.target.value)} />
          </Form.Group>
        </Col>
      </Row>
      <p className="text-muted small mt-2 mb-2">{t('news.schedule.zone', { zone })}</p>

      <p className={`small mb-0 d-flex align-items-start gap-2 ${problem ? 'text-danger' : ''}`} role="status" aria-live="polite">
        <Clock aria-hidden="true" className="flex-shrink-0 mt-1" />
        <span>{problem ? t(`news.schedule.problems.${problem}`) : t('news.schedule.goesLive', { relative: formatUntil(date, now), date: formatSchedule(date) })}</span>
      </p>
    </ConfirmDialog>
  )
}
