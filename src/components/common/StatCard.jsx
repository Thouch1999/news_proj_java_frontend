import { Card } from 'react-bootstrap'
import { useFormat } from '../../hooks/useFormat'

// A dashboard card: a title, one big number and optional details under it.
export default function StatCard({ title, value, children }) {
  const { formatNumber } = useFormat()
  return (
    <Card body className="h-100">
      <div className="text-muted small text-uppercase fw-semibold">{title}</div>
      <div className="display-6 fw-semibold lh-sm my-1">{typeof value === 'number' ? formatNumber(value) : value}</div>
      {children}
    </Card>
  )
}
