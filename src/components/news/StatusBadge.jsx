import { Badge } from 'react-bootstrap'
import { NEWS_STATUS } from '../../constants/newsStatus'

// Colours come from constants/newsStatus.js (DRAFT grey, PENDING yellow,
// PUBLISHED green, REJECTED red, ARCHIVED dark).
export default function StatusBadge({ status }) {
  const info = NEWS_STATUS[status]
  const variant = info?.variant ?? 'secondary'
  return (
    <Badge bg={variant} text={variant === 'warning' || variant === 'info' ? 'dark' : undefined}>
      {info?.label ?? status}
    </Badge>
  )
}
