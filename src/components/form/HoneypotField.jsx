// A trap for bots: a text field people never see or reach (hidden with the Bootstrap "visually-hidden" CSS, not display:none,
// because some bots skip fields that are display:none). It stays empty for a person; the backend ignores a request in which
// `website` has a value. Not in the tab order, no autofill, hidden from screen readers.
export default function HoneypotField({ id, value, onChange }) {
  return (
    <div className="visually-hidden" aria-hidden="true">
      <label htmlFor={id}>Website</label>
      <input id={id} name="website" type="text" tabIndex={-1} autoComplete="off" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}
