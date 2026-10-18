import { Form } from 'react-bootstrap'
import { Search } from 'react-bootstrap-icons'

// A search field with an icon, for the toolbar of a list
export default function SearchBox({ value, onChange, placeholder, label }) {
  return (
    <div className="article-picker-wrap position-relative">
      <Search aria-hidden="true" className="article-picker__icon" />
      <Form.Control type="search" size="sm" className="article-picker__input" aria-label={label} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}
