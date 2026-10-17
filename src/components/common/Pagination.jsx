import { Pagination as BsPagination } from 'react-bootstrap'

// Server-side pagination control. `page` is 1-based.
export default function Pagination({ page, totalPages, onChange }) {
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
      <BsPagination.Prev disabled={page <= 1} onClick={() => onChange(page - 1)} />
      {first > 1 && <BsPagination.Item onClick={() => onChange(1)}>1</BsPagination.Item>}
      {first > 2 && <BsPagination.Ellipsis disabled />}
      {pages.map((number) => (
        <BsPagination.Item key={number} active={number === page} onClick={() => onChange(number)}>
          {number}
        </BsPagination.Item>
      ))}
      {last < totalPages - 1 && <BsPagination.Ellipsis disabled />}
      {last < totalPages && <BsPagination.Item onClick={() => onChange(totalPages)}>{totalPages}</BsPagination.Item>}
      <BsPagination.Next disabled={page >= totalPages} onClick={() => onChange(page + 1)} />
    </BsPagination>
  )
}
