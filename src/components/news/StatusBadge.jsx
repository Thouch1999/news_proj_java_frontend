import { Badge } from 'react-bootstrap'
import { Clock } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { NEWS_STATUS } from '../../constants/newsStatus'

// Colours come from constants/newsStatus.js (DRAFT grey, PENDING yellow, SCHEDULED blue with a clock, PUBLISHED green,
// REJECTED red, ARCHIVED dark).
export default function StatusBadge({ status }) {
  const { t } = useTranslation()
  const info = NEWS_STATUS[status]
  const variant = info?.variant ?? 'secondary'
  return (
    <Badge bg={variant} text={variant === 'warning' || variant === 'info' ? 'dark' : undefined} className={status === 'SCHEDULED' ? 'd-inline-flex align-items-center gap-1' : undefined}>
      {status === 'SCHEDULED' && <Clock aria-hidden="true" />}
      {info ? t(info.labelKey) : status}
    </Badge>
  )
}
