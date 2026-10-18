import { Pagination as BsPagination } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useFormat } from '../../hooks/useFormat'

// Server-side pagination control. `page` is 1-based.
export default function Pagination({ page, totalPages, onChange }) {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  if (totalPages <= 1) {
    return null
  }
  const first = Math.max(1, Math.min(page - 2, totalPages - 4))
  const last = Math.min(totalPages, first + 4)
  const pages = []
  for (let number = first; number <= last; number += 1) {
    pages.push(number)
  }

  return (
    <BsPagination className="mb-0">
      <BsPagination.Prev label={t('common.actions.previous')} disabled={page <= 1} onClick={() => onChange(page - 1)} />
      {first > 1 && <BsPagination.Item onClick={() => onChange(1)}>{formatNumber(1)}</BsPagination.Item>}
      {first > 2 && <BsPagination.Ellipsis label={t('common.pagination.more')} disabled />}
      {pages.map((number) => (
        <BsPagination.Item key={number} active={number === page} activeLabel={t('common.pagination.current')} onClick={() => onChange(number)}>
          {formatNumber(number)}
        </BsPagination.Item>
      ))}
      {last < totalPages - 1 && <BsPagination.Ellipsis label={t('common.pagination.more')} disabled />}
      {last < totalPages && <BsPagination.Item onClick={() => onChange(totalPages)}>{formatNumber(totalPages)}</BsPagination.Item>}
      <BsPagination.Next label={t('common.actions.next')} disabled={page >= totalPages} onClick={() => onChange(page + 1)} />
    </BsPagination>
  )
}
